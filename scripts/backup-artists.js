#!/usr/bin/env node

/**
 * Backup artists to a timestamped file
 * Usage: node scripts/backup-artists.js
 */

const fs = require('fs');
const path = require('path');

const ARTISTS_FILE = path.join(__dirname, '../artist_styles.json');
const BACKUP_DIR = path.join(__dirname, '../backups');

async function backup() {
  try {
    // Create backups directory if it doesn't exist
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR);
    }

    // Read current artists
    const data = fs.readFileSync(ARTISTS_FILE, 'utf-8');
    const artists = JSON.parse(data);

    // Create backup filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(BACKUP_DIR, `artist_styles_${timestamp}.json`);

    // Write backup
    fs.writeFileSync(backupFile, JSON.stringify(artists, null, 2));

    console.log('✅ Backup created successfully!');
    console.log(`📁 File: ${backupFile}`);
    console.log(`🎵 Artists: ${Object.keys(artists.artists).length}`);

  } catch (error) {
    console.error('❌ Error creating backup:', error.message);
    process.exit(1);
  }
}

backup();
