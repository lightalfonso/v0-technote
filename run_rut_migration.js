const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Path to env file
const envPath = path.join(__dirname, '.env.local');

if (!fs.existsSync(envPath)) {
  console.error('.env.local file not found at:', envPath);
  process.exit(1);
}

// Parse DATABASE_URL
const envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split('\n');
let databaseUrl = '';
for (const line of lines) {
  if (line.startsWith('DATABASE_URL=')) {
    databaseUrl = line.split('DATABASE_URL=')[1].trim();
    // Strip quotes if any
    if (databaseUrl.startsWith('"') && databaseUrl.endsWith('"')) {
      databaseUrl = databaseUrl.slice(1, -1);
    }
    if (databaseUrl.startsWith("'") && databaseUrl.endsWith("'")) {
      databaseUrl = databaseUrl.slice(1, -1);
    }
  }
}

if (!databaseUrl) {
  console.error('DATABASE_URL not found in .env.local');
  process.exit(1);
}

console.log('Connecting to database...');

const client = new Client({
  connectionString: databaseUrl,
});

async function migrate() {
  try {
    await client.connect();
    console.log('Connected successfully. Executing migrations...');

    // 1. Add rut to clients
    await client.query(`
      ALTER TABLE clients ADD COLUMN IF NOT EXISTS rut text;
    `);
    console.log('Clients table updated with rut column.');

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.end();
  }
}

migrate();
