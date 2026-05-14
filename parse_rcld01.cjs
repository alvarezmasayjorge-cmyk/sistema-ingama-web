const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./rcld01_data.json', 'utf8'));

const areas = [];

data.forEach(file => {
  if (file.error) return;
  
  const rows = file.rows;
  let areaName = '';
  let items = [];
  let freqs = [];
  let moments = [];
  
  rows.forEach((row, ri) => {
    // Find area name
    row.forEach(cell => {
      if (typeof cell === 'string' && cell.startsWith('ÁREA:')) {
        areaName = cell.replace('ÁREA:', '').trim();
      }
      if (typeof cell === 'string' && cell.startsWith('Área:')) {
        areaName = cell.replace('Área:', '').trim();
      }
    });
    
    // Find items row - the one with "Orden" 
    if (row.includes('Orden') || row[1] === 'Orden') {
      // Items are in the same row as "Orden"
      const nonEmpty = [];
      row.forEach((cell, ci) => {
        if (ci > 1 && cell && cell !== '' && cell !== 'Orden') {
          nonEmpty.push(String(cell).trim());
        }
      });
      items = nonEmpty.filter(i => i && i.length > 1 && !['CP', 'LM', '-'].includes(i));
    }
    
    // Find frequency row
    if (row[0] === 'Frecuencia' || (typeof row[0] === 'string' && row[0].includes('Frecuencia'))) {
      row.forEach((cell, ci) => {
        if (ci > 0 && cell && ['D', 'S', 'Q', 'M', 'CP', 'LM'].includes(String(cell).trim())) {
          freqs.push(String(cell).trim());
        }
      });
    }
    
    // Find moment row (I/F)
    if (row[0] === 'Fecha ' || row[0] === 'Fecha' || (typeof row[0] === 'string' && row[0].trim() === 'Fecha')) {
      row.forEach((cell, ci) => {
        if (ci > 0 && cell && ['I', 'F', '-'].includes(String(cell).trim())) {
          moments.push(String(cell).trim());
        }
      });
    }
  });
  
  areas.push({
    file: file.file,
    areaName,
    itemCount: items.length,
    items,
    freqs: freqs.slice(0, items.length * 2), // may have extra
    moments: moments.slice(0, items.length * 2),
  });
});

// Print summary
areas.forEach(a => {
  console.log(`\n${a.file}`);
  console.log(`  Area: ${a.areaName || '(not found)'}`);
  console.log(`  Items (${a.itemCount}):`);
  a.items.forEach((item, i) => {
    const freq = a.freqs[i] || '?';
    console.log(`    ${i+1}. ${item} [${freq}]`);
  });
});

// Write structured output
fs.writeFileSync('./rcld01_structured.json', JSON.stringify(areas, null, 2));
console.log('\nWrote rcld01_structured.json');
