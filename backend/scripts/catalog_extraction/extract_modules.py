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

def _looks_like_module_name_row(row):
    """Return True for module rows without code, excluding headers, totals and notes."""
    if not row or row[0] is None:
        return False

    cell = str(row[0]).strip()
    if not cell:
        return False

    upper_cell = cell.upper()
    if (
        "DENOMINACIÓN" in upper_cell
        or "PROFESORADO" in upper_cell
        or "HORAS" in upper_cell
        or upper_cell in {"TOTAL", "TOTALES"}
    ):
        return False

    if re.fullmatch(r'\d+', cell):
        return False

    return bool(re.search(r'[A-ZÁÉÍÓÚÜÑ]', upper_cell))

def _is_valid_module_row(row, has_hours):
    """Accept coded rows and also unnumbered module names when they carry hours."""
    if _is_module_row(row):
        return True
    return _looks_like_module_name_row(row) and any(has_hours)

def _table_starts_with_module_row(table):
    """Continuation tables may start with either a coded module or an unnumbered one."""
    if not table:
        return False
    return _is_module_row(table[0]) or _looks_like_module_name_row(table[0])

def _is_subheader_row(row):
    """Rows like ['', '', ..., '1º', '2º', '1º', '2º', ...]."""
    if not row:
        return False
    allowed = {"", "1º", "2º", "1°", "2°", "1O", "2O"}
    seen = False
    for cell in row:
        s = "" if cell is None else str(cell).strip().upper()
        if not s:
            continue
        if s not in allowed:
            return False
        seen = True
    return seen

def _is_hours_header_cell(value):
    return value is not None and "HORAS" in str(value).upper()

def _row_bbox_from_cells(cells):
    """
    Return (top, bottom) for a row.
    Prefer the DENOMINACIÓN cell bbox (col 0), which is usually the cleanest row height.
    """
    if cells and len(cells) > 0 and cells[0]:
        return (cells[0][1], cells[0][3])

    tops = []
    bottoms = []
    for cell in cells:
        if not cell:
            continue
        # pdfplumber cell bbox: (x0, top, x1, bottom)
        tops.append(cell[1])
        bottoms.append(cell[3])
    if not tops or not bottoms:
        return None
    return (min(tops), max(bottoms))

def _group_bboxes_from_header(header_row, header_cells):
    """
    Build per-cycle hour group bboxes from header row text + header cell bboxes.
    Each group starts at a 'HORAS' header and ends before the next 'HORAS'.
    """
    starts = [i for i, cell in enumerate(header_row) if _is_hours_header_cell(cell)]
    if not starts:
        return []

    groups = []
    n = len(header_cells)
    for pos, start in enumerate(starts):
        end = starts[pos + 1] if pos + 1 < len(starts) else n
        x0 = None
        x1 = None
        for col in range(start, end):
            if col >= n:
                break
            bbox = header_cells[col]
            if not bbox:
                continue
            x0 = bbox[0] if x0 is None else min(x0, bbox[0])
            x1 = bbox[2] if x1 is None else max(x1, bbox[2])
        if x0 is not None and x1 is not None:
            groups.append((x0, x1))
    return groups

def _row_group_has_digits(page_chars, row_bbox, group_bbox):
    """Detect hours by reading raw chars inside row/group bbox, regardless of table cell extraction."""
    top, bottom = row_bbox
    gx0, gx1 = group_bbox
    # Tighten bounds to reduce bleed from adjacent rows/columns.
    y_pad = 0.8
    x_pad = 0.6
    top_i = top + y_pad
    bottom_i = bottom - y_pad
    gx0_i = gx0 + x_pad
    gx1_i = gx1 - x_pad

    for ch in page_chars:
        cx0 = ch.get("x0")
        cx1 = ch.get("x1")
        ctop = ch.get("top")
        cbottom = ch.get("bottom")
        txt = ch.get("text", "")
        if cx0 is None or cx1 is None or ctop is None or cbottom is None:
            continue
        xmid = (cx0 + cx1) / 2.0
        ymid = (ctop + cbottom) / 2.0
        if xmid < gx0_i or xmid > gx1_i:
            continue
        if ymid < top_i or ymid > bottom_i:
            continue
        if re.search(r"\d", str(txt)):
            return True
    return False

