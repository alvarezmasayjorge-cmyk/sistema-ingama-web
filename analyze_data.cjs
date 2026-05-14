const d = require('./other_registers_data.json');
const out = [];

out.push('=== RC.LD.02 ===');
out.push('Sheets: ' + Object.keys(d.rcld02.sheets).join(', '));
Object.keys(d.rcld02.sheets).forEach(sn => {
  out.push('--- Sheet: ' + sn + ' ---');
  d.rcld02.sheets[sn].forEach((row, i) => {
    const ne = row.filter(c => c !== '');
    if (ne.length > 0) out.push('R' + i + ': ' + ne.join(' | '));
  });
});

out.push('\n=== RC.LD.03 ===');
out.push('Sheets: ' + Object.keys(d.rcld03.sheets).join(', '));
Object.keys(d.rcld03.sheets).forEach(sn => {
  out.push('--- Sheet: ' + sn + ' ---');
  d.rcld03.sheets[sn].forEach((row, i) => {
    const ne = row.filter(c => c !== '');
    if (ne.length > 0) out.push('R' + i + ': ' + ne.join(' | '));
  });
});

require('fs').writeFileSync('extracted_summary.txt', out.join('\n'));
console.log('Done - wrote ' + out.length + ' lines');
