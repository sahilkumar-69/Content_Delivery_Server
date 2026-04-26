import pool from "./db.js";

export const initializeDatabase = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(190) NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role VARCHAR(20) NOT NULL CHECK (role IN ('principal', 'teacher')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS content (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      subject VARCHAR(120) NOT NULL,
      file_path TEXT NOT NULL,
      file_type VARCHAR(40) NOT NULL,
      file_size BIGINT NOT NULL,
      uploaded_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
      rejection_reason TEXT,
      approved_by INTEGER REFERENCES users(id),
      approved_at TIMESTAMPTZ,
      start_time TIMESTAMPTZ,
      end_time TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS content_slots (
      id SERIAL PRIMARY KEY,
      subject VARCHAR(120) NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS content_schedule (
      id SERIAL PRIMARY KEY,
      content_id INTEGER NOT NULL UNIQUE REFERENCES content(id) ON DELETE CASCADE,
      slot_id INTEGER NOT NULL REFERENCES content_slots(id) ON DELETE CASCADE,
      rotation_order INTEGER NOT NULL,
      duration_seconds INTEGER NOT NULL DEFAULT 30 CHECK (duration_seconds > 0),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (slot_id, rotation_order)
    );

    CREATE INDEX IF NOT EXISTS idx_content_status_subject ON content(status, subject);
    CREATE INDEX IF NOT EXISTS idx_content_uploaded_by ON content(uploaded_by);
    CREATE INDEX IF NOT EXISTS idx_schedule_slot_order ON content_schedule(slot_id, rotation_order);
  `);
};