def _append_module_to_cycles(module_text, cycle_names, has_hours_flags, final_cycles, dual_code_pattern):
    """Append module only to cycles that have hours on that row/group."""
    m = dual_code_pattern.match(module_text)
    active_indices = {i for i, ok in enumerate(has_hours_flags) if ok}
    if not active_indices:
        return

    if m:
        codes_part = m.group(1)
        name_part = m.group(2)
        split_codes = [c.strip() for c in codes_part.split('/')]
        for i, code in enumerate(split_codes):
            if i < len(cycle_names) and i in active_indices:
                final_cycles[cycle_names[i]].append(f"{code}. {name_part}")
    else:
        for i, cycle_name in enumerate(cycle_names):
            if i in active_indices:
                final_cycles[cycle_name].append(module_text)

def extract_modules_grouped(pdf_stream):
    with pdfplumber.open(pdf_stream) as pdf:
        final_cycles = {}
        cycle_map = {}
        # Flag: True once we have found a DENOMINACIÓN table on this PDF.
        in_module_table = False
        # Names of the cycles being filled — persists between pages for continuations.
        last_cycle_names = []
        # Hour group x-ranges, reused in continuation tables.
        last_hours_group_bboxes = []

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

            page_chars = page.chars

            for table_obj in tables:
                table = table_obj.extract()
                if not table or len(table) < 2:
                    continue

                if 'DENOMINACIÓN' in table[0]:
                    in_module_table = True
                    if not cycle_map:
                        continue

                    cycle_codes = list(cycle_map.keys())
                    cycle_names = [cycle_map[c] for c in cycle_codes]
                    last_cycle_names = cycle_names
                    for cycle_name in cycle_names:
                        final_cycles.setdefault(cycle_name, [])

                    # Build hour-group bboxes from header row geometry.
                    if table_obj.rows and table_obj.rows[0].cells:
                        header_cells = table_obj.rows[0].cells
                        last_hours_group_bboxes = _group_bboxes_from_header(table[0], header_cells)

                    start_idx = 1
                    if len(table) > 1 and _is_subheader_row(table[1]):
                        start_idx = 2

                    row_count = min(len(table), len(table_obj.rows))
                    for ridx in range(start_idx, row_count):
                        row = table[ridx]
                        row_bbox = _row_bbox_from_cells(table_obj.rows[ridx].cells)
                        if not row_bbox:
                            continue

                        # Keep only as many groups as cycles, preserving left-to-right order.
                        group_bboxes = last_hours_group_bboxes[:len(last_cycle_names)]
                        if not group_bboxes:
                            continue

                        has_hours = [
                            _row_group_has_digits(page_chars, row_bbox, gb)
                            for gb in group_bboxes
                        ]
                        if not _is_valid_module_row(row, has_hours):
                            continue

                        mod = str(row[0]).strip()
                        _append_module_to_cycles(
                            module_text=mod,
                            cycle_names=last_cycle_names,
                            has_hours_flags=has_hours,
                            final_cycles=final_cycles,
                            dual_code_pattern=dual_code_pattern,
                        )

                elif in_module_table and _table_starts_with_module_row(table) and last_cycle_names and last_hours_group_bboxes:
                    # Continuation table: reuse previous cycle order + hour-group columns.
                    row_count = min(len(table), len(table_obj.rows))
                    group_bboxes = last_hours_group_bboxes[:len(last_cycle_names)]
                    if not group_bboxes:
                        continue

                    for ridx in range(row_count):
                        row = table[ridx]
                        row_bbox = _row_bbox_from_cells(table_obj.rows[ridx].cells)
                        if not row_bbox:
                            continue

                        has_hours = [
                            _row_group_has_digits(page_chars, row_bbox, gb)
                            for gb in group_bboxes
                        ]
                        if not _is_valid_module_row(row, has_hours):
                            continue

                        mod = str(row[0]).strip()
                        _append_module_to_cycles(
                            module_text=mod,
                            cycle_names=last_cycle_names,
                            has_hours_flags=has_hours,
                            final_cycles=final_cycles,
                            dual_code_pattern=dual_code_pattern,
                        )

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
