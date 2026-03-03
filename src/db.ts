import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'database.sqlite');
const db = new Database(dbPath);

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    name TEXT,
    role TEXT DEFAULT 'user',
    password_hash TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS envelopes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    title TEXT,
    status TEXT DEFAULT 'draft', -- draft, pending, completed, declined, recalled, expired
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    envelope_id INTEGER,
    filename TEXT,
    filepath TEXT,
    page_count INTEGER DEFAULT 1,
    display_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (envelope_id) REFERENCES envelopes(id)
  );

  CREATE TABLE IF NOT EXISTS recipients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    envelope_id INTEGER,
    email TEXT,
    name TEXT,
    role TEXT DEFAULT 'signer', -- signer, viewer, approver
    status TEXT DEFAULT 'pending', -- pending, sent, viewed, signed
    signing_order INTEGER DEFAULT 1,
    access_code TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (envelope_id) REFERENCES envelopes(id)
  );

  CREATE TABLE IF NOT EXISTS fields (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    envelope_id INTEGER,
    document_id INTEGER,
    recipient_id INTEGER,
    type TEXT, -- signature, initial, date, text, checkbox, etc.
    page INTEGER DEFAULT 1,
    x REAL,
    y REAL,
    width REAL,
    height REAL,
    value TEXT,
    required BOOLEAN DEFAULT 1,
    label TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (envelope_id) REFERENCES envelopes(id),
    FOREIGN KEY (document_id) REFERENCES documents(id),
    FOREIGN KEY (recipient_id) REFERENCES recipients(id)
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    envelope_id INTEGER,
    action TEXT, -- created, sent, viewed, signed, completed, declined
    description TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (envelope_id) REFERENCES envelopes(id)
  );
`);

// Seed a default user if not exists
const checkUser = db.prepare('SELECT * FROM users WHERE email = ?').get('demo@etalas.com');
if (!checkUser) {
  db.prepare('INSERT INTO users (email, name, role, password_hash) VALUES (?, ?, ?, ?)').run(
    'demo@etalas.com',
    'Demo User',
    'admin',
    'password' // In a real app, hash this!
  );
}

export default db;
