import argparse
import hashlib
import re
import sqlite3
import unicodedata
from pathlib import Path

import pdfplumber

DB_DEFAULT = Path("grados-familias-ciclos-modulos.db")
PDF_DEFAULT = Path("docs/BOE-A-2020-17274.pdf")

RD_RE = re.compile(
    r"(?:R\.?\s*D\.?|Real\s+Decreto)\s*\d{1,4}/\d{4}[^\n\)]*",
    re.IGNORECASE,
)
PAREN_RE = re.compile(r"\([^\)]*\)")
ANEXO_MAP = {"I": 1, "II": 2, "III": 3, "IV": 4, "V": 5}
ANEXOS_VALIDOS = {"I", "II", "III", "IV"}


def normalize_match(text):
    if not text:
        return ""
    text = RD_RE.sub(" ", text)
    text = PAREN_RE.sub(" ", text)
    text = unicodedata.normalize("NFKD", text)
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    text = re.sub(r"[^a-zA-Z0-9\s]+", " ", text)
    text = re.sub(r"\s+", " ", text).strip().lower()
    return text


def normalize_rd(text):
    cleaned = re.sub(r"\s+", " ", text).strip()
    cleaned = re.sub(
        r"^(?:Real\s+Decreto|R\.?\s*D\.?)\s*",
        "RD ",
        cleaned,
        flags=re.IGNORECASE,
    )
    return cleaned


def extract_rds_list(text):
    if not text:
        return []
    rds = []
    for match in RD_RE.findall(text):
        cleaned = normalize_rd(match)
        if cleaned and cleaned not in rds:
            rds.append(cleaned)
    return rds


def extract_name(line):
    name = line.split(":", 1)[-1].strip() if ":" in line else line.strip()
    name = RD_RE.sub(" ", name)
    name = PAREN_RE.sub(" ", name)
    name = re.sub(r"\s+", " ", name).strip(" .;")
    return name


def parse_cell_items(text, default_type):
    items = []
    if not text:
        return items

    lines = [l.strip() for l in text.splitlines() if l and l.strip()]
    current_type = default_type
    current_name_parts = []
    last_was_rd = False

    def current_name():
        name = " ".join(part for part in current_name_parts if part)
        return extract_name(name)

    for line in lines:
        low = line.lower()
        if low.startswith("ciclo formativo"):
            current_type = "ciclo"
            current_name_parts = []
            rest = line.split(":", 1)[-1].strip() if ":" in line else ""
            if rest:
                current_name_parts.append(rest)
            last_was_rd = False
            continue
        if low.startswith("módulo profesional") or low.startswith("modulo profesional"):
            current_type = "modulo"
            current_name_parts = []
            rest = line.split(":", 1)[-1].strip() if ":" in line else ""
            if rest:
                current_name_parts.append(rest)
            last_was_rd = False
            continue
        if low.startswith("familia"):
            current_type = "familia"
            current_name_parts = []
            rest = line.split(":", 1)[-1].strip() if ":" in line else ""
            if rest:
                current_name_parts.append(rest)
            last_was_rd = False
            continue
        if low.startswith("grado"):
            current_type = "grado"
            current_name_parts = []
            rest = line.split(":", 1)[-1].strip() if ":" in line else ""
            if rest:
                current_name_parts.append(rest)
            last_was_rd = False
            continue

        rds = extract_rds_list(line)
        if rds:
            name = current_name()
            if not name:
                name = extract_name(RD_RE.sub(" ", line))
            if name:
                for rd in rds:
                    items.append((current_type, name, rd))
            last_was_rd = True
            continue

        if line.startswith("(") and line.endswith(")"):
            continue

        if last_was_rd:
            current_name_parts = []
            last_was_rd = False
        current_name_parts.append(line)

    if not items:
        name = current_name()
        if name:
            items.append((current_type, name, None))

    return items


