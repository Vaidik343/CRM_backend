'use strict';

const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const { sequelize } = require('../config/connectDB'); // adjust if your export is different

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Escape a JS value to a SQL-safe string literal.
 * Handles: null, boolean, number, Buffer (hex), Date, string.
 */
function escapeValue(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'number') return String(val);
  if (Buffer.isBuffer(val)) return `'\\x${val.toString('hex')}'`;
  if (val instanceof Date) return `'${val.toISOString()}'`;
  // string / object (json)
  const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
  return `'${str.replace(/'/g, "''")}'`;
}

/**
 * Map Sequelize/PostgreSQL type names → rough SQL DDL type.
 * Good enough for restore purposes.
 */
function mapType(colDef) {
  const t = (colDef.type || '').toUpperCase();
  if (t.includes('CHARACTER VARYING') || t.includes('VARCHAR')) {
    const len = colDef.length ? `(${colDef.length})` : '';
    return `VARCHAR${len}`;
  }
  if (t.includes('TEXT')) return 'TEXT';
  if (t.includes('INTEGER') || t === 'INT') return 'INTEGER';
  if (t.includes('BIGINT')) return 'BIGINT';
  if (t.includes('BOOLEAN')) return 'BOOLEAN';
  if (t.includes('TIMESTAMP')) return 'TIMESTAMP WITH TIME ZONE';
  if (t.includes('DATE')) return 'DATE';
  if (t.includes('FLOAT') || t.includes('DOUBLE') || t.includes('REAL')) return 'DOUBLE PRECISION';
  if (t.includes('DECIMAL') || t.includes('NUMERIC')) return 'NUMERIC';
  if (t.includes('UUID')) return 'UUID';
  if (t.includes('JSONB')) return 'JSONB';
  if (t.includes('JSON')) return 'JSON';
  if (t.includes('ENUM')) {
    // e.g. "ENUM('a','b')"  or  "USER-DEFINED"
    return 'TEXT'; // safest fallback — actual enum values come from data
  }
  if (t.includes('ARRAY')) return 'TEXT[]';
  return t || 'TEXT';
}

// ── Core dump function ────────────────────────────────────────────────────────

async function generateSQLDump() {
  const lines = [];

  lines.push('-- ============================================================');
  lines.push(`-- EWM CRM Database Backup`);
  lines.push(`-- Generated : ${new Date().toISOString()}`);
  lines.push('-- ============================================================');
  lines.push('');
  lines.push('SET client_encoding = \'UTF8\';');
  lines.push('SET standard_conforming_strings = on;');
  lines.push('');

  // Get all user tables (exclude system tables)
  const [tables] = await sequelize.query(`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename;
  `);

  for (const { tablename } of tables) {
    lines.push(`-- ------------------------------------------------------------`);
    lines.push(`-- Table: ${tablename}`);
    lines.push(`-- ------------------------------------------------------------`);

    // Get column info
    const [columns] = await sequelize.query(`
      SELECT
        column_name,
        data_type,
        character_maximum_length,
        is_nullable,
        column_default,
        udt_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = :tablename
      ORDER BY ordinal_position;
    `, { replacements: { tablename } });

    if (columns.length === 0) continue;

    // Build CREATE TABLE
    const colDefs = columns.map(col => {
      let typeSql;
      if (col.data_type === 'USER-DEFINED') {
        // enum or custom type — use TEXT for compatibility
        typeSql = 'TEXT';
      } else if (col.data_type === 'ARRAY') {
        typeSql = 'TEXT[]';
      } else if (col.data_type === 'character varying') {
        typeSql = col.character_maximum_length
          ? `VARCHAR(${col.character_maximum_length})`
          : 'VARCHAR';
      } else {
        typeSql = col.data_type.toUpperCase();
      }

      const nullable = col.is_nullable === 'YES' ? '' : ' NOT NULL';
      const def = col.column_default ? ` DEFAULT ${col.column_default}` : '';
      return `  "${col.column_name}" ${typeSql}${nullable}${def}`;
    });

    lines.push(`DROP TABLE IF EXISTS "${tablename}" CASCADE;`);
    lines.push(`CREATE TABLE IF NOT EXISTS "${tablename}" (`);
    lines.push(colDefs.join(',\n'));
    lines.push(');');
    lines.push('');

    // Dump rows in batches of 500
    const colNames = columns.map(c => `"${c.column_name}"`).join(', ');
    let offset = 0;
    const batchSize = 500;

    while (true) {
      const [rows] = await sequelize.query(
        `SELECT * FROM "${tablename}" LIMIT ${batchSize} OFFSET ${offset};`,
        { type: sequelize.QueryTypes.SELECT, raw: true }
      );

      if (!rows || rows.length === 0) break;

      lines.push(`-- ${tablename}: rows ${offset + 1}–${offset + rows.length}`);

      for (const row of rows) {
        const vals = columns.map(col => escapeValue(row[col.column_name])).join(', ');
        lines.push(`INSERT INTO "${tablename}" (${colNames}) VALUES (${vals});`);
      }
      lines.push('');

      if (rows.length < batchSize) break;
      offset += batchSize;
    }
  }

  lines.push('-- ============================================================');
  lines.push('-- End of backup');
  lines.push('-- ============================================================');

  return lines.join('\n');
}

// ── Controller ────────────────────────────────────────────────────────────────

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

async function downloadBackup(req, res) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const zipFilename = `ewm_backup_${timestamp}.zip`;

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${zipFilename}"`);

  const archive = archiver('zip', { zlib: { level: 6 } });

  archive.on('error', (err) => {
    console.error('❌ Backup archive error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Backup failed during archiving.' });
    }
  });

  // Pipe archive to response
  archive.pipe(res);

  // 1. Generate SQL dump and add as a file inside the zip
  console.log('📦 Generating SQL dump...');
  let sqlDump;
  try {
    sqlDump = await generateSQLDump();
  } catch (err) {
    console.error('❌ SQL dump failed:', err);
    return res.status(500).json({ error: 'SQL dump generation failed.', detail: err.message });
  }

  archive.append(sqlDump, { name: `db_backup_${timestamp}.sql` });
  console.log('✅ SQL dump added to archive.');

  // 2. Add uploads folder if it exists
  if (fs.existsSync(UPLOADS_DIR)) {
    archive.directory(UPLOADS_DIR, 'uploads');
    console.log('✅ Uploads folder added to archive.');
  } else {
    console.warn('⚠️ Uploads directory not found, skipping.');
  }

  await archive.finalize();
  console.log(`✅ Backup zip sent: ${zipFilename}`);
}

module.exports = { downloadBackup };
