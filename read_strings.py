import zipfile
import xml.etree.ElementTree as ET
import glob

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

file_name = files[0]
print(f"Reading: {file_name.split('/')[-1]}")
with zipfile.ZipFile(file_name, 'r') as z:
    ss = get_shared_strings(z)
    for i, s in enumerate(ss):
        print(f"{i}: {s}")
