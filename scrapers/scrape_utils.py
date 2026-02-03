import json
import re
import time
import unicodedata
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://www.todofp.es"
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )
}


def ascii_fold(text):
    if text is None:
        return ""
    return unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")


def clean_text(text):
    if text is None:
        return ""
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def normalize_family(text):
    text = clean_text(text)
    if not text:
        return text
    text = re.sub(r"^Logotipo\s+de\s+", "", text, flags=re.I)
    text = re.sub(r"^Logotipo\s+", "", text, flags=re.I)
    return clean_text(text)


def derive_ciclo(titulo):
    titulo = clean_text(titulo)
    prefixes = [
        "Título Profesional Básico en ",
        "Título Profesional Básico ",
        "Técnico Superior en ",
        "Técnico en ",
        "Curso de especialización en ",
        "Curso de Especialización en ",
    ]
    for prefix in prefixes:
        if titulo.lower().startswith(prefix.lower()):
            return clean_text(titulo[len(prefix) :])
    return titulo


def fetch_html(session, url, retries=3, sleep=0.5, timeout=30):
    last_exc = None
    for attempt in range(retries):
        try:
            resp = session.get(url, headers=HEADERS, timeout=timeout)
            if resp.status_code == 200:
                return resp.text
            last_exc = RuntimeError(f"HTTP {resp.status_code} for {url}")
        except Exception as exc:
            last_exc = exc
        time.sleep(sleep * (attempt + 1))
    if last_exc:
        raise last_exc
    raise RuntimeError(f"Failed to fetch {url}")


def find_listing_table(soup):
    for table in soup.find_all("table"):
        text = ascii_fold(table.get_text(" ", strip=True)).lower()
        if "familia" in text and "titulacion" in text:
            return table
    return None


def parse_listing(html, base_url):
    soup = BeautifulSoup(html, "html.parser")
    table = find_listing_table(soup)
    if not table:
        return []

    cycles = []
    current_family = None

    for row in table.find_all("tr"):
        family_cell = row.find("th", headers="familia")
        if family_cell:
            img = family_cell.find("img")
            if img and img.get("alt"):
                current_family = normalize_family(img.get("alt"))
            else:
                current_family = normalize_family(family_cell.get_text(" ", strip=True))

        link = row.find("a", href=True)
        if not link:
            continue
        if "familias-profesionales" not in link["href"]:
            continue

        titulo = clean_text(link.get_text(" ", strip=True))
        href = urljoin(base_url, link["href"])
        cycles.append({
            "familia": current_family,
            "titulo": titulo,
            "url": href,
        })

    return cycles


def parse_modules(html):
    soup = BeautifulSoup(html, "html.parser")
    plan_header = None
    for tag in soup.find_all(["h1", "h2", "h3", "h4"]):
        if "plan de formacion" in ascii_fold(tag.get_text(" ", strip=True)).lower():
            plan_header = tag
            break
    if not plan_header:
        return []

    section = plan_header.find_parent("div", class_="cdsp") or plan_header.find_parent()
    content = section.find("div", class_="desplegable") if section else None
    content = content or section or plan_header.parent

    modules = []
    for ul in content.find_all("ul"):
        for li in ul.find_all("li"):
            item = clean_text(li.get_text(" ", strip=True))
            if item:
                modules.append({"nombre": item})

    return modules


def scrape_grade(listing_url, grado, codigo_grado, sleep=0.2, session=None):
    session = session or requests.Session()
    listing_html = fetch_html(session, listing_url)
    cycles = parse_listing(listing_html, listing_url)

    grade_data = {
        "grado": grado,
        "codigo_grado": codigo_grado,
        "familias": [],
    }

    family_map = {}

    for cycle in cycles:
        family_name = cycle.get("familia") or "Sin familia"
        family_entry = family_map.get(family_name)
        if not family_entry:
            family_entry = {"familia": family_name, "ciclos": []}
            family_map[family_name] = family_entry

        detail_html = fetch_html(session, cycle["url"])
        modules = parse_modules(detail_html)
        cycle_name = derive_ciclo(cycle["titulo"])
        family_entry["ciclos"].append({
            "ciclo": cycle_name,
            "titulo": cycle["titulo"],
            "modulos": modules,
        })

        time.sleep(sleep)

    grade_data["familias"] = list(family_map.values())
    return grade_data


def strip_curso_grade(grade):
    out = {
        "grado": grade["grado"],
        "codigo_grado": grade["codigo_grado"],
        "familias": [],
    }
    for family in grade["familias"]:
        fam_out = {"familia": family["familia"], "ciclos": []}
        for ciclo in family["ciclos"]:
            mod_out = [{"nombre": m["nombre"]} for m in ciclo["modulos"]]
            fam_out["ciclos"].append({
                "ciclo": ciclo["ciclo"],
                "titulo": ciclo["titulo"],
                "modulos": mod_out,
            })
        out["familias"].append(fam_out)
    return out


def strip_curso_all(grades):
    return [strip_curso_grade(g) for g in grades]


def write_json(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")
