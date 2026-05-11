import zipfile
import xml.etree.ElementTree as ET
import glob
import re

files = glob.glob("/Users/jorgealvarez/Desktop/Sistema INGAMA/SGIA Limpieza/RC.LD.01_REGISTRO  L+D IG_AU_2026/*.xlsx")
files = [f for f in files if not f.split('/')[-1].startswith('~')]

def get_shared_strings(z):
    try:
        ss_data = z.read('xl/sharedStrings.xml')
        root = ET.fromstring(ss_data)
        namespaces = {'ns': root.tag.split('}')[0].strip('{')} if '}' in root.tag else {'ns': ''}
        return [t.text for t in root.findall('.//ns:t', namespaces) if t.text]
    except KeyError:
        return []

def get_sheet_data(z, shared_strings):
    try:
        # Just grab the first sheet. Usually sheet1.xml
        sheet_data = z.read('xl/worksheets/sheet1.xml')
        root = ET.fromstring(sheet_data)
        namespaces = {'ns': root.tag.split('}')[0].strip('{')} if '}' in root.tag else {'ns': ''}
        
        rows = []
        for row in root.findall('.//ns:row', namespaces):
            row_data = []
            for c in row.findall('.//ns:c', namespaces):
                v = c.find('ns:v', namespaces)
                if v is not None:
                    val = v.text
                    if c.attrib.get('t') == 's':  # shared string
                        val = shared_strings[int(val)]
                    row_data.append(val)
                else:
                    row_data.append(None)
            rows.append(row_data)
        return rows
    except Exception as e:
        return str(e)

print(f"Found {len(files)} files.")
for f in files[:3]:
    print(f"\n--- Reading: {f.split('/')[-1]} ---")
    with zipfile.ZipFile(f, 'r') as z:
        ss = get_shared_strings(z)
        data = get_sheet_data(z, ss)
        if isinstance(data, list):
            for i, row in enumerate(data[:25]):
                print(f"Row {i}: {row}")
        else:
            print("Error reading sheet:", data)

