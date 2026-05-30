import type { Database, SqlJsStatic } from 'sql.js';
import type { GameSaveSummary } from '../../packages/shared/index';
import { Buffer } from 'node:buffer';
import fs from 'node:fs';
import path from 'node:path';
import initSqlJs from 'sql.js';

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

export interface DeathArchiveRecord {
  archiveId: string;
  runId: string;
  snapshot: SaveGamePayload;
  createdAt: string;
}

export interface InventoryPinsPayload {
  runId: string;
  pinnedKeys: string[];
}

export interface InventoryPinsRecord {
  runId: string;
  pinnedKeys: string[];
  updatedAt: string;
}

export type AppSettingsPayload = Record<string, unknown>;

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
    if (this.db)
      return;

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
    if (!row)
      return null;

    const runId = String(row[0]);
    try {
      const snapshot = JSON.parse(String(row[1])) as SaveGamePayload;
      return { runId, snapshot: { ...snapshot, runId }, updatedAt: String(row[2]) };
    }
    catch {
      return null;
    }
  }

  loadGameByRunId(runId: string): GameSaveRecord | null {
    const db = this.requireDb();
    const result = db.exec('SELECT run_id, snapshot_json, updated_at FROM game_runs WHERE run_id = ?', [runId]);
    const row = result[0]?.values[0];
    if (!row)
      return null;

    const savedRunId = String(row[0]);
    const snapshot = JSON.parse(String(row[1])) as SaveGamePayload;
    return { runId: savedRunId, snapshot: { ...snapshot, runId: savedRunId }, updatedAt: String(row[2]) };
  }

  listGameSaves(): GameSaveSummary[] {
    const db = this.requireDb();
    const result = db.exec(
      `SELECT run_id, player_name, realm, current_scene, updated_at
       FROM game_runs
       ORDER BY updated_at DESC`,
    );
    const rows = result[0]?.values ?? [];

    return rows.map(row => ({
      runId: String(row[0]),
      playerName: String(row[1]),
      realm: String(row[2]),
      currentScene: String(row[3]),
      updatedAt: String(row[4]),
    }));
  }

  saveDeathArchive(data: SaveGamePayload): DeathArchiveRecord {
    const db = this.requireDb();
    const createdAt = new Date().toISOString();
    const runId = data.runId || createRunId();
    const archiveId = `death_${createdAt.replace(/[:.]/g, '-')}_${Math.random().toString(36).slice(2, 8)}`;
    const snapshot: SaveGamePayload = { ...data, runId };

    db.run(
      `INSERT INTO death_archives (archive_id, run_id, snapshot_json, created_at)
       VALUES (?, ?, ?, ?)`,
      [archiveId, runId, JSON.stringify(snapshot), createdAt],
    );
    this.persist();

    return { archiveId, runId, snapshot, createdAt };
  }

  saveInventoryPins(payload: InventoryPinsPayload): InventoryPinsRecord {
    const db = this.requireDb();
    const updatedAt = new Date().toISOString();

    db.run(
      `INSERT INTO inventory_pins (run_id, pinned_keys_json, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(run_id) DO UPDATE SET
         pinned_keys_json = excluded.pinned_keys_json,
         updated_at = excluded.updated_at`,
      [payload.runId, JSON.stringify(payload.pinnedKeys), updatedAt],
    );
    this.persist();

    return { runId: payload.runId, pinnedKeys: payload.pinnedKeys, updatedAt };
  }

  loadInventoryPins(runId: string): string[] {
    const db = this.requireDb();
    const result = db.exec('SELECT pinned_keys_json FROM inventory_pins WHERE run_id = ?', [runId]);
    const row = result[0]?.values[0];
    if (!row)
      return [];
    return JSON.parse(String(row[0])) as string[];
  }

  saveAIConfig(config: AppSettingsPayload): void {
    const db = this.requireDb();
    const now = new Date().toISOString();
    db.run(
      `INSERT INTO app_settings (setting_key, value_json, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(setting_key) DO UPDATE SET
         value_json = excluded.value_json,
         updated_at = excluded.updated_at`,
      ['ai-config', JSON.stringify(config), now],
    );
    this.persist();
  }

  loadAIConfig(): AppSettingsPayload | null {
    const db = this.requireDb();
    const result = db.exec('SELECT value_json FROM app_settings WHERE setting_key = ?', ['ai-config']);
    const row = result[0]?.values[0];
    if (!row)
      return null;
    return JSON.parse(String(row[0])) as AppSettingsPayload;
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
    db.run(`
      CREATE TABLE IF NOT EXISTS app_settings (
        setting_key TEXT PRIMARY KEY,
        value_json TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
    db.run(`
      CREATE TABLE IF NOT EXISTS death_archives (
        archive_id TEXT PRIMARY KEY,
        run_id TEXT NOT NULL,
        snapshot_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);
    db.run(`
      CREATE TABLE IF NOT EXISTS inventory_pins (
        run_id TEXT PRIMARY KEY,
        pinned_keys_json TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
    db.run('CREATE INDEX IF NOT EXISTS idx_game_turns_run ON game_turns(run_id, turn_index)');
    db.run('CREATE INDEX IF NOT EXISTS idx_game_events_run ON game_events(run_id, created_at)');
    db.run('CREATE INDEX IF NOT EXISTS idx_death_archives_run ON death_archives(run_id, created_at)');
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
    if (!entities || typeof entities !== 'object')
      return;

    for (const [key, value] of Object.entries(entities as Record<string, unknown>)) {
      db.run(
        `INSERT INTO generated_entities (id, run_id, entity_type, entity_key, entity_json, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [`${runId}:${entityType}:${key}`, runId, entityType, key, JSON.stringify(value), updatedAt],
      );
    }
  }

  private requireDb(): Database {
    if (!this.db)
      throw new Error('游戏数据库尚未初始化');
    return this.db;
  }

  private persist(): void {
    const db = this.requireDb();
    fs.mkdirSync(path.dirname(this.dbPath), { recursive: true });
    fs.writeFileSync(this.dbPath, Buffer.from(db.export()));
  }
}
