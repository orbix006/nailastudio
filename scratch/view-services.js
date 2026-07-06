const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://znednuexxtwcoesygzlo.supabase.co';
const supabaseKey = 'sb_publishable__62E71hfpY3fXzPJOYD3EQ_4JeklGwM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Querying services...');
  const { data: services, error } = await supabase.from('services').select('*');
  console.log('Services:', services, error);

  console.log('Querying homepage_sections...');
  const { data: homeSections, error: err2 } = await supabase.from('homepage_sections').select('*');
  console.log('Homepage Sections:', homeSections, err2);
}

run();
