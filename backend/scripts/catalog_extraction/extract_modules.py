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

def _is_module_row(row):
    """Return True if the row looks like a valid module data row (first cell has a code)."""
    if not row or row[0] is None:
        return False
    cell = str(row[0]).strip()
    # Module rows start with a numeric code like "0702" or an E-code like "E200"
    return bool(re.match(r'^[A-Z]?\d{3,4}[\s./]', cell))

def extract_modules_grouped(pdf_stream):
    with pdfplumber.open(pdf_stream) as pdf:
        final_cycles = {}
        cycle_map = {}
        # Flag: True once we have found a DENOMINACIÓN table on this PDF.
        in_module_table = False
        # Names of the cycles being filled — persists between pages for continuations.
        last_cycle_names = []

        dual_code_pattern = re.compile(
            r'^([\w]+(?:\s*/\s*[\w]+)+)\.\s*(.+)$'
        )

        for page in pdf.pages:
            # 1. SCAN FOR CYCLE DEFINITIONS ON THIS PAGE
            text = page.extract_text()
            if text:
                new_cycles = extraer_codigos(text)
                if new_cycles:
                    cycle_map = new_cycles

            # 2. COLLECT MODULE ROWS FROM TABLES
            tables = page.find_tables()
            if not tables:
                continue

            # Separate modules into:
            #   - normal_modules: from a table that starts with DENOMINACIÓN header
            #   - continuation_modules: from a table that continues from a previous page
            normal_modules = []
            continuation_modules = []

            for table_obj in tables:
                table = table_obj.extract()
                if not table or len(table) < 2:
                    continue

                if 'DENOMINACIÓN' in table[0]:
                    # New table with header → normal processing, update cycle context later
                    in_module_table = True
                    for row in table[1:]:
                        if row[0] is not None and str(row[0]).strip():
                            normal_modules.append(str(row[0]).strip())

                elif in_module_table and _is_module_row(table[0]):
                    # Continuation table (no header) → modules belong to last_cycle_names
                    for row in table:
                        if row[0] is not None and str(row[0]).strip():
                            continuation_modules.append(str(row[0]).strip())

            # 3a. Handle CONTINUATION modules first (append to cycles from previous page)
            if continuation_modules and last_cycle_names:
                for mod in continuation_modules:
                    m = dual_code_pattern.match(mod)
                    if m:
                        codes_part = m.group(1)
                        name_part  = m.group(2)
                        split_codes = [c.strip() for c in codes_part.split('/')]
                        for i, sc in enumerate(split_codes):
                            if i < len(last_cycle_names):
                                final_cycles[last_cycle_names[i]].append(f"{sc}. {name_part}")
                    else:
                        for cn in last_cycle_names:
                            final_cycles[cn].append(mod)

            # 3b. Handle NORMAL modules (from DENOMINACIÓN table on this page)
            if normal_modules and cycle_map:
                cycle_codes = list(cycle_map.keys())
                num_cycles  = len(cycle_codes)
                page_cycles = {cycle_map[c]: [] for c in cycle_codes}
                last_cycle_names = list(page_cycles.keys())

                for mod in normal_modules:
                    m = dual_code_pattern.match(mod)
                    if m:
                        codes_part = m.group(1)
                        name_part  = m.group(2)
                        split_codes = [c.strip() for c in codes_part.split('/')]
                        for i, sc in enumerate(split_codes):
                            if i < num_cycles:
                                page_cycles[last_cycle_names[i]].append(f"{sc}. {name_part}")
                    else:
                        for cn in last_cycle_names:
                            page_cycles[cn].append(mod)

                # Merge into final_cycles
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
        
    with open('catalog.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print("Done. Saved to modules.json")

if __name__ == "__main__":
    main()
