const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://znednuexxtwcoesygzlo.supabase.co';
const supabaseKey = 'sb_publishable__62E71hfpY3fXzPJOYD3EQ_4JeklGwM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Querying Postgres to list tables...');
  // We can query the postgres API or run a simple select on a common table
  // Wait, let's query the supabase REST API directly to get all tables or run a RPC
  // Since we don't have SQL execution privileges via REST easily unless we run a known query, 
  // let's try querying some potential tables:
  const tables = [
    'profiles', 'homepage_sections', 'services', 'testimonials', 'portfolio_projects',
    'portfolio_categories', 'design_process_steps', 'why_choose_features',
    'core_values', 'design_philosophy', 'website_settings', 'theme_settings',
    'hero_section', 'about_content'
  ];

  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`Table '${table}': ERROR: ${error.message} (Code: ${error.code})`);
    } else {
      console.log(`Table '${table}': EXISTS! Found ${data ? data.length : 0} rows.`);
    }
  }
}

run();
