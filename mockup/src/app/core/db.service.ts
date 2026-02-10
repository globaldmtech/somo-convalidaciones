import { Injectable } from '@angular/core';
import type { Database, QueryExecResult, SqlJsStatic } from 'sql.js';
import { CatalogRow, ConvalidacionRow } from './models';

type SeenKey = Exclude<keyof ConvalidacionRow, 'source_page'>;
type SeenMap = Record<SeenKey, Set<string>>;

@Injectable({
  providedIn: 'root'
})
export class DbService {
  private sqlJs?: SqlJsStatic;
  private db?: Database;
  private loading?: Promise<Database>;

  async loadDb(): Promise<Database> {
    if (this.db) {
      return this.db;
    }

    if (!this.loading) {
      this.loading = this.initDb();
    }

    this.db = await this.loading;
    return this.db;
  }

  async getCatalog(): Promise<CatalogRow[]> {
    const db = await this.loadDb();
    const result = db.exec(`
      SELECT
        g.nombre AS grado,
        f.nombre AS familia,
        c.nombre AS ciclo,
        m.nombre AS modulo
      FROM Modulos m
      JOIN Ciclos c ON c.id = m.id_ciclo
      JOIN Familias f ON f.id = c.id_familia
      JOIN Grados g ON g.id = f.id_grado
      ORDER BY g.nombre, f.nombre, c.nombre, m.nombre
    `);

    return this.rowsToObjects<CatalogRow>(result);
  }

