const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local manually to avoid dotenv dependency
const envPath = path.join(__dirname, '.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    process.env[match[1].trim()] = match[2].trim();
  }
});

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
sb.from('duels').select(`
    id, topic, status, current_round, max_rounds, challenger_score, opponent_score, challenger_position, opponent_position,
    challenger:profiles!challenger_id(username, avatar_url),
    opponent:profiles!opponent_id(username, avatar_url),
    winner:profiles!winner_id(username)
`).eq('post_id', 'e6a11429-f851-4703-9403-dc69f732976e').then(r => {
    console.log(JSON.stringify(r, null, 2));
}).catch(e => {
    console.error(e);
});
