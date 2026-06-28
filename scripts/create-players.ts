/**
 * Turnuva katılımcılarını oluştur.
 * Kullanım: bun run scripts/create-players.ts
 *
 * ÖNCE: .env dosyanda SUPABASE_SERVICE_ROLE_KEY production key olmalı!
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

async function createPlayers() {
  if (!SERVICE_KEY) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY .env dosyasında tanımlı değil');
    process.exit(1);
  }

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // ── Admin ──
  const adminEmail = 'erenkeskin@vignetim.com';
  const adminPassword = 'admin123';

  const { data: adminSignUp } = await supabase.auth.signUp({
    email: adminEmail,
    password: adminPassword,
    options: { data: { username: 'The CTO' } },
  });

  let adminId = adminSignUp.user?.id;
  if (adminId) {
    console.log('✅ Admin (The CTO) oluşturuldu');
  } else {
    const { data: signIn } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword,
    });
    adminId = signIn.user?.id;
    console.log('✅ Admin (The CTO) zaten var, giriş yapıldı');
  }

  if (adminId) {
    await supabase
      .from('profiles')
      .update({ is_admin: true, tournament_status: 'APPROVED' })
      .eq('id', adminId);
  }

  // ── Oyuncular ──
  const players = [
    { email: 'gorkemcolak0@gmail.com',         password: 'turnuva25', username: 'Görkem' },
    { email: 'keremdemirturk@vignetim.com',    password: 'turnuva25', username: 'KBHH' },
    { email: 'ramiskalkan@vignetim.com',       password: 'turnuva25', username: 'Ramis' },
    { email: 'ibrahimaydin@vignetim.com',      password: 'turnuva25', username: 'İbrahim' },
    { email: 'mehmettopak@vignetim.com',       password: 'turnuva25', username: 'Mehmet' },
    { email: 'alikilic@vignetim.com',          password: 'turnuva25', username: 'Ali' },
    { email: 'dicletemiz@vignetim.com',        password: 'turnuva25', username: 'İhsan' },
  ];

  const playerIds: string[] = [];

  for (const p of players) {
    const { data, error } = await supabase.auth.signUp({
      email: p.email,
      password: p.password,
      options: { data: { username: p.username } },
    });

    let userId = data.user?.id;

    if (error || !userId) {
      const { data: signIn } = await supabase.auth.signInWithPassword({
        email: p.email,
        password: p.password,
      });
      userId = signIn.user?.id;
    }

    if (userId) {
      await supabase.from('profiles').update({ tournament_status: 'APPROVED' }).eq('id', userId);
      playerIds.push(userId);
      console.log(`✅ ${p.username} (${p.email}) — hazır`);
    } else {
      console.log(`❌ ${p.username} oluşturulamadı`);
    }
  }

  console.log(`\n📋 ${playerIds.length} oyuncu + 1 admin hazır.`);
  console.log('\n🔑 Giriş bilgileri:');
  console.log('   Admin:  erenkeskin@vignetim.com / admin123');
  console.log('   Oyuncu şifresi (herkes): turnuva25');
}

createPlayers().catch(console.error);
