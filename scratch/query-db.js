const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://owofsaookxemednsklsd.supabase.co';
const supabaseKey = 'sb_publishable_kL9_yL-6mRQeOxKe-3Ov8g_neWpm0LY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('--- Querying services ---');
  const { data: services, error: errServices } = await supabase
    .from('services')
    .select('*')
    .eq('is_visible', true)
    .is('deleted_at', null)
    .order('display_order', { ascending: true });
  console.log('Services:', JSON.stringify(services, null, 2), errServices);

  console.log('\n--- Querying why_choose_features ---');
  const { data: whyChoose, error: errWhyChoose } = await supabase
    .from('why_choose_features')
    .select('*')
    .eq('is_visible', true)
    .order('display_order', { ascending: true });
  console.log('Why Choose Us Features:', JSON.stringify(whyChoose, null, 2), errWhyChoose);
}

run();
