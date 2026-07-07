const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://owofsaookxemednsklsd.supabase.co';
const supabaseKey = 'sb_publishable_kL9_yL-6mRQeOxKe-3Ov8g_neWpm0LY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('--- Querying design_process_steps ---');
  const { data: steps, error: errSteps } = await supabase
    .from('design_process_steps')
    .select('*')
    .eq('is_visible', true)
    .order('display_order', { ascending: true });
  console.log('Steps:', JSON.stringify(steps, null, 2), errSteps);
}

run();
