import initSqlJs from 'sql.js';
import type { Database } from 'sql.js';
import type { OverlayItem } from '../types';

let db: Database | null = null;

const defaultOverlays: OverlayItem[] = [
  {
    url_imagen: 'https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/zap.svg',
    posicion_x: 50,
    posicion_y: 10,
    ancho: 600,
    tiempo_inicio: 2,
    duracion: 8,
    fondo: 'opacidad',
    transicion: 'difuminado'
  },
  {
    url_imagen: 'https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/star.svg',
    posicion_x: 50,
    posicion_y: 10,
    ancho: 600,
    tiempo_inicio: 2,
    duracion: 8,
    fondo: 'opacidad',
    transicion: 'difuminado'
  }
];

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

    // Insert default overlays if table is empty
    const result = db.exec('SELECT COUNT(*) as count FROM overlays');
    if (result[0].values[0][0] === 0) {
      const stmt = db.prepare(`
        INSERT INTO overlays (
          url_imagen, posicion_x, posicion_y, ancho,
          tiempo_inicio, duracion, fondo, transicion
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      defaultOverlays.forEach(item => {
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
  }
  return db;
}

export async function getOverlays(): Promise<OverlayItem[]> {
  const database = await initDB();
  const result = database.exec('SELECT * FROM overlays ORDER BY tiempo_inicio ASC');
  if (result.length === 0) return defaultOverlays;
  
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

export async function addOverlay(overlay: OverlayItem) {
  const database = await initDB();
  const stmt = database.prepare(`
    INSERT INTO overlays (
      url_imagen, posicion_x, posicion_y, ancho,
      tiempo_inicio, duracion, fondo, transicion
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run([
    overlay.url_imagen,
    overlay.posicion_x,
    overlay.posicion_y,
    overlay.ancho,
    overlay.tiempo_inicio,
    overlay.duracion,
    overlay.fondo,
    overlay.transicion
  ]);
  
  stmt.free();
}

export async function deleteOverlay(id: number) {
  const database = await initDB();
  database.run('DELETE FROM overlays WHERE id = ?', [id]);
}