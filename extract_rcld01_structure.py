#!/usr/bin/env python3
import openpyxl
import os
import json

base = os.path.join(os.path.dirname(__file__), '..', 'SGIA Limpieza', 'RC.LD.01_REGISTRO  L+D IG_AU_2026')

output = []

for fname in sorted(os.listdir(base)):
    if not fname.endswith('.xlsx') or fname.startswith('~$'):
        continue
    fpath = os.path.join(base, fname)
    try:
        wb = openpyxl.load_workbook(fpath, read_only=True, data_only=True)
        ws = wb.active
        rows_data = []
        for row in ws.iter_rows(max_row=50, values_only=True):
            cleaned = [str(c).strip() if c else '' for c in row]
            rows_data.append(cleaned)
        output.append({'file': fname, 'rows': rows_data})
        wb.close()
    except Exception as e:
        output.append({'file': fname, 'error': str(e)})

out_path = os.path.join(os.path.dirname(__file__), 'rcld01_extracted.json')
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(output, f, ensure_ascii=False, indent=2)
print(f'Wrote {len(output)} files to {out_path}')
