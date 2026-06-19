/**
 * Seed script — creates test users and runs tournament flow.
 * Usage: bun run scripts/seed.ts [--reset]
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const API_URL = process.env.VITE_API_URL || 'http://localhost:3000';

async function seed() {
  const reset = process.argv.includes('--reset');

  if (!SERVICE_KEY) {
    console.error('SUPABASE_SERVICE_ROLE_KEY must be set in .env');
    process.exit(1);
  }

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  // Reset if requested
  if (reset) {
    console.log('Resetting tournament...');
    const { error } = await supabase.rpc('reset_tournament');
    if (error) {
      console.error('Reset failed:', error.message);
      process.exit(1);
    }
    console.log('Tournament reset complete.');
  }

  // Create test users (if they don't exist)
  const users = [
    { email: 'admin@vig.com', password: 'admin123', username: 'Admin', admin: true },
    { email: 'player1@vig.com', password: 'test123', username: 'Ahmet' },
    { email: 'player2@vig.com', password: 'test123', username: 'Mehmet' },
    { email: 'player3@vig.com', password: 'test123', username: 'Ayşe' },
    { email: 'player4@vig.com', password: 'test123', username: 'Zeynep' },
    { email: 'player5@vig.com', password: 'test123', username: 'Can' },
    { email: 'player6@vig.com', password: 'test123', username: 'Deniz' },
  ];

  const playerIds: string[] = [];

  for (const u of users) {
    // Try sign up (fails silently if exists)
    const { data, error } = await supabase.auth.signUp({
      email: u.email,
      password: u.password,
      options: { data: { username: u.username } },
    });

    let userId = data.user?.id;

    // If already exists, try sign in to get ID
    if (error) {
      const { data: signInData } = await supabase.auth.signInWithPassword({
        email: u.email,
        password: u.password,
      });
      userId = signInData.user?.id;
    }

    if (userId) {
      // Set admin
      if (u.admin) {
        await supabase.from('profiles').update({ is_admin: true }).eq('id', userId);
        console.log(`Admin: ${u.username} (${u.email})`);
      } else {
        // Approve players
        await supabase
          .from('profiles')
          .update({
            tournament_status: 'APPROVED',
          })
          .eq('id', userId);
        playerIds.push(userId);
        console.log(`Player: ${u.username} (${u.email})`);
      }
    }
  }

  // Assign avatars
  const avatars = ['lion', 'eagle', 'wolf', 'dragon', 'shark', 'tiger'];
  for (let i = 0; i < playerIds.length; i++) {
    await supabase
      .from('profiles')
      .update({
        avatar_url: avatars[i % avatars.length],
        selected_team: null, // Will be set via wheel
      })
      .eq('id', playerIds[i]!);
  }

  console.log(`\n${playerIds.length} players ready. Admin: admin@vig.com / admin123`);
  console.log('Player passwords: test123');

  // Auto-generate fixtures via API
  if (playerIds.length >= 2) {
    const adminSignIn = await supabase.auth.signInWithPassword({
      email: 'admin@vig.com',
      password: 'admin123',
    });
    const token = adminSignIn.data.session?.access_token;

    if (token) {
      const res = await fetch(`${API_URL}/api/admin/generate-fixtures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ playerIds }),
      });

      const result = await res.json();
      console.log(`\nFixtures: ${result.matches?.length || 0} matches created.`);
    }
  }

  console.log('\nSeed complete.');
}

seed().catch(console.error);
