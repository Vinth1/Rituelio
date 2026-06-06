// Déclaration de types minimale pour le module SQLite intégré de Node (`node:sqlite`).
// @types/node v20 ne le fournit pas encore ; on déclare seulement ce qu'on utilise.
declare module "node:sqlite" {
  type ValeurSql = null | number | bigint | string | Uint8Array;

  export interface StatementSync {
    run(...params: ValeurSql[]): { changes: number; lastInsertRowid: number | bigint };
    get(...params: ValeurSql[]): unknown;
    all(...params: ValeurSql[]): unknown[];
  }

  export class DatabaseSync {
    constructor(path: string, options?: { open?: boolean; readOnly?: boolean });
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
    close(): void;
  }
}
