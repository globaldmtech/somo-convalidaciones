declare module 'sql.js' {
  export interface QueryExecResult {
    columns: string[];
    values: unknown[][];
  }

  export interface Database {
    exec(sql: string): QueryExecResult[];
  }

  export interface SqlJsStatic {
    Database: new (data?: Uint8Array) => Database;
  }

  export type InitSqlJsConfig = {
    locateFile?: (file: string) => string;
  };

  const initSqlJs: (config?: InitSqlJsConfig) => Promise<SqlJsStatic>;
  export default initSqlJs;
}
