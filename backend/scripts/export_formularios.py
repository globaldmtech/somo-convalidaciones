"""Generate a JSON list of formularios from SQLite."""
from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys


BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.db.database import (  # noqa: E402
    DBConfig,
    connect,
    list_formularios,
)


# Define y procesa los argumentos de linea de comandos para listar formularios.
def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="List formularios and dump them as JSON.")
    parser.add_argument("--db", default="data/somo.db", help="Path to SQLite DB")
    parser.add_argument(
        "--out",
        default="data/formularios_export.json",
        help="Destination JSON file path.",
    )
    parser.add_argument(
        "--id-alumno",
        type=int,
        default=None,
        help="Optional alumno id filter.",
    )
    parser.add_argument(
        "--estado",
        default=None,
        choices=["BORRADOR", "ENVIADO", "A_REVISAR", "APROBADO", "RECHAZADO"],
        help="Optional estado filter.",
    )
    parser.add_argument("--limit", type=int, default=100, help="List limit.")
    parser.add_argument("--offset", type=int, default=0, help="List offset.")
    return parser.parse_args()


# Ejecuta el listado y escribe el resultado en un archivo JSON.
def main() -> None:
    args = parse_args()
    db_path = Path(args.db)
    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    conn = connect(DBConfig(path=db_path))
    try:
        rows = list_formularios(
            conn,
            id_alumno=args.id_alumno,
            estado=args.estado,
            limit=int(args.limit),
            offset=int(args.offset),
        )
        items = [dict(row) for row in rows]
        payload: dict[str, object] = {
            "mode": "list",
            "items": items,
        }
    finally:
        conn.close()

    out_path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"Formularios exportados en: {out_path}")
    print(f"Total items: {len(payload['items'])}")


if __name__ == "__main__":
    main()
