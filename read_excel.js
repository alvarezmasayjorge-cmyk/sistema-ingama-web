const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const dir = '/Users/jorgealvarez/Desktop/Sistema INGAMA/SGIA Limpieza/RC.LD.01_REGISTRO  L+D IG_AU_2026';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.xlsx') && !f.startsWith('~'));

console.log(`Found ${files.length} files.`);

for (let i = 0; i < Math.min(files.length, 3); i++) {
  console.log(`\n--- Reading file: ${files[i]} ---`);
  const filePath = path.join(dir, files[i]);
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet, {header: 1});
  
  for (let r = 0; r < Math.min(data.length, 25); r++) {
    console.log(`Row ${r}:`, JSON.stringify(data[r]));
  }
}
