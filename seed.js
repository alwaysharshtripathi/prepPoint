const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// 1. Read your credentials (replace these with your actual keys from .env.local)
const SUPABASE_URL = 'https://releiqtijqrcbzvpyyno.supabase.co'; // <-- PASTE REAL URL HERE
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlbGVpcXRpanFyY2J6dnB5eW5vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjkzMzk0NywiZXhwIjoyMTAyNTA5OTQ3fQ.eX8puJcg35gW6kTe-0XsNwyrHOCdcdYdBJfXKMMJDlM';             // <-- PASTE REAL KEY HERE

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function seedDatabase() {
  try {
    // 2. Read the JSON file you just created
    const rawData = fs.readFileSync('./import_data.json', 'utf8');
    const questions = JSON.parse(rawData);

    console.log(`Found ${questions.length} questions. Inserting into Supabase...`);

    // 3. Insert them all at once!
    const { data, error } = await supabase
      .from('questions')
      .insert(questions)
      .select();

    if (error) {
      console.error('❌ Supabase Error:', error.message);
      return;
    }

    console.log(`✅ Successfully inserted ${data.length} questions!`);
  } catch (err) {
    console.error('❌ Script Error:', err);
  }
}

seedDatabase();