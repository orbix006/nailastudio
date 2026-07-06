/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { createClient } from './server';
import { createAdminClient } from './admin';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export async function signInAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  const supabase = await createClient();
  const adminClient = createAdminClient() as any;
  const headerStore = await headers();

  const ipAddress = headerStore.get('x-forwarded-for')?.split(',')[0].trim() || null;
  const userAgent = headerStore.get('user-agent') || null;

  // Rate Limiting: Max 5 failed login attempts in last 15 minutes per IP or email
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  let orQuery = `attempted_email.eq.${email}`;
  if (ipAddress) {
    orQuery += `,ip_address.eq.${ipAddress}`;
  }

  const { count: failedAttemptsCount } = await adminClient
    .from('admin_login_logs')
    .select('id', { count: 'exact', head: true })
    .eq('success', false)
    .or(orQuery)
    .gte('created_at', fifteenMinutesAgo);

  if (failedAttemptsCount && failedAttemptsCount >= 5) {
    return { error: 'Too many failed login attempts. Please try again in 15 minutes.' };
  }

  // 1. Look up the admin profile to find the admin_id associated with this email
  const { data: profile } = (await adminClient
    .from('admin_profiles')
    .select('id, is_active')
    .eq('email', email)
    .maybeSingle()) as unknown as { data: { id: string; is_active: boolean } | null };

  // If the admin profile is disabled, reject immediately
  if (profile && !profile.is_active) {
    // Record failed attempt
    await adminClient.from('admin_login_logs').insert({
      admin_id: profile.id,
      attempted_email: email,
      success: false,
      ip_address: ipAddress,
      user_agent: userAgent,
      device_label: 'Web Browser (Disabled Account)',
    });
    return { error: 'This admin account has been deactivated.' };
  }

  // 2. Perform authentication
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Record failed attempt
    await adminClient.from('admin_login_logs').insert({
      admin_id: profile?.id || null,
      attempted_email: email,
      success: false,
      ip_address: ipAddress,
      user_agent: userAgent,
      device_label: 'Web Browser',
    });
    return { error: error.message };
  }

  const userId = data.user.id;

  // 3. Update last login on admin profile
  await adminClient
    .from('admin_profiles')
    .update({ last_login_at: new Date().toISOString(), failed_login_attempts: 0 })
    .eq('id', userId);

  // 4. Record successful login attempt
  await adminClient.from('admin_login_logs').insert({
    admin_id: userId,
    attempted_email: email,
    success: true,
    ip_address: ipAddress,
    user_agent: userAgent,
    device_label: 'Web Browser',
  });

  // Record login in general audit_logs
  await adminClient.from('audit_logs').insert({
    admin_id: userId,
    action: 'login',
    table_name: 'admin_profiles',
    record_id: userId,
    metadata: {
      email,
      ip_address: ipAddress,
      user_agent: userAgent,
    },
  });

  return { success: true };
}

export async function signOutAction() {
  const supabase = await createClient();
  const adminClient = createAdminClient() as any;
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    await adminClient.from('audit_logs').insert({
      admin_id: user.id,
      action: 'logout',
      table_name: 'admin_profiles',
      record_id: user.id,
      metadata: {
        email: user.email,
      },
    });
  }

  await supabase.auth.signOut();
  redirect('/admin/login');
}

/**
 * One-time action to register a Super Admin account.
 * Accessible in development or via a setup command.
 */
export async function createSuperAdminAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('fullName') as string;

  if (!email || !password || !fullName) {
    return { error: 'All fields are required.' };
  }

  const adminClient = createAdminClient() as any;

  // 1. Create auth user
  const { data: signUpData, error: signUpError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (signUpError) {
    return { error: signUpError.message };
  }

  const user = signUpData.user;

  if (!user) {
    return { error: 'Failed to create authentication user.' };
  }

  // 2. Insert admin profile with superadmin role
  const { error: profileError } = await adminClient.from('admin_profiles').insert({
    id: user.id,
    full_name: fullName,
    role: 'superadmin',
    is_active: true,
  });

  if (profileError) {
    // Cleanup auth user on profile insertion failure
    await adminClient.auth.admin.deleteUser(user.id);
    return { error: `Profile creation failed: ${profileError.message}` };
  }

  return { success: `Super Admin account ${email} created successfully!` };
}

