import argparse
import os

from scrape_utils import scrape_grade, strip_curso_grade, write_json

DEFAULT_URL = "https://todofp.es/que-estudiar/grados-e/curso-especializacion.html"
DEFAULT_OUT = os.path.join("output", "fp_cursos_especializacion.json")


def main():
    parser = argparse.ArgumentParser(description="Scrape Cursos de Especializacion")
    parser.add_argument("--url", default=DEFAULT_URL)
    parser.add_argument("--out", default=DEFAULT_OUT)
    parser.add_argument("--sleep", type=float, default=0.2)
    args = parser.parse_args()

    os.makedirs(os.path.dirname(args.out), exist_ok=True)

    data = scrape_grade(args.url, "Curso de Especialización", "CE", sleep=args.sleep)
    write_json(args.out, strip_curso_grade(data))


if __name__ == "__main__":
    main()