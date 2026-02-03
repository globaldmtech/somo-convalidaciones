import argparse
import os
import sqlite3

from scrape_utils import scrape_grade, strip_curso_all, write_json

GRADES = [
    {
        "grado": "Grado Básico",
        "codigo": "GB",
        "url": "https://www.todofp.es/que-estudiar/grados-d/fp-grado-basico.html",
    },
    {
        "grado": "Grado Medio",
        "codigo": "GM",
        "url": "https://www.todofp.es/que-estudiar/grados-d/grado-medio.html",
    },
    {
        "grado": "Grado Superior",
        "codigo": "GS",
        "url": "https://www.todofp.es/que-estudiar/grados-d/grado-superior.html",
    },
    {
        "grado": "Curso de Especialización",
        "codigo": "CE",
        "url": "https://todofp.es/que-estudiar/grados-e/curso-especializacion.html",
    },
]


def ensure_schema(conn):
    cur = conn.cursor()
    cur.execute("PRAGMA foreign_keys = ON")

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS Grados (
          id INTEGER PRIMARY KEY,
          nombre TEXT NOT NULL UNIQUE
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS Familias (
          id INTEGER PRIMARY KEY,
          nombre TEXT NOT NULL,
          id_grado INTEGER NOT NULL,
          FOREIGN KEY (id_grado) REFERENCES Grados(id) ON DELETE CASCADE,
          UNIQUE (nombre, id_grado)
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS Ciclos (
          id INTEGER PRIMARY KEY,
          nombre TEXT NOT NULL,
          titulo TEXT,
          id_familia INTEGER NOT NULL,
          FOREIGN KEY (id_familia) REFERENCES Familias(id) ON DELETE CASCADE,
          UNIQUE (nombre, id_familia)
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS Modulos (
          id INTEGER PRIMARY KEY,
          nombre TEXT NOT NULL,
          id_ciclo INTEGER NOT NULL,
          FOREIGN KEY (id_ciclo) REFERENCES Ciclos(id) ON DELETE CASCADE,
          UNIQUE (nombre, id_ciclo)
        )
        """
    )

    cur.execute("PRAGMA table_info(Ciclos)")
    cols = [row[1] for row in cur.fetchall()]
    if "titulo" not in cols:
        cur.execute("ALTER TABLE Ciclos ADD COLUMN titulo TEXT")

    conn.commit()


def reset_db(conn):
    cur = conn.cursor()
    cur.execute("PRAGMA foreign_keys = ON")
    for table in ["Modulos", "Ciclos", "Familias", "Grados"]:
        cur.execute(f"DELETE FROM {table}")
    conn.commit()


def get_or_create(cur, table, values, unique_cols):
    cols = list(values.keys())
    placeholders = ",".join(["?"] * len(cols))
    cur.execute(
        f"INSERT OR IGNORE INTO {table} ({','.join(cols)}) VALUES ({placeholders})",
        tuple(values[col] for col in cols),
    )
    where = " AND ".join([f"{col}=?" for col in unique_cols])
    cur.execute(
        f"SELECT id FROM {table} WHERE {where}",
        tuple(values[col] for col in unique_cols),
    )
    row = cur.fetchone()
    return row[0] if row else None


def insert_data(conn, grades):
    cur = conn.cursor()
    cur.execute("PRAGMA foreign_keys = ON")

    for grade in grades:
        grado_id = get_or_create(
            cur,
            "Grados",
            {"nombre": grade["grado"]},
            ["nombre"],
        )

        for family in grade["familias"]:
            familia_id = get_or_create(
                cur,
                "Familias",
                {"nombre": family["familia"], "id_grado": grado_id},
                ["nombre", "id_grado"],
            )

            for ciclo in family["ciclos"]:
                ciclo_id = get_or_create(
                    cur,
                    "Ciclos",
                    {
                        "nombre": ciclo["ciclo"],
                        "titulo": ciclo["titulo"],
                        "id_familia": familia_id,
                    },
                    ["nombre", "id_familia"],
                )

                cur.execute(
                    "UPDATE Ciclos SET titulo=? WHERE id=? AND (titulo IS NULL OR titulo='')",
                    (ciclo["titulo"], ciclo_id),
                )

                for modulo in ciclo["modulos"]:
                    cur.execute(
                        "INSERT OR IGNORE INTO Modulos (nombre, id_ciclo) VALUES (?, ?)",
                        (modulo["nombre"], ciclo_id),
                    )

    conn.commit()


def scrape_all(sleep):
    grades_data = []
    for entry in GRADES:
        grades_data.append(
            scrape_grade(entry["url"], entry["grado"], entry["codigo"], sleep=sleep)
        )
    return grades_data


def main():
    parser = argparse.ArgumentParser(description="Scrape todoFP and build JSON/DB")
    parser.add_argument("--db", default="grados-familias-ciclos-modulos.db")
    parser.add_argument("--json", default="fp_grados.json")
    parser.add_argument("--sleep", type=float, default=0.2)
    parser.add_argument("--reset", action="store_true")
    args = parser.parse_args()

    grades = scrape_all(args.sleep)

    write_json(args.json, strip_curso_all(grades))

    conn = sqlite3.connect(args.db)
    ensure_schema(conn)
    if args.reset:
        reset_db(conn)
    insert_data(conn, grades)
    conn.close()


if __name__ == "__main__":
    main()
