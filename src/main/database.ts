import fs from 'fs';
import path from 'path';
import initSqlJs, { type Database, type SqlJsStatic } from 'sql.js';

interface GameEventPayload {
  id?: string;
  type?: string;
  summary?: string;
  payload?: unknown;
  accepted?: boolean;
  reason?: string;
  createdAt?: string;
}

interface SaveGamePayload {
  runId?: string;
  character?: { name?: string; realm?: string; location?: string };
  currentScene?: string;
  scenes?: unknown;
  npcs?: unknown;
  inventory?: unknown;
  skills?: unknown;
  chatHistory?: unknown;
  pendingEvents?: GameEventPayload[];
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
    this.db = fs.existsSync(this.dbPath) ? new SQL.Database(fs.readFileSync(this.dbPath)) : new SQL.Database();
    this.db.run('PRAGMA foreign_keys = ON');
    this.migrate();
    this.persist();
  }

  saveGame(data: SaveGamePayload): GameSaveRecord {
    const db = this.requireDb();
    const now = new Date().toISOString();
    const runId = typeof data.runId === 'string' && data.runId ? data.runId : createRunId();
    const pendingEvents = Array.isArray(data.pendingEvents) ? data.pendingEvents : [];
    const snapshot: SaveGamePayload = { ...data, runId };
    delete snapshot.pendingEvents;

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
    this.appendTurn(runId, snapshot, now);
    this.appendEvents(runId, pendingEvents, now);
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

  private migrate(): void {
    const db = this.requireDb();
    db.run(`
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
    db.run(`
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
    db.run(`
      CREATE TABLE IF NOT EXISTS game_turns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        run_id TEXT NOT NULL,
        turn_index INTEGER NOT NULL,
        current_scene TEXT NOT NULL,
        player_summary TEXT NOT NULL,
        snapshot_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (run_id) REFERENCES game_runs(run_id) ON DELETE CASCADE
      );
    `);
    db.run(`
      CREATE TABLE IF NOT EXISTS game_events (
        event_id TEXT PRIMARY KEY,
        run_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        summary TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (run_id) REFERENCES game_runs(run_id) ON DELETE CASCADE
      );
    `);
    db.run('CREATE INDEX IF NOT EXISTS idx_game_turns_run ON game_turns(run_id, turn_index)');
    db.run('CREATE INDEX IF NOT EXISTS idx_game_events_run ON game_events(run_id, created_at)');
  }

  private appendTurn(runId: string, snapshot: SaveGamePayload, createdAt: string): void {
    const db = this.requireDb();
    const result = db.exec('SELECT COALESCE(MAX(turn_index), 0) + 1 FROM game_turns WHERE run_id = ?', [runId]);
    const turnIndex = Number(result[0]?.values[0]?.[0] ?? 1);
    const character = snapshot.character;
    const playerSummary = `${character?.name ?? '韩立'} / ${character?.realm ?? '炼气期一层'} / ${snapshot.currentScene ?? character?.location ?? '未知场景'}`;
    db.run(
      `INSERT INTO game_turns (run_id, turn_index, current_scene, player_summary, snapshot_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [runId, turnIndex, snapshot.currentScene ?? character?.location ?? '未知场景', playerSummary, JSON.stringify(snapshot), createdAt],
    );
  }

  private appendEvents(runId: string, events: GameEventPayload[], createdAt: string): void {
    const db = this.requireDb();
    for (const event of events) {
      const eventId = event.id ?? `${runId}:event:${createdAt}:${Math.random().toString(36).slice(2, 8)}`;
      const payload = {
        payload: event.payload ?? event,
        accepted: event.accepted ?? true,
        reason: event.reason ?? null,
      };
      db.run(
        `INSERT OR IGNORE INTO game_events (event_id, run_id, event_type, summary, payload_json, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [eventId, runId, event.type ?? 'unknown', event.summary ?? '', JSON.stringify(payload), event.createdAt ?? createdAt],
      );
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
