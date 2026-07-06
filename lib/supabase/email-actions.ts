'use server';

import { promises as fs } from 'fs';
import path from 'path';
import { createClient } from './server';

const templatesFilePath = path.join(process.cwd(), 'lib', 'email-templates.json');

export interface EmailTemplate {
  name: string;
  subject: string;
  title: string;
  body: string;
  button_text: string;
  button_url: string;
}

export interface EmailTemplatesCollection {
  contact_form: EmailTemplate;
  consultation_popup: EmailTemplate;
  booking_confirmation: EmailTemplate;
  admin_notification: EmailTemplate;
}

// 1. Fetch templates
export async function getEmailTemplatesAction(): Promise<EmailTemplatesCollection> {
  try {
    const data = await fs.readFile(templatesFilePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading email templates file:', err);
    throw new Error('Failed to load templates.');
  }
}

// 2. Save template modifications
export async function saveEmailTemplatesAction(templates: EmailTemplatesCollection) {
  try {
    await fs.writeFile(templatesFilePath, JSON.stringify(templates, null, 2), 'utf8');
    return { success: true };
  } catch (err: unknown) {
    console.error('Error writing email templates file:', err);
    const errorMsg = err instanceof Error ? err.message : 'Failed to save templates.';
    return { error: errorMsg };
  }
}

// Helper to replace variable interpolation placeholders
function compileTemplate(text: string, variables: Record<string, string>) {
  let compiled = text;
  Object.entries(variables).forEach(([key, val]) => {
    compiled = compiled.split(`{{${key}}}`).join(val);
  });
  return compiled;
}

// Generate the fully responsive luxury brand layout
function getEmailLayout(title: string, body: string, btnText: string, btnUrl: string) {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
  </head>
  <body style="margin:0; padding:0; background-color:#111111; font-family:'Helvetica Neue', Arial, sans-serif; color:#ffffff;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px; margin:40px auto; background-color:#161616; border:1px solid rgba(201,168,106,0.25); border-radius:12px; overflow:hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
      <tr>
        <td align="center" style="padding:30px 0 20px 0; border-bottom:1px solid rgba(201,168,106,0.15); background-color:#1e1e1e;">
          <h1 style="color:#C9A86A; font-family:Georgia, serif; font-size:24px; font-weight:normal; margin:0; letter-spacing:3px; text-transform:uppercase;">The Nailaa Studio</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:40px 30px; line-height:1.6; font-size:15px; color:#cccccc;">
          <h2 style="color:#ffffff; font-family:Georgia, serif; font-size:20px; font-weight:normal; margin-top:0; margin-bottom:20px;">${title}</h2>
          ${body}
          <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin-top:30px; margin-bottom:10px;">
            <tr>
              <td align="center" style="border-radius:4px; background-color:#C9A86A; box-shadow: 0 4px 10px rgba(201,168,106,0.2);">
                <a href="${btnUrl}" target="_blank" style="padding:12px 30px; display:inline-block; font-size:11px; font-weight:bold; color:#111111; text-decoration:none; letter-spacing:2px; text-transform:uppercase; font-family:sans-serif;">${btnText}</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding:20px 30px; font-size:11px; color:#666666; border-top:1px solid rgba(255,255,255,0.05); background-color:#101010; line-height:1.8;">
          <p style="margin:0 0 10px 0;">This is an automated message from The Nailaa Studio Curator Platform.</p>
          <p style="margin:0;">&copy; ${new Date().getFullYear()} The Nailaa Studio. All rights reserved.</p>
        </td>
      </tr>
    </table>
  </body>
</html>
  `;
}

// 3. Simulated automated email triggers
export async function sendEmailNotification(
  type: keyof EmailTemplatesCollection,
  toEmail: string,
  variables: Record<string, string>
) {
  try {
    const templates = await getEmailTemplatesAction();
    const template = templates[type];

    if (!template) {
      console.error(`Email template key "${type}" not found.`);
      return { error: 'Template not found' };
    }

    const compiledSubject = compileTemplate(template.subject, variables);
    const compiledTitle = compileTemplate(template.title, variables);
    const compiledBody = compileTemplate(template.body, variables);
    const compiledButtonText = compileTemplate(template.button_text, variables);
    const compiledButtonUrl = compileTemplate(template.button_url, variables);

    const compiledHtml = getEmailLayout(
      compiledTitle,
      compiledBody,
      compiledButtonText,
      compiledButtonUrl
    );

    // Logs output in console simulating server transaction
    console.log('==================================================');
    console.log(`SIMULATING EMAIL DISPATCH [Type: ${type}]`);
    console.log(`TO: ${toEmail}`);
    console.log(`SUBJECT: ${compiledSubject}`);
    console.log('==================================================');

    // Logs event to DB audit trail for administrators accountability tracking
    const supabase = await createClient();
    const { error: logErr } = await supabase.from('audit_logs').insert({
      action: 'insert',
      table_name: 'email_dispatches',
      metadata: {
        to_email: toEmail,
        template_type: type,
        subject: compiledSubject,
        html_body: compiledHtml,
      },
    });

    if (logErr) {
      console.error('Failed to log email dispatch in audit logs:', logErr);
    }

    return { success: true, compiledHtml };
  } catch (err: unknown) {
    console.error('Email dispatch simulation exception:', err);
    const errorMsg = err instanceof Error ? err.message : 'Simulation failed.';
    return { error: errorMsg };
  }
}

// 4. Send test email action from template editor
export async function sendTestEmailAction(
  type: keyof EmailTemplatesCollection,
  toEmail: string
) {
  return sendEmailNotification(type, toEmail, {
    CLIENT_NAME: 'Test Client',
    CLIENT_EMAIL: 'testclient@example.com',
    MESSAGE: '<p>This is a simulated test message containing variables.</p>',
  });
}