def ensure_tables(conn, reset=False):
    cur = conn.cursor()
    if reset:
        cur.execute("DROP TABLE IF EXISTS Convalidacion_links")
        cur.execute("DROP TABLE IF EXISTS Convalidacion")

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS Convalidacion (
          id TEXT PRIMARY KEY,
          source_doc TEXT NOT NULL,
          source_anexo INTEGER,
          source_page INTEGER
        )
        """
    )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS Convalidacion_links (
          id INTEGER PRIMARY KEY,
          convalidacion_id TEXT NOT NULL,
          rd TEXT,
          link_id INTEGER,
          link_item TEXT NOT NULL,
          origen_destino TEXT NOT NULL,
          FOREIGN KEY (convalidacion_id) REFERENCES Convalidacion(id) ON DELETE CASCADE,
          CHECK (link_item IN ('modulo', 'ciclo', 'familia', 'grado')),
          CHECK (origen_destino IN ('origen', 'destino'))
        )
        """
    )

    cur.execute(
        "CREATE INDEX IF NOT EXISTS idx_conv_links_conv ON Convalidacion_links(convalidacion_id)"
    )
    cur.execute(
        "CREATE INDEX IF NOT EXISTS idx_conv_links_link ON Convalidacion_links(link_id)"
    )
    conn.commit()


def load_reference_ids(conn):
    cur = conn.cursor()

    cur.execute("SELECT id, nombre FROM Modulos")
    mod_by_norm = {normalize_match(nombre): mod_id for mod_id, nombre in cur.fetchall()}

    cur.execute("SELECT id, nombre, titulo FROM Ciclos")
    cycle_by_norm = {}
    for ciclo_id, nombre, titulo in cur.fetchall():
        cycle_by_norm[normalize_match(nombre)] = ciclo_id
        if titulo:
            cycle_by_norm.setdefault(normalize_match(titulo), ciclo_id)

    cur.execute("SELECT id, nombre FROM Familias")
    family_by_norm = {normalize_match(nombre): fam_id for fam_id, nombre in cur.fetchall()}

    cur.execute("SELECT id, nombre FROM Grados")
    grade_by_norm = {normalize_match(nombre): grado_id for grado_id, nombre in cur.fetchall()}

    return mod_by_norm, cycle_by_norm, family_by_norm, grade_by_norm


def resolve_best_link(name, lookups):
    mod_by_norm, cycle_by_norm, family_by_norm, grade_by_norm = lookups
    key = normalize_match(name)

    if key in mod_by_norm:
        return mod_by_norm[key], "modulo"
    if key in cycle_by_norm:
        return cycle_by_norm[key], "ciclo"
    if key in family_by_norm:
        return family_by_norm[key], "familia"
    if key in grade_by_norm:
        return grade_by_norm[key], "grado"

    return None, None


def conv_id_for(page_idx, anexo, table_idx, row_idx):
    raw = f"BOE-A-2020-17274|{anexo}|{page_idx}|{table_idx}|{row_idx}"
    return hashlib.sha1(raw.encode("utf-8")).hexdigest()[:16]


def insert_convalidacion(cur, conv_id, source_doc, source_anexo, source_page):
    cur.execute(
        """
        INSERT OR IGNORE INTO Convalidacion (id, source_doc, source_anexo, source_page)
        VALUES (?,?,?,?)
        """,
        (conv_id, source_doc, source_anexo, source_page),
    )


def insert_link(cur, convalidacion_id, rd, link_id, link_item, origen_destino):
    cur.execute(
        """
        INSERT INTO Convalidacion_links
        (convalidacion_id, rd, link_id, link_item, origen_destino)
        VALUES (?,?,?,?,?)
        """,
        (convalidacion_id, rd, link_id, link_item, origen_destino),
    )


def is_note_row(row):
    cells = [c for c in row if c and c.strip()]
    if len(cells) == 1:
        head = cells[0].strip().lower()
        if head.startswith("para todos") or head.startswith("nota"):
            return True
    return False


