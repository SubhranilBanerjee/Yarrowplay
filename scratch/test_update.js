const { createClient } = require('@supabase/supabase-js');

const url = 'https://yhtejnjrjqpzyowldhky.supabase.co/';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlodGVqbmpyanFwenlvd2xkaGt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2NzA3MzYsImV4cCI6MjEwNDI0NjczNn0.Two3nyfBKYD6SJJZ5Yi26IQIdv-1uC_fvmRLk_kDrwg';

const supabase = createClient(url, anonKey);

async function testUpdate() {
  const { data: vids } = await supabase.from('videos').select('id, title, status').limit(1);
  if (vids && vids.length > 0) {
    const target = vids[0];
    console.log('Target:', target);
    const updateRes = await supabase.from('videos').update({ status: 'archived' }).eq('id', target.id).select();
    console.log('Update result:', updateRes);
  }
}

testUpdate();
