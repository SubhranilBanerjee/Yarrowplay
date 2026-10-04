const { createClient } = require('@supabase/supabase-js');

const url = 'https://yhtejnjrjqpzyowldhky.supabase.co/';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlodGVqbmpyanFwenlvd2xkaGt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2NzA3MzYsImV4cCI6MjEwNDI0NjczNn0.Two3nyfBKYD6SJJZ5Yi26IQIdv-1uC_fvmRLk_kDrwg';

const supabase = createClient(url, anonKey);

async function checkCountAndDelete() {
  const { count: beforeCount } = await supabase.from('videos').select('*', { count: 'exact', head: true });
  console.log('Videos count before:', beforeCount);

  // Try to delete a video using anon client
  const { data: vids } = await supabase.from('videos').select('id, title').limit(1);
  if (vids && vids.length > 0) {
    const target = vids[0];
    console.log('Target video to test delete on:', target);
    const delRes = await supabase.from('videos').delete({ count: 'exact' }).eq('id', target.id).select();
    console.log('Delete result with anon client:', delRes);
  }

  const { count: afterCount } = await supabase.from('videos').select('*', { count: 'exact', head: true });
  console.log('Videos count after:', afterCount);
}

checkCountAndDelete();