def parse_boe(conn, pdf_path, lookups):
    cur = conn.cursor()
    inserted_links = 0

    with pdfplumber.open(pdf_path) as pdf:
        current_anexo = None
        for page_idx, page in enumerate(pdf.pages, start=1):
            text = page.extract_text() or ""
            if "ANEXO I" in text:
                current_anexo = "I"
            elif "ANEXO II" in text:
                current_anexo = "II"
            elif "ANEXO III" in text:
                current_anexo = "III"
            elif "ANEXO IV" in text:
                current_anexo = "IV"
            elif "ANEXO V" in text:
                current_anexo = "V"

            if current_anexo not in ANEXOS_VALIDOS:
                continue

            tables = page.extract_tables() or []
            if not tables:
                continue

            for table_idx, table in enumerate(tables):
                rows = [[(c or "").strip() for c in row] for row in table]
                if rows and rows[0] and rows[0][0].lower().startswith("familia:"):
                    rows = rows[1:]

                last_origen_text = None
                last_destino_text = None

                for row_idx, row in enumerate(rows):
                    if not any(row):
                        continue
                    if is_note_row(row):
                        continue
                    header_join = " ".join(row).lower()
                    if "formación aportada" in header_join or "formacion aportada" in header_join:
                        continue
                    if "familia profesional" in header_join and "módulos" in header_join:
                        continue

                    origen_text = destino_text = None
                    if len(row) >= 5:
                        origen_text = row[1] or last_origen_text
                        destino_text = row[3] or last_destino_text
                    elif len(row) >= 3:
                        origen_text = row[1] or last_origen_text
                        destino_text = row[2] or last_destino_text
                    elif len(row) == 2:
                        origen_text = row[0] or last_origen_text
                        destino_text = row[1] or last_destino_text

                    if not origen_text or not destino_text:
                        continue

                    last_origen_text = origen_text
                    last_destino_text = destino_text

                    anexo_num = ANEXO_MAP.get(current_anexo)
                    conv_id = conv_id_for(page_idx, anexo_num, table_idx, row_idx)
                    insert_convalidacion(cur, conv_id, "BOE-A-2020-17274", anexo_num, page_idx)

                    origin_items = parse_cell_items(origen_text, default_type="modulo")
                    dest_items = parse_cell_items(destino_text, default_type="modulo")

                    for item_type, name, rd in origin_items:
                        link_id, link_item = resolve_best_link(name, lookups)
                        if link_item is None:
                            link_item = item_type
                        insert_link(cur, conv_id, rd, link_id, link_item, "origen")
                        inserted_links += 1

                    for item_type, name, rd in dest_items:
                        link_id, link_item = resolve_best_link(name, lookups)
                        if link_item is None:
                            link_item = item_type
                        insert_link(cur, conv_id, rd, link_id, link_item, "destino")
                        inserted_links += 1

    return inserted_links


def main():
    parser = argparse.ArgumentParser(
        description="Create Convalidacion tables and load BOE-A-2020-17274 into them."
    )
    parser.add_argument("--db", default=str(DB_DEFAULT))
    parser.add_argument("--pdf", default=str(PDF_DEFAULT))
    parser.add_argument("--reset", action="store_true")
    args = parser.parse_args()

    db_path = Path(args.db)
    pdf_path = Path(args.pdf)

    if not db_path.exists():
        raise FileNotFoundError(f"DB not found: {db_path}")
    if not pdf_path.exists():
        raise FileNotFoundError(f"PDF not found: {pdf_path}")

    conn = sqlite3.connect(db_path)
    ensure_tables(conn, reset=args.reset)
    lookups = load_reference_ids(conn)

    inserted_links = parse_boe(conn, pdf_path, lookups)
    conn.commit()
    conn.close()

    print(f"Loaded convalidaciones into {db_path}")
    print(f"Inserted links: {inserted_links}")


if __name__ == "__main__":
    main()
