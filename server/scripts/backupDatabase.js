// Wraps `mongodump` to produce a timestamped backup archive. Requires the MongoDB
// Database Tools (mongodump) to be installed on the host — this script does not
// reimplement dump logic itself, it just orchestrates it safely and predictably.
//
// Usage: npm run backup:db
// Output: server/backups/prernanode-YYYY-MM-DDTHH-mm-ss.gz
//
// Media (images/video/documents) is NOT included here — it lives in Cloudinary, which
// has its own retention/versioning. The backup strategy for media is: rely on
// Cloudinary as the source of truth (it's already off-server and redundant), and treat
// this script as covering the one thing that isn't already durably stored elsewhere —
// the MongoDB data.
require('dotenv').config();
const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

const BACKUP_DIR = path.join(__dirname, '..', 'backups');
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const archivePath = path.join(BACKUP_DIR, `prernanode-${timestamp}.gz`);

const uri = process.env.MONGO_URI;
if (!uri) {
  console.error('MONGO_URI is not set. Aborting backup.');
  process.exit(1);
}

console.log(`Starting backup to ${archivePath} ...`);

execFile('mongodump', ['--uri', uri, '--archive=' + archivePath, '--gzip'], (err, stdout, stderr) => {
  if (err) {
    console.error('Backup failed. Is `mongodump` installed and on your PATH?');
    console.error(err.message);
    process.exit(1);
  }
  console.log(stdout || stderr);
  console.log(`Backup complete: ${archivePath}`);

  // Keep the last 14 backups, prune older ones — a simple retention policy.
  const files = fs.readdirSync(BACKUP_DIR).filter((f) => f.endsWith('.gz')).sort();
  const toDelete = files.slice(0, Math.max(0, files.length - 14));
  toDelete.forEach((f) => fs.unlinkSync(path.join(BACKUP_DIR, f)));
  if (toDelete.length) console.log(`Pruned ${toDelete.length} old backup(s).`);
});
