import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import db from '../db';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Create notifications table
db.prepare(`
  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    is_read BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

// --- Contacts ---

router.get('/contacts', (req, res) => {
  const contacts = db.prepare(`
    SELECT DISTINCT email, name, role 
    FROM recipients 
    WHERE email IS NOT NULL AND email != ''
    GROUP BY email
    ORDER BY name ASC
  `).all();
  res.json(contacts);
});

// --- Envelopes ---

// Get all envelopes
router.get('/envelopes', (req, res) => {
  const stmt = db.prepare('SELECT * FROM envelopes ORDER BY created_at DESC');
  const envelopes = stmt.all();
  res.json(envelopes);
});

// Create new envelope (draft)
router.post('/envelopes', (req, res) => {
  const { title, user_id } = req.body;
  const stmt = db.prepare('INSERT INTO envelopes (title, user_id, status) VALUES (?, ?, ?)');
  const info = stmt.run(title || 'Untitled Envelope', user_id || 1, 'draft');
  
  // Audit Log
  db.prepare('INSERT INTO audit_logs (envelope_id, action, description) VALUES (?, ?, ?)').run(
    info.lastInsertRowid, 
    'created', 
    `Envelope created by User ${user_id || 1}`
  );

  res.json({ id: info.lastInsertRowid });
});

// Get single envelope with details
router.get('/envelopes/:id', (req, res) => {
  const { id } = req.params;
  const envelope = db.prepare('SELECT * FROM envelopes WHERE id = ?').get(id);
  if (!envelope) return res.status(404).json({ error: 'Envelope not found' });

  const documents = db.prepare('SELECT * FROM documents WHERE envelope_id = ?').all(id);
  const recipients = db.prepare('SELECT * FROM recipients WHERE envelope_id = ?').all(id);
  const fields = db.prepare('SELECT * FROM fields WHERE envelope_id = ?').all(id);
  const audit_logs = db.prepare('SELECT * FROM audit_logs WHERE envelope_id = ? ORDER BY created_at ASC').all(id);

  res.json({ ...envelope, documents, recipients, fields, audit_logs });
});

// Update envelope status
router.put('/envelopes/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const stmt = db.prepare('UPDATE envelopes SET status = ? WHERE id = ?');
  stmt.run(status, id);

  // Audit Log
  let action = 'updated';
  let description = `Status updated to ${status}`;
  
  if (status === 'pending') {
    action = 'sent';
    description = 'Envelope sent to recipients';
    
    // Create notifications for recipients
    const recipients = db.prepare('SELECT * FROM recipients WHERE envelope_id = ?').all(id);
    const insertNotif = db.prepare('INSERT INTO notifications (user_id, title, message, link) VALUES (?, ?, ?, ?)');
    
    for (const r of recipients) {
      insertNotif.run(
        1, // Assign to demo user for prototype visibility
        'Action Required', 
        `Please sign document: ${id}`, 
        `/sign/${id}`
      );
    }
  } else if (status === 'completed') {
    action = 'completed';
    description = 'Envelope completed by all signers';
    
    // Notify owner
    db.prepare('INSERT INTO notifications (user_id, title, message, link) VALUES (?, ?, ?, ?)').run(
      1, 
      'Document Completed', 
      `Envelope #${id} has been signed by all parties`, 
      `/envelopes/${id}`
    );
  } else if (status === 'declined') {
    action = 'declined';
    description = 'Envelope declined by a recipient';
    
    // Notify owner
    db.prepare('INSERT INTO notifications (user_id, title, message, link) VALUES (?, ?, ?, ?)').run(
      1, 
      'Document Declined', 
      `Envelope #${id} was declined`, 
      `/envelopes/${id}`
    );
  }

  db.prepare('INSERT INTO audit_logs (envelope_id, action, description) VALUES (?, ?, ?)').run(id, action, description);

  res.json({ success: true });
});

// --- Notifications ---

router.get('/notifications', (req, res) => {
  const notifications = db.prepare('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 20').all();
  res.json(notifications);
});

router.put('/notifications/:id/read', (req, res) => {
  const { id } = req.params;
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(id);
  res.json({ success: true });
});

// --- Documents ---

// Upload document to envelope
router.post('/envelopes/:id/documents', upload.single('file'), (req, res) => {
  const { id } = req.params;
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const stmt = db.prepare('INSERT INTO documents (envelope_id, filename, filepath) VALUES (?, ?, ?)');
  const info = stmt.run(id, req.file.filename, req.file.path);
  
  res.json({ id: info.lastInsertRowid, filename: req.file.filename });
});

// --- Recipients ---

// Add recipient
router.post('/envelopes/:id/recipients', (req, res) => {
  const { id } = req.params;
  const { email, name, role } = req.body;
  const stmt = db.prepare('INSERT INTO recipients (envelope_id, email, name, role) VALUES (?, ?, ?, ?)');
  const info = stmt.run(id, email, name, role || 'signer');
  res.json({ id: info.lastInsertRowid });
});

// Update recipient
router.put('/envelopes/:id/recipients/:recipientId', (req, res) => {
  const { recipientId } = req.params;
  const { email, name, role } = req.body;
  const stmt = db.prepare('UPDATE recipients SET email = ?, name = ?, role = ? WHERE id = ?');
  stmt.run(email, name, role, recipientId);
  res.json({ success: true });
});

// --- Fields ---

