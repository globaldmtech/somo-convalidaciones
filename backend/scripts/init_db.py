"""Initialize SQLite DB by applying backend/scripts/schema.sql."""
from __future__ import annotations

import argparse
from pathlib import Path
import sys


BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.db.database import DBConfig, init_db  # noqa: E402


# Define y procesa los argumentos de linea de comandos.
def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Create SQLite DB and apply schema.sql")
    parser.add_argument(
        "--db",
        default="data/somo.db",
        help="Path to SQLite file to initialize.",
    )
    return parser.parse_args()


# Punto de entrada principal del script.
def main() -> None:
    args = parse_args()
    config = DBConfig(path=Path(args.db))
    init_db(config)
    print(f"Database initialized: {config.path}")
    print(f"Schema applied from: {config.schema_path}")


if __name__ == "__main__":
    main()
