const { createClient } = require('@supabase/supabase-js')
 
const supabase = createClient(
  'https://bckpsnxuvvlanwjciwau.supabase.co',
  'sb_publishable_5s1sGHQIob7Q6WVmpKX6sA_h7vZIdC8'
)
 
async function test() {
  const { data, error, count } = await supabase
    .from('socios')
    .select('*', { count: 'exact' })
  console.log('COUNT:', count)
  console.log('DATA:', data)
  console.log('ERROR:', error) 
}
 
test()
 
