/* eslint-disable */
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('Error: .env.local file not found at:', envPath);
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
  const match = line.match(/^\s*([\w\.\-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    }
    env[match[1]] = value;
  }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseAnonKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Missing Supabase URL or Anon Key in .env.local');
  process.exit(1);
}

console.log('==================================================');
console.log('         AUTOMATED QUALITY ASSURANCE RUNNER       ');
console.log('==================================================');
console.log('Supabase End-point Target:', supabaseUrl);
console.log('--------------------------------------------------');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runChecks() {
  let failed = false;

  // 1. Connection check
  try {
    console.log('Checking database connection & site cache schema...');
    const { error } = await supabase.from('site_cache_version').select('*').limit(1);
    if (error) throw error;
    console.log('✔ Database connection OK.');
  } catch (err) {
    console.error('✘ Database connection FAILED:', err.message);
    failed = true;
  }

  // 2. SEO & Website Settings configuration check
  try {
    console.log('Checking website SEO & brand configurations...');
    const { data, error } = await supabase.from('website_settings').select('*').limit(1);
    if (error) throw error;
    console.log('✔ Website settings query succeeded. Record count:', data?.length);
  } catch (err) {
    console.error('✘ Website settings query FAILED:', err.message);
    failed = true;
  }

  // 3. Theme configurations check
  try {
    console.log('Checking theme and CSS variable variables...');
    const { data, error } = await supabase.from('theme_settings').select('*').limit(1);
    if (error) throw error;
    console.log('✔ Theme settings query succeeded. Primary Color:', data?.[0]?.primary_color);
  } catch (err) {
    console.error('✘ Theme settings query FAILED:', err.message);
    failed = true;
  }

  // 4. Services directory check
  try {
    console.log('Checking services directory catalog...');
    const { data, error } = await supabase.from('services').select('*').limit(10);
    if (error) throw error;
    console.log('✔ Services query succeeded. Record count:', data?.length);
  } catch (err) {
    console.error('✘ Services query FAILED:', err.message);
    failed = true;
  }

  // 5. Portfolio project catalog check
  try {
    console.log('Checking portfolio projects catalog...');
    const { data, error } = await supabase.from('portfolio_projects').select('*').limit(10);
    if (error) throw error;
    console.log('✔ Portfolio projects query succeeded. Record count:', data?.length);
  } catch (err) {
    console.error('✘ Portfolio projects query FAILED:', err.message);
    failed = true;
  }

  // 6. Media Library asset index check
  try {
    console.log('Checking Media Library file inventory...');
    const { data, error } = await supabase.from('media_library').select('*').limit(10);
    if (error) throw error;
    console.log('✔ Media Library query succeeded. Record count:', data?.length);
  } catch (err) {
    console.error('✘ Media Library query FAILED:', err.message);
    failed = true;
  }

  // 7. Inquiry Form validation & CRM insertion check
  let mockInquiryId = null;
  try {
    console.log('Checking Lead CRM insertion logic...');
    const mockInquiry = {
      full_name: 'QA Test Bot',
      email: 'qa@test.com',
      phone: '+1234567890',
      message: 'Automated QA pipeline verification request.',
    };

    const { data, error } = await supabase
      .from('inquiries')
      .insert(mockInquiry)
      .select('id')
      .single();

    if (error) throw error;
    mockInquiryId = data.id;
    console.log('✔ Inquiry form insertion succeeded. Created ID:', mockInquiryId);
  } catch (err) {
    console.error('✘ Lead CRM insertion FAILED:', err.message);
    failed = true;
  }

  // 8. Lead cleanup (CRM deletion check)
  if (mockInquiryId) {
    try {
      console.log('Cleaning up mock inquiry row...');
      const { error } = await supabase.from('inquiries').delete().eq('id', mockInquiryId);
      if (error) throw error;
      console.log('✔ CRM cleanup deletion succeeded.');
    } catch (err) {
      console.error('✘ CRM cleanup deletion FAILED:', err.message);
      failed = true;
    }
  }

  // 9. Audit Logs verification
  try {
    console.log('Checking system audit trail activity log logs...');
    const { data, error } = await supabase.from('audit_logs').select('*').limit(5);
    if (error) throw error;
    console.log('✔ Audit logs query succeeded. Event logs count:', data?.length);
  } catch (err) {
    console.error('✘ Audit logs query FAILED:', err.message);
    failed = true;
  }

  console.log('--------------------------------------------------');
  if (failed) {
    console.log('✘ QUALITY VERIFICATION COMPLETED WITH ERRORS.');
    process.exit(1);
  } else {
    console.log('✔ ALL DYNAMIC FEATURE QUALITY CHECKS PASSED SUCCESSFULLY.');
    process.exit(0);
  }
}

runChecks();
