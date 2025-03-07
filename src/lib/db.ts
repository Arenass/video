import initSqlJs from 'sql.js';
import type { Database } from 'sql.js';
import type { OverlayItem } from '../types';

let db: Database | null = null;

export async function initDB() {
  if (!db) {
    const SQL = await initSqlJs({
      locateFile: file => `https://sql.js.org/dist/${file}`
    });
    db = new SQL.Database();
    db.run(`
      CREATE TABLE IF NOT EXISTS overlays (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url_imagen TEXT NOT NULL,
        posicion_x INTEGER NOT NULL,
        posicion_y INTEGER NOT NULL,
        ancho INTEGER NOT NULL,
        tiempo_inicio REAL NOT NULL,
        duracion REAL NOT NULL,
        fondo TEXT CHECK(fondo IN ('transparente', 'opacidad')) NOT NULL,
        transicion TEXT CHECK(transicion IN ('difuminado', 'lateral')) NOT NULL
      )
    `);
  }
  return db;
}

export async function getOverlays(): Promise<OverlayItem[]> {
  const database = await initDB();
  const result = database.exec('SELECT * FROM overlays ORDER BY tiempo_inicio ASC');
  if (result.length === 0) return [];
  
  const columns = result[0].columns;
  return result[0].values.map(row => {
    const item: any = {};
    columns.forEach((col, i) => {
      item[col] = row[i];
    });
    return item as OverlayItem;
  });
}

export async function saveOverlaysFromCSV(overlays: OverlayItem[]) {
  const database = await initDB();
  database.run('DELETE FROM overlays');
  
  const stmt = database.prepare(`
    INSERT INTO overlays (
      url_imagen, posicion_x, posicion_y, ancho,
      tiempo_inicio, duracion, fondo, transicion
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  overlays.forEach(item => {
    stmt.run([
      item.url_imagen,
      item.posicion_x,
      item.posicion_y,
      item.ancho,
      item.tiempo_inicio,
      item.duracion,
      item.fondo,
      item.transicion
    ]);
  });
  
  stmt.free();
}

export async function updateOverlay(id: number, updates: Partial<OverlayItem>) {
  const database = await initDB();
  const sets = Object.entries(updates)
    .map(([key]) => `${key} = ?`)
    .join(', ');
  
  const values = [...Object.values(updates), id];
  database.run(`UPDATE overlays SET ${sets} WHERE id = ?`, values);
}