import requests
import pdfplumber
import io
import urllib3
import re
import json
import time
from bs4 import BeautifulSoup

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

BASE_URL = "https://ivac-eei.eus"
START_URL = "https://ivac-eei.eus/es/"

def get_soup(url):
    try:
        resp = requests.get(url, verify=False, timeout=20)
        resp.raise_for_status()
        return BeautifulSoup(resp.content, 'html.parser')
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None

def get_pdf_content(url):
    try:
        print(f"Downloading PDF: {url}")
        resp = requests.get(url, verify=False, timeout=30)
        resp.raise_for_status()
        return io.BytesIO(resp.content)
    except Exception as e:
        print(f"Error downloading PDF {url}: {e}")
        return None

def get_level(name):
    u = name.upper()
    if "PROFESIONAL BÁSICO" in u or "BÁSICA" in u:
        return "BÁSICA"
    if "SUPERIOR" in u:
        return "GRADO SUPERIOR"
    if "TÉCNICO" in u or "MEDIO" in u:
        return "GRADO MEDIO"
    return "OTROS"

def extraer_codigos(text):
    cycle_map = {}
    matches = re.findall(r'([A-Z]{4}\d)\s*=\s*(.+)', text)
    for code, name in matches:
        code = code.strip()
        name = name.strip()
        
        # STRICT NAME CHECK: Must start with specific keywords
        name_upper = name.upper()
        if not (name_upper.startswith("TÉCNICO") or name_upper.startswith("TECNICO") or 
                name_upper.startswith("PROFESIONAL") or name_upper.startswith("CURSO") or
                name_upper.startswith("CERTIFICADO") or name_upper.startswith("TÍTULO")):
            continue

        if code not in cycle_map:
            print(f"DEBUG: Found Cycle Definition: {code} = {name}")
            cycle_map[code] = name
    return cycle_map

def extract_modules_grouped(pdf_stream):
    #cycle_map = {} # { Code: FullName }

    with pdfplumber.open(pdf_stream) as pdf:
        final_cycles = {}
        # Track processing
        started_extraction = False
        current_col_code_map = {}

        for page in pdf.pages:
            code_modules = []
            # 1. SCAN FOR DEFINITIONS ON THIS PAGE
            text = page.extract_text()
            if text:
                cycle_map =extraer_codigos(text)
                
            # 3. PROCESS TABLES
            tables = page.find_tables()
            if not tables: continue
            
            for table_obj in tables:
                table = table_obj.extract()
                if not table: continue
                if len(table) < 2: continue
                if 'DENOMINACIÓN' not in table[0]: continue
#
                start_row = 1
                for row in table[start_row:]:
                    if row[0] != '':
                        code_modules.append(row[0])

            # 4. Associate modules to each cycle
            # cycle_map is ordered (Python 3.7+): { code: full_name, ... }
            cycle_codes = list(cycle_map.keys())       # e.g. ['ADFI3', 'ASDI3']
            num_cycles = len(cycle_codes)

            # Build a dict: { cycle_full_name: [module_list] }
            page_cycles = {cycle_map[c]: [] for c in cycle_codes}
            cycle_names = list(page_cycles.keys())

            dual_code_pattern = re.compile(
                r'^([\w]+(?:\s*/\s*[\w]+)+)\.\s*(.+)$'
            )

            for mod in code_modules:
                if mod is None:
                    continue  # skip separators

                m = dual_code_pattern.match(mod)
                if m:
                    # e.g. '0660 / 0667. Formación en Centros de Trabajo'
                    codes_part = m.group(1)   # '0660 / 0667'
                    name_part  = m.group(2)   # 'Formación en Centros de Trabajo'
                    split_codes = [c.strip() for c in codes_part.split('/')]
                    # Assign each split code to the corresponding cycle (by position)
                    for i, sc in enumerate(split_codes):
                        if i < num_cycles:
                            page_cycles[cycle_names[i]].append(f"{sc}. {name_part}")
                else:
                    # Regular module → goes to every cycle
                    for cn in cycle_names:
                        page_cycles[cn].append(mod)

            # Merge page_cycles into final_cycles
            for cycle_name, mods in page_cycles.items():
                if cycle_name not in final_cycles:
                    final_cycles[cycle_name] = []
                final_cycles[cycle_name].extend(mods)

        # 5. Group by Level
        grouped_result = {
            "BÁSICA": {},
            "GRADO MEDIO": {},
            "GRADO SUPERIOR": {},
            "OTROS": {}
        }
        
        for name, mods in final_cycles.items():
            if not mods: continue
            lvl = get_level(name)
            
            # Simple guessing if get_level returns OTROS but name is Name-like
            if lvl == "OTROS":
                 # Maybe map had the level?
                 pass 

            grouped_result[lvl][name] = mods
            
        return {k: v for k, v in grouped_result.items() if v}

def main():
    print("Starting crawler...")
    soup = get_soup(START_URL)
    if not soup: return

    family_links = []
    for link in soup.find_all('a', href=True):
        href = link.get('href', '')
        if "/familias-profesionales/" in href and ".html" in href:
            full_url = BASE_URL + href if href.startswith('/') else href
            name = link.get_text(strip=True)
            if full_url not in [x[1] for x in family_links]:
                family_links.append((name, full_url))
    
    print(f"Found {len(family_links)} families.")
    results = {} 

    for fam_name, fam_url in family_links:
        print(f"Processing {fam_name}...")
        fam_soup = get_soup(fam_url)
        if not fam_soup: continue
        
        pdf_url = None
        for a in fam_soup.find_all('a', href=True):
            txt = a.get_text(strip=True).lower()
            h = a['href'].lower()
            if ("esquema" in txt or "esquema" in h) and ".pdf" in h:
                pdf_url = a['href']
                if pdf_url.startswith('/'):
                    pdf_url = BASE_URL + pdf_url
                pdf_url = pdf_url.replace(BASE_URL + "/", BASE_URL + "/") 
                break
        
        if pdf_url:
            print(f"Found PDF: {pdf_url}")
            pdf_stream = get_pdf_content(pdf_url)
            if pdf_stream:
                # Returns { Level: { Cycle: [Modules] } }
                grouped_data = extract_modules_grouped(pdf_stream)
                results[fam_name] = grouped_data
                print(f"Saved data for {fam_name}")
        else:
            print(f"No PDF found for {fam_name}")
        
    with open('modules.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print("Done. Saved to modules.json")

if __name__ == "__main__":
    main()
