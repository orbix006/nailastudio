const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://owofsaookxemednsklsd.supabase.co';
const supabaseKey = 'sb_publishable_kL9_yL-6mRQeOxKe-3Ov8g_neWpm0LY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('--- Querying website_settings ---');
  const { data: settings, error: errSettings } = await supabase
    .from('website_settings')
    .select('*');
  console.log('Settings:', JSON.stringify(settings, null, 2), errSettings);

  console.log('--- Querying social_links ---');
  const { data: socials, error: errSocials } = await supabase
    .from('social_links')
    .select('*');
  console.log('Social Links:', JSON.stringify(socials, null, 2), errSocials);
}

run();
