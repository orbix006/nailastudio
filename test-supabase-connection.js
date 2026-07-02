const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://znednuexxtwcoesygzlo.supabase.co';
const supabaseKey = 'sb_publishable__62E71hfpY3fXzPJOYD3EQ_4JeklGwM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Querying site_cache_version...');
  const { data, error } = await supabase.from('site_cache_version').select('*');
  console.log('Result:', { data, error });

  console.log('Querying admin_profiles...');
  const { data: d2, error: e2 } = await supabase.from('admin_profiles').select('*');
  console.log('Result:', { d2, e2 });
}

run();
