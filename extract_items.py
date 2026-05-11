import zipfile
import xml.etree.ElementTree as ET
import glob
import json
import re
import os

# Define the paths
base_dir = "/Users/jorgealvarez/Desktop/Sistema INGAMA/SGIA Limpieza/RC.LD.01_REGISTRO  L+D IG_AU_2026"
output_file = "/Users/jorgealvarez/Desktop/Sistema INGAMA/sistema-web/src/data/areas_items.json"

files = glob.glob(os.path.join(base_dir, "*.xlsx"))
files = [f for f in files if not f.split('/')[-1].startswith('~')]

def get_shared_strings(z):
    try:
        ss_data = z.read('xl/sharedStrings.xml')
        root = ET.fromstring(ss_data)
        namespaces = {'ns': root.tag.split('}')[0].strip('{')} if '}' in root.tag else {'ns': ''}
        return [t.text.strip() for t in root.findall('.//ns:t', namespaces) if t.text and t.text.strip()]
    except KeyError:
        return []

IGNORE = [
    "ISO 22000", "ISO 22002-1", "N°", "-", "REGISTRO", "Horario de Limpieza", "Frecuencia de limpieza", 
    "I", "Inicio Jornada Laboral", "D", "Diaria", "✔", "F", "Finalizar Jornada laboral", "S", "Semanal", 
    "CP", "X", "Observaciones", "Orden", "Frecuencia", "Ítems de Limpieza / Frecuencia", "Eliminación de Residuos", 
    "BENEFICIADORA", "BENEFICIADORA INGAMA", "Q", "RC.LD.01", "Quincenal", "M", "LIMPIEZA Y DESINFECCION", 
    "Cambio de Proceso", "No. Revisión: 02", "No. Revisión: 03", "Vigente A Partir de 10-10-2025", 
    "Limpieza por Mantenimiento / Cambio de Proceso y Reapertura del área a proceso", "Firma del Resp. De Control", 
    "Fecha", "Calificación", "CR", "Cada Recepcción", "Se Realizo  la tarea", "LM", "Limpieza por Mantenimiento", 
    "No se realiazo la tarea", "Mensual", "LIR", "Limpieza Inicial/ Reapetura del Área a Proceso", 
    "Frecuencias de Limpieza", "Se Realizo la tarea", "No se realizo la tarea", "CADA VEZ QUE SEA NECESARIO",
    "Cada Vez que sea necesario", "Cada recepcion", "Se Realizo  la Tarea"
]

def is_ignored(s):
    s = s.strip()
    if len(s) <= 2: return True
    if s.startswith("Firma:") or s.startswith("Firma del") or s.startswith("Mes:") or s.startswith("Responsable") or s.startswith("ÁREA:"):
        return True
    if s.startswith("Vigente A Partir"): return True
    if s.lower() in [ig.lower() for ig in IGNORE]: return True
    return False

result = {}

print(f"Buscando archivos en: {base_dir}")
print(f"Archivos encontrados: {len(files)}")

for f in files:
    try:
        with zipfile.ZipFile(f, 'r') as z:
            ss = get_shared_strings(z)
            area = None
            for s in ss:
                if s.startswith("ÁREA:"):
                    area = s.split("ÁREA:")[1].strip()
                    break
            if not area:
                area = f.split('/')[-1].replace('.xlsx', '').split(' v3')[0].replace('Registros de L+D ', '').strip()
                
            items = []
            for s in ss:
                if not is_ignored(s):
                    clean_s = re.sub(r'\n\s*', ' ', s).strip()
                    if clean_s not in items:
                        items.append(clean_s)
            
            result[area] = items
            print(f"Procesado: {area} -> {len(items)} ítems encontrados.")
    except Exception as e:
        print(f"Error leyendo {f}: {e}")

os.makedirs(os.path.dirname(output_file), exist_ok=True)
with open(output_file, "w", encoding="utf-8") as out:
    json.dump(result, out, ensure_ascii=False, indent=2)

print(f"\n¡Éxito! Archivo JSON generado en: {output_file}")
