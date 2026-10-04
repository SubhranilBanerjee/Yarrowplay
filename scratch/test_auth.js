const { createClient } = require('@supabase/supabase-js');

const url = 'https://yhtejnjrjqpzyowldhky.supabase.co/';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlodGVqbmpyanFwenlvd2xkaGt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2NzA3MzYsImV4cCI6MjEwNDI0NjczNn0.Two3nyfBKYD6SJJZ5Yi26IQIdv-1uC_fvmRLk_kDrwg';

const supabase = createClient(url, anonKey);

async function testLogins() {
  const credentials = [
    { email: 'admin@admin.com', password: 'password123' },
    { email: 'admin@admin.com', password: 'password' },
    { email: 'admin@admin.com', password: '123456' },
    { email: 'admin@dramabox.stream', password: 'Admin@DramaBox2026!' },
    { email: 'demo@test.com', password: 'password123' },
    { email: 'demo@test.com', password: '123456' },
    { email: 'subhranilbanrg2@gmail.com', password: 'password123' },
    { email: 'subhranilbanrg2@gmail.com', password: '123456' },
  ];

  for (const cred of credentials) {
    const { data, error } = await supabase.auth.signInWithPassword(cred);
    console.log(`Login attempt for ${cred.email} with ${cred.password}:`, error ? error.message : 'SUCCESS! User ID: ' + data.user?.id);
  }
}

testLogins();