export async function submitInquiryAction(payload: {
  name: string;
  email: string;
  phone_number: string;
  message: string;
  project_type_id: string;
  source: 'contact_form' | 'consultation_popup' | 'header_cta' | 'service_modal';
  referrer?: string;
}) {
  const { z } = await import('zod');

  const inquirySchema = z.object({
    name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
    email: z.string().email({ message: 'Please enter a valid email address.' }),
    phone_number: z.string().regex(/^[0-9+\-() ]{8,20}$/, {
      message: 'Phone number must be between 8 and 20 characters (+, -, () and spaces allowed).',
    }),
    message: z.string().min(5, { message: 'Message must be at least 5 characters.' }),
    project_type_id: z.string().uuid({ message: 'Please select a valid project type.' }),
    source: z.enum(['contact_form', 'consultation_popup', 'header_cta', 'service_modal']),
    referrer: z.string().optional(),
  });

  // 1. Perform validation
  const validation = inquirySchema.safeParse(payload);
  if (!validation.success) {
    const errorMsg = validation.error.issues[0]?.message || 'Validation failed.';
    return { error: errorMsg };
  }

  try {
    const supabase = await createClient();
    const headerStore = await headers();

    const ipAddress = headerStore.get('x-forwarded-for')?.split(',')[0].trim() || null;
    const userAgent = headerStore.get('user-agent') || null;

    // Rate Limiting: Max 5 submissions per hour per IP for this source, and max 10 total across all sources per IP
    if (ipAddress) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

      const { count: totalCount } = await supabase
        .from('inquiries')
        .select('id', { count: 'exact', head: true })
        .eq('submitted_ip', ipAddress)
        .gte('created_at', oneHourAgo);

      if (totalCount && totalCount >= 10) {
        return { error: 'Too many submissions. Please try again later.' };
      }

      const { count: sourceCount } = await supabase
        .from('inquiries')
        .select('id', { count: 'exact', head: true })
        .eq('submitted_ip', ipAddress)
        .eq('source', payload.source)
        .gte('created_at', oneHourAgo);

      if (sourceCount && sourceCount >= 5) {
        return { error: 'Too many submissions for this form. Please try again later.' };
      }
    }

    const sanitizeString = (str: string): string => {
      return str.replace(/<[^>]*>/g, '').trim();
    };

    // 2. Insert into inquiries
    const { data: inquiry, error: inquiryError } = await supabase
      .from('inquiries')
      .insert({
        name: sanitizeString(payload.name),
        email: payload.email.trim(),
        phone_number: payload.phone_number.trim(),
        message: sanitizeString(payload.message),
        project_type_id: payload.project_type_id,
        source: payload.source,
        submitted_ip: ipAddress,
      })
      .select('id')
      .maybeSingle();

    if (inquiryError) {
      console.error('Error inserting inquiry into Supabase:', inquiryError);
      return { error: 'Failed to submit inquiry. Please try again later.' };
    }

    // 3. Track analytics event
    const eventType = payload.source === 'consultation_popup' ? 'popup_submit' : 'contact_form_submit';
    
    await supabase.from('analytics_events').insert({
      event_type: eventType,
      entity_type: 'page',
      entity_id: null,
      page_slug: '/',
      session_id: null,
      referrer: payload.referrer || null,
      ip_address: ipAddress,
      user_agent: userAgent,
      metadata: {
        inquiry_id: inquiry?.id || null,
        source: payload.source,
      },
    });

    // 4. Trigger automated email notifications asynchronously
    try {
      const { sendEmailNotification } = await import('./email-actions');
      const clientTemplate = payload.source === 'consultation_popup' ? 'consultation_popup' : 'contact_form';
      const emailVariables = {
        CLIENT_NAME: payload.name,
        CLIENT_EMAIL: payload.email,
        MESSAGE: payload.message.replace(/\n/g, '<br>'),
      };

      // Email client confirmation
      sendEmailNotification(clientTemplate, payload.email, emailVariables).catch((err) =>
        console.error('Failed to dispatch client email notification:', err)
      );

      // Email admin alert notification
      sendEmailNotification('admin_notification', 'admin@thenailaastudio.com', emailVariables).catch((err) =>
        console.error('Failed to dispatch admin email notification:', err)
      );
    } catch (emailErr) {
      console.error('Failed to trigger email system wrapper:', emailErr);
    }

    return { success: true };
  } catch (err) {
    console.error('Inquiry submission exception:', err);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}

export async function saveAiConversationAction(payload: {
  sessionId: string;
  metadata: any;
  referrer?: string;
}) {
  try {
    const supabase = await createClient();
    const headerStore = await headers();
    const ipAddress = headerStore.get('x-forwarded-for')?.split(',')[0].trim() || null;
    const userAgent = headerStore.get('user-agent') || null;

    const { error } = await supabase.from('analytics_events').insert({
      event_type: 'popup_submit',
      entity_type: 'button',
      entity_id: null,
      page_slug: '/',
      session_id: payload.sessionId,
      referrer: payload.referrer || null,
      ip_address: ipAddress,
      user_agent: userAgent,
      metadata: {
        chat_session_id: payload.sessionId,
        ...payload.metadata,
      },
    });

    if (error) {
      console.error('Error saving AI conversation:', error);
      return { error: 'Failed to log conversation.' };
    }

    return { success: true };
  } catch (err: any) {
    console.error('saveAiConversationAction error:', err);
    return { error: err.message || 'An unexpected error occurred.' };
  }
}
