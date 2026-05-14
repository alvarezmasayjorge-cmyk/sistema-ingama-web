const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Use absolute path to avoid issues
const base = path.join(__dirname, '..', 'SGIA Limpieza', 'RC.LD.01_REGISTRO  L+D IG_AU_2026');

console.log('Looking in:', base);
console.log('Exists:', fs.existsSync(base));

if (!fs.existsSync(base)) {
  // Try to find it
  const parent = path.join(__dirname, '..', 'SGIA Limpieza');
  console.log('Parent exists:', fs.existsSync(parent));
  if (fs.existsSync(parent)) {
    console.log('Contents:', fs.readdirSync(parent));
  }
  process.exit(1);
}

const files = fs.readdirSync(base).filter(f => f.endsWith('.xlsx') && !f.startsWith('~'));
console.log('Found', files.length, 'xlsx files');

const results = [];
files.sort().forEach(fname => {
  try {
    const wb = XLSX.readFile(path.join(base, fname));
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    results.push({ file: fname, rows: data.slice(0, 50) });
    console.log('OK:', fname);
  } catch (e) {
    results.push({ file: fname, error: e.message });
    console.log('ERR:', fname, e.message);
  }
});

fs.writeFileSync(path.join(__dirname, 'rcld01_data.json'), JSON.stringify(results, null, 2));
console.log('Wrote rcld01_data.json with', results.length, 'files');
