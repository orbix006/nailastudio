const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://owofsaookxemednsklsd.supabase.co';
const supabaseKey = 'sb_publishable_kL9_yL-6mRQeOxKe-3Ov8g_neWpm0LY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('--- Updating website_settings ---');
  const { data: d1, error: e1 } = await supabase
    .from('website_settings')
    .update({
      contact_phone: '+91 93194 41282',
      contact_email: 'naila.support@gmail.com',
      whatsapp_number: '+919319441282'
    })
    .eq('id', true);
  console.log('Update Settings Result:', d1, e1);

  console.log('--- Updating social_links (Instagram) ---');
  const { data: d2, error: e2 } = await supabase
    .from('social_links')
    .update({
      url: 'https://www.instagram.com/the_nailaa_studio?igsh=Z253YmJqNG1nOTIx'
    })
    .eq('platform', 'instagram');
  console.log('Update Instagram Result:', d2, e2);

  console.log('--- Updating social_links (WhatsApp) ---');
  const { data: d3, error: e3 } = await supabase
    .from('social_links')
    .update({
      url: 'https://wa.me/919319441282'
    })
    .eq('platform', 'whatsapp');
  console.log('Update WhatsApp Result:', d3, e3);
}

run();
