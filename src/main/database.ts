import fs from 'fs';
import path from 'path';
import initSqlJs, { type Database, type SqlJsStatic } from 'sql.js';

interface SaveGamePayload {
  runId?: string;
  character?: { name?: string; realm?: string; location?: string };
  currentScene?: string;
  scenes?: unknown;
  npcs?: unknown;
  inventory?: unknown;
  skills?: unknown;
  chatHistory?: unknown;
  [key: string]: unknown;
}

export interface GameSaveRecord {
  runId: string;
  snapshot: SaveGamePayload;
  updatedAt: string;
}

let sqlModulePromise: Promise<SqlJsStatic> | null = null;

function getSqlModule(): Promise<SqlJsStatic> {
  if (!sqlModulePromise) {
    sqlModulePromise = initSqlJs();
  }
  return sqlModulePromise as Promise<SqlJsStatic>;
}

function createRunId(): string {
  return `run_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export class GameDatabase {
  private db: Database | null = null;

  constructor(private readonly dbPath: string) {}

  async init(): Promise<void> {
    if (this.db) return;

    const SQL = await getSqlModule();
    if (fs.existsSync(this.dbPath)) {
      const bytes = fs.readFileSync(this.dbPath);
      this.db = new SQL.Database(bytes);
    } else {
      this.db = new SQL.Database();
    }

    this.db.run(`
      CREATE TABLE IF NOT EXISTS game_runs (
        run_id TEXT PRIMARY KEY,
        player_name TEXT NOT NULL,
        realm TEXT NOT NULL,
        current_scene TEXT NOT NULL,
        snapshot_json TEXT NOT NULL,
        generated_world_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS generated_entities (
        id TEXT PRIMARY KEY,
        run_id TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_key TEXT NOT NULL,
        entity_json TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (run_id) REFERENCES game_runs(run_id) ON DELETE CASCADE
      );
    `);

    this.persist();
  }

  saveGame(data: SaveGamePayload): GameSaveRecord {
    const db = this.requireDb();
    const now = new Date().toISOString();
    const runId = typeof data.runId === 'string' && data.runId ? data.runId : createRunId();
    const snapshot: SaveGamePayload = { ...data, runId };
    const playerName = data.character?.name ?? '韩立';
    const realm = data.character?.realm ?? '炼气期一层';
    const currentScene = data.currentScene ?? data.character?.location ?? '未知场景';
    const generatedWorld = {
      currentScene,
      scenes: data.scenes ?? {},
      npcs: data.npcs ?? {},
      inventory: data.inventory ?? [],
      skills: data.skills ?? [],
      chatHistory: data.chatHistory ?? [],
    };

    db.run(
      `INSERT INTO game_runs (run_id, player_name, realm, current_scene, snapshot_json, generated_world_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(run_id) DO UPDATE SET
         player_name = excluded.player_name,
         realm = excluded.realm,
         current_scene = excluded.current_scene,
         snapshot_json = excluded.snapshot_json,
         generated_world_json = excluded.generated_world_json,
         updated_at = excluded.updated_at`,
      [runId, playerName, realm, currentScene, JSON.stringify(snapshot), JSON.stringify(generatedWorld), now, now],
    );

    this.replaceGeneratedEntities(runId, 'scene', data.scenes, now);
    this.replaceGeneratedEntities(runId, 'npc', data.npcs, now);
    this.persist();

    return { runId, snapshot, updatedAt: now };
  }

  loadLatestGame(): GameSaveRecord | null {
    const db = this.requireDb();
    const result = db.exec('SELECT run_id, snapshot_json, updated_at FROM game_runs ORDER BY updated_at DESC LIMIT 1');
    const row = result[0]?.values[0];
    if (!row) return null;

    const runId = String(row[0]);
    try {
      const snapshot = JSON.parse(String(row[1])) as SaveGamePayload;
      return { runId, snapshot: { ...snapshot, runId }, updatedAt: String(row[2]) };
    } catch {
      return null;
    }
  }

  private replaceGeneratedEntities(runId: string, entityType: 'scene' | 'npc', entities: unknown, updatedAt: string): void {
    const db = this.requireDb();
    db.run('DELETE FROM generated_entities WHERE run_id = ? AND entity_type = ?', [runId, entityType]);
    if (!entities || typeof entities !== 'object') return;

    for (const [key, value] of Object.entries(entities as Record<string, unknown>)) {
      db.run(
        `INSERT INTO generated_entities (id, run_id, entity_type, entity_key, entity_json, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [`${runId}:${entityType}:${key}`, runId, entityType, key, JSON.stringify(value), updatedAt],
      );
    }
  }

  private requireDb(): Database {
    if (!this.db) throw new Error('游戏数据库尚未初始化');
    return this.db;
  }

  private persist(): void {
    const db = this.requireDb();
    fs.mkdirSync(path.dirname(this.dbPath), { recursive: true });
    fs.writeFileSync(this.dbPath, Buffer.from(db.export()));
  }
}