// Add/Update fields (bulk)
router.post('/envelopes/:id/fields', (req, res) => {
  const { id } = req.params;
  const { fields } = req.body; // Array of fields
  
  // Transaction to replace fields or update
  const insert = db.prepare(`
    INSERT INTO fields (envelope_id, document_id, recipient_id, type, page, x, y, width, height, value, label)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const deleteFields = db.prepare('DELETE FROM fields WHERE envelope_id = ?');

  const transaction = db.transaction((fields) => {
    deleteFields.run(id);
    for (const field of fields) {
      insert.run(id, field.document_id, field.recipient_id, field.type, field.page, field.x, field.y, field.width, field.height, field.value, field.label);
    }
  });

  transaction(fields);
  res.json({ success: true });
});

// Update field values (signing)
router.put('/envelopes/:id/fields/values', (req, res) => {
  const { id } = req.params;
  const { values } = req.body; // Object { fieldId: value }

  const update = db.prepare('UPDATE fields SET value = ? WHERE id = ? AND envelope_id = ?');
  
  const transaction = db.transaction((values) => {
    for (const [fieldId, value] of Object.entries(values)) {
      update.run(value, fieldId, id);
    }
  });

  transaction(values);
  res.json({ success: true });
});

// --- Templates ---

// Get all templates
router.get('/templates', (req, res) => {
  const stmt = db.prepare("SELECT * FROM envelopes WHERE status = 'template' ORDER BY updated_at DESC");
  const templates = stmt.all();
  res.json(templates);
});

// Instantiate template
router.post('/envelopes/from-template', (req, res) => {
  const { templateId } = req.body;
  
  const template = db.prepare('SELECT * FROM envelopes WHERE id = ?').get(templateId);
  if (!template) return res.status(404).json({ error: 'Template not found' });

  // 1. Create new envelope
  const createEnv = db.prepare('INSERT INTO envelopes (title, user_id, status) VALUES (?, ?, ?)');
  const envInfo = createEnv.run(template.title, template.user_id, 'draft');
  const newEnvelopeId = envInfo.lastInsertRowid;

  // 2. Copy documents
  const docs = db.prepare('SELECT * FROM documents WHERE envelope_id = ?').all(templateId);
  const insertDoc = db.prepare('INSERT INTO documents (envelope_id, filename, filepath) VALUES (?, ?, ?)');
  for (const doc of docs) {
    insertDoc.run(newEnvelopeId, doc.filename, doc.filepath);
  }

  // 3. Copy recipients (optional, usually templates have roles but we'll copy structure)
  const recipients = db.prepare('SELECT * FROM recipients WHERE envelope_id = ?').all(templateId);
  const insertRecipient = db.prepare('INSERT INTO recipients (envelope_id, email, name, role) VALUES (?, ?, ?, ?)');
  const recipientMap = new Map(); // Old ID -> New ID
  
  for (const r of recipients) {
    const info = insertRecipient.run(newEnvelopeId, '', '', r.role); // Clear email/name for new instance
    recipientMap.set(r.id, info.lastInsertRowid);
  }

  // 4. Copy fields
  const fields = db.prepare('SELECT * FROM fields WHERE envelope_id = ?').all(templateId);
  const insertField = db.prepare(`
    INSERT INTO fields (envelope_id, document_id, recipient_id, type, page, x, y, width, height, value, label)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  // Need to map old document IDs to new ones too, but for simplicity assuming 1 doc or order match
  // A robust solution would map doc IDs too. For this prototype, we'll just grab the first new doc ID
  // or assume order preservation.
  const newDocs = db.prepare('SELECT * FROM documents WHERE envelope_id = ?').all(newEnvelopeId);
  
  for (const f of fields) {
    // Find corresponding new doc ID (by index or filename)
    const oldDocIndex = docs.findIndex(d => d.id === f.document_id);
    const newDocId = newDocs[oldDocIndex]?.id;
    const newRecipientId = recipientMap.get(f.recipient_id);

    if (newDocId && newRecipientId) {
      insertField.run(newEnvelopeId, newDocId, newRecipientId, f.type, f.page, f.x, f.y, f.width, f.height, f.value, f.label);
    }
  }

  res.json({ id: newEnvelopeId });
});

// Get global activity feed
router.get('/activity', (req, res) => {
  const activity = db.prepare(`
    SELECT a.*, e.title as envelope_title 
    FROM audit_logs a
    JOIN envelopes e ON a.envelope_id = e.id
    ORDER BY a.created_at DESC
    LIMIT 10
  `).all();
  res.json(activity);
});

// --- Reports ---

router.get('/stats', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as count FROM envelopes').get().count;
  const completed = db.prepare("SELECT COUNT(*) as count FROM envelopes WHERE status = 'completed'").get().count;
  const declined = db.prepare("SELECT COUNT(*) as count FROM envelopes WHERE status = 'declined'").get().count;
  const draft = db.prepare("SELECT COUNT(*) as count FROM envelopes WHERE status = 'draft'").get().count;
  const pending = db.prepare("SELECT COUNT(*) as count FROM envelopes WHERE status = 'pending'").get().count;

  // Activity (last 7 days)
  const activity = db.prepare(`
    SELECT date(created_at) as date, action, COUNT(*) as count 
    FROM audit_logs 
    WHERE action IN ('sent', 'completed') 
    AND created_at >= date('now', '-7 days')
    GROUP BY date(created_at), action
  `).all();

  res.json({
    total,
    completed,
    declined,
    draft,
    pending,
    activity
  });
});

export default router;