  async getConvalidaciones(): Promise<ConvalidacionRow[]> {
    const db = await this.loadDb();
    const result = db.exec(`
      SELECT
        cl.convalid_id AS convalidacion_id,
        cl.link_item,
        cl.origen_destino,
        cl.link_id,
        cl.rd,
        c.source_page,
        m.nombre AS modulo_nombre,
        cm.nombre AS modulo_ciclo_nombre,
        fmod.nombre AS modulo_familia_nombre,
        gmod.nombre AS modulo_grado_nombre,
        cc.nombre AS ciclo_nombre,
        fci.nombre AS ciclo_familia_nombre,
        gci.nombre AS ciclo_grado_nombre,
        f.nombre AS familia_nombre,
        gf.nombre AS familia_grado_nombre,
        g.nombre AS grado_nombre
      FROM Convalidacion_links cl
      LEFT JOIN Convalidacion c ON c.id = cl.convalid_id
      LEFT JOIN Modulos m ON cl.link_item = 'modulo' AND m.id = cl.link_id
      LEFT JOIN Ciclos cm ON m.id_ciclo = cm.id
      LEFT JOIN Familias fmod ON cm.id_familia = fmod.id
      LEFT JOIN Grados gmod ON fmod.id_grado = gmod.id
      LEFT JOIN Ciclos cc ON cl.link_item = 'ciclo' AND cc.id = cl.link_id
      LEFT JOIN Familias fci ON cc.id_familia = fci.id
      LEFT JOIN Grados gci ON fci.id_grado = gci.id
      LEFT JOIN Familias f ON cl.link_item = 'familia' AND f.id = cl.link_id
      LEFT JOIN Grados gf ON f.id_grado = gf.id
      LEFT JOIN Grados g ON cl.link_item = 'grado' AND g.id = cl.link_id
      ORDER BY cl.convalid_id, cl.id
    `);

    type LinkRow = {
      convalidacion_id: string;
      link_item: 'modulo' | 'ciclo' | 'familia' | 'grado';
      origen_destino: 'origen' | 'destino';
      link_id: number | null;
      rd: string | null;
      source_page: number | null;
      modulo_nombre: string | null;
      modulo_ciclo_nombre: string | null;
      modulo_familia_nombre: string | null;
      modulo_grado_nombre: string | null;
      ciclo_nombre: string | null;
      ciclo_familia_nombre: string | null;
      ciclo_grado_nombre: string | null;
      familia_nombre: string | null;
      familia_grado_nombre: string | null;
      grado_nombre: string | null;
    };

    type SideEntry = {
      grado: string | null;
      familia: string | null;
      ciclo: string | null;
      modulo: string | null;
      rd: string | null;
    };

    type Group = {
      origen: SideEntry[];
      destino: SideEntry[];
      source_page: number | null;
    };

    const rows = this.rowsToObjects<LinkRow>(result);
    const map = new Map<string, Group>();

    const ensureGroup = (row: LinkRow): Group => {
      const existing = map.get(row.convalidacion_id);
      if (existing) return existing;
      const group: Group = {
        origen: [],
        destino: [],
        source_page: row.source_page ?? null
      };
      map.set(row.convalidacion_id, group);
      return group;
    };

    const emptySide = (): SideEntry => ({
      grado: null,
      familia: null,
      ciclo: null,
      modulo: null,
      rd: null
    });

    const buildSideEntry = (row: LinkRow): SideEntry => {
      if (row.link_item === 'modulo') {
        return {
          grado: row.modulo_grado_nombre,
          familia: row.modulo_familia_nombre,
          ciclo: row.modulo_ciclo_nombre,
          modulo: row.modulo_nombre,
          rd: row.rd
        };
      }
      if (row.link_item === 'ciclo') {
        return {
          grado: row.ciclo_grado_nombre,
          familia: row.ciclo_familia_nombre,
          ciclo: row.ciclo_nombre,
          modulo: null,
          rd: row.rd
        };
      }
      if (row.link_item === 'familia') {
        return {
          grado: row.familia_grado_nombre,
          familia: row.familia_nombre,
          ciclo: null,
          modulo: null,
          rd: row.rd
        };
      }
      return {
        grado: row.grado_nombre,
        familia: null,
        ciclo: null,
        modulo: null,
        rd: row.rd
      };
    };

    const hasAnyValue = (entry: SideEntry): boolean =>
      Boolean(entry.grado || entry.familia || entry.ciclo || entry.modulo || entry.rd);

    const sideKey = (entry: SideEntry): string =>
      [
        entry.grado ?? '',
        entry.familia ?? '',
        entry.ciclo ?? '',
        entry.modulo ?? '',
        entry.rd ?? ''
      ].join('|');

    rows.forEach((row) => {
      const group = ensureGroup(row);
      if (group.source_page == null && row.source_page != null) {
        group.source_page = row.source_page;
      }
      const sideEntry = buildSideEntry(row);
      if (!hasAnyValue(sideEntry)) return;
      const target = row.origen_destino === 'origen' ? group.origen : group.destino;
      const key = sideKey(sideEntry);
      if (!target.some((entry) => sideKey(entry) === key)) {
        target.push(sideEntry);
      }
    });

    const results: ConvalidacionRow[] = [];
    map.forEach((group) => {
      const origenList = group.origen.length ? group.origen : [emptySide()];
      const destinoList = group.destino.length ? group.destino : [emptySide()];
      origenList.forEach((origen) => {
        destinoList.forEach((destino) => {
          results.push({
            grado_origen: origen.grado,
            familia_origen: origen.familia,
            ciclo_origen: origen.ciclo,
            modulo_origen: origen.modulo,
            rd_origen: origen.rd,
            grado_destino: destino.grado,
            familia_destino: destino.familia,
            ciclo_destino: destino.ciclo,
            modulo_destino: destino.modulo,
            rd_destino: destino.rd,
            source_page: group.source_page ?? null
          });
        });
      });
    });

    return results;
  }

  private async initDb(path = 'db/cf-somo.db'): Promise<Database> {
    const sqlJs =
      this.sqlJs ??
      (await initSqlJs({
        locateFile: (file: string) => `db/${file}`
      }));
    this.sqlJs = sqlJs;

    const response = await fetch(path);
    if (!response.ok) {
      throw new Error('No se pudo cargar la base de datos.');
    }

    const buffer = await response.arrayBuffer();
    return new sqlJs.Database(new Uint8Array(buffer));
  }

  private rowsToObjects<T>(
    result: QueryExecResult[]
  ): T[] {
    if (!result.length) {
      return [];
    }

    const [{ columns, values }] = result;
    return values.map((row: unknown[]) => {
      const entry: Record<string, unknown> = {};
      columns.forEach((column: string, index: number) => {
        entry[column] = row[index];
      });
      return entry as T;
    });
  }

}
