import type { NPC, Scene } from '@xianxia-rpg/core';
import type { AppliedEvent, ApplyResourceResult, GameState, ResourceChange } from './game-state';
import { resolveCombat, STARTER_SCENES } from '@xianxia-rpg/core';
import { getNextRealm, getRealmLevel, getRealmMaxExp, resourceRealmReq, resolveRealmName, skillRealmReq } from './game-data';

interface AdjudicationResult {
  accepted: boolean;
  reason?: string;
  probability?: number;
}

export interface LocalActionResolution {
  changes: ResourceChange[];
  aiInstruction: string;
}

export function buildPlayerStatus(gameState: GameState): string {
  const currentSceneData = resolveCurrentSceneData(gameState);
  const sceneNpcs = Object.values(gameState.npcs)
    .filter(npc => npc.location === gameState.currentScene && !gameState.defeatedNpcs.includes(npc.id))
    .map(npc => `${npc.name}（${npc.realm},${npc.role === 'enemy' ? '敌人' : npc.role === 'merchant' ? '商人' : '剧情NPC'},好感:${npc.favorability}${npc.attackable ? ',可攻击' : ''}）`);

  return `【玩家状态】\n境界:${gameState.character.realm} 下一境界:${getNextRealm(gameState.character.realm) ?? '已至顶阶'} 气血:${gameState.stats.hp}/${gameState.stats.maxHp} 灵力:${gameState.stats.mp}/${gameState.stats.maxMp} 修为:${gameState.stats.exp}/${gameState.stats.maxExp}\n位置:${gameState.character.location}\n背包:${gameState.inventory.map(i => `${i.name}×${i.count}`).join(', ') || '空'}\n功法:${gameState.skills.map(s => `${s.name}(${s.level})`).join(', ') || '无'}\n\n【当前场景】${gameState.currentScene}\n类型:${currentSceneData?.type ?? '未知'}\n描述:${currentSceneData?.description || '未记录'}\n关联场景:${currentSceneData?.connectedScenes.join(', ') || '无'}\n可获取:${currentSceneData?.availableResources.join(', ') || '无'}\n危险:${currentSceneData?.isDangerous ? '是' : '否'}\n场景NPC:${sceneNpcs.join(', ') || '无'}\n\n【已解锁场景】${Object.keys(gameState.scenes).join(', ')}`;
}

export function createLocalActionChanges(state: GameState, actionText: string): ResourceChange[] {
  const changes: ResourceChange[] = [];
  if (isCultivationAction(actionText)) {
    const nextExp = Math.min(state.stats.maxExp, state.stats.exp + getCultivationGain(state));
    changes.push({
      type: 'exp',
      value: nextExp,
    });
    if (nextExp >= state.stats.maxExp) {
      const nextRealm = getNextRealm(state.character.realm);
      if (nextRealm)
        changes.push({ type: 'realm', value: nextRealm });
    }
  }

  if (isHuanglongDanAction(actionText)) {
    const hasHuanglongDan = state.inventory.some(item => item.name === '黄龙丹' && item.count > 0);
    changes.push({ type: 'item_remove', name: '黄龙丹', count: 1 });
    if (hasHuanglongDan) {
      changes.push({
        type: 'hp',
        value: Math.min(state.stats.maxHp, state.stats.hp + 50),
      });
    }
  }

  return changes;
}

export function resolveLocalAction(state: GameState, actionText: string): LocalActionResolution {
  const changes = createLocalActionChanges(state, actionText);
  return {
    changes,
    aiInstruction: buildActionAIInstruction(actionText, changes),
  };
}

export function removeRemoteChangesCoveredByLocal(remoteChanges: ResourceChange[], localChanges: ResourceChange[]): ResourceChange[] {
  const localTypes = new Set(localChanges.map(change => change.type));
  return remoteChanges.filter((change) => {
    if (change.type === 'exp' && localTypes.has('exp'))
      return false;
    if (change.type === 'hp' && localTypes.has('hp'))
      return false;
    if (change.type === 'item_remove' && change.name === '黄龙丹' && localChanges.some(localChange => localChange.type === 'item_remove' && localChange.name === '黄龙丹'))
      return false;
    return true;
  });
}

export function applyResourceChanges(state: GameState, changes: ResourceChange[]): ApplyResourceResult {
  const next = structuredClone(state);
  const events: AppliedEvent[] = [];
  let breakthroughRealm: string | undefined;

  predefineScenes(next, changes);

  for (const change of changes) {
    const adjudication = adjudicateResourceChange(next, change);
    if (!adjudication.accepted) {
      const summary = `天道裁决：${adjudication.reason ?? '此变化暂未成立'}`;
      events.push({
        id: crypto.randomUUID(),
        runId: next.runId,
        type: 'rejected_change',
        summary,
        payload: change,
        accepted: false,
        reason: adjudication.reason,
        createdAt: new Date().toISOString(),
      });
      continue;
    }

    const summary = applyOneChange(next, change);
    if (!summary)
      continue;
    const eventSummary = summary;
    if (change.type === 'realm' && typeof change.value === 'string')
      breakthroughRealm = change.value;
    events.push({
      id: crypto.randomUUID(),
      runId: next.runId,
      type: change.type,
      summary: eventSummary,
      payload: change,
      accepted: true,
      reason: adjudication.reason,
      createdAt: new Date().toISOString(),
    });
  }

  return { nextState: next, summary: events.map(event => event.summary).join('\n'), events, breakthroughRealm };
}

function applyOneChange(next: GameState, change: ResourceChange): string {
  switch (change.type) {
    case 'item_add':
      return addItem(next, change);
    case 'item_remove':
      return removeItem(next, change);
    case 'hp':
      next.stats.hp = Math.max(0, Math.min(next.stats.maxHp, Number(change.value ?? 0)));
      return `气血 -> ${next.stats.hp}`;
    case 'mp':
      next.stats.mp = Math.max(0, Math.min(next.stats.maxMp, Number(change.value ?? 0)));
      return `灵力 -> ${next.stats.mp}`;
    case 'exp':
      next.stats.exp = Math.max(0, Math.min(next.stats.maxExp, Number(change.value ?? 0)));
      return `修为 -> ${next.stats.exp}/${next.stats.maxExp}`;
    case 'realm':
      return updateRealm(next, change);
    case 'location':
      return updateLocation(next, change);
    case 'skill_add':
      return addSkill(next, change);
    case 'skill_levelup':
      return levelSkill(next, change);
    case 'combat':
      return executeCombatFromAI(next, change.opponent ?? '未知对手', change.opponent_attack ?? 10, change.opponent_defense ?? 5, change.opponent_hp ?? 30);
    case 'scene_define':
      return defineScene(next, change);
    case 'npc_add':
      return addNpc(next, change);
    case 'npc_update':
      return updateNpc(next, change);
    case 'favorability':
      return updateFavorability(next, change);
  }
}

function predefineScenes(next: GameState, changes: ResourceChange[]): void {
  for (const change of changes) {
    if (change.type !== 'scene_define' || !change.scene_name)
      continue;
    const previous = next.scenes[change.scene_name];
    if (!previous) {
      next.scenes[change.scene_name] = createSceneFromChange(next, change);
    }
    linkScenes(next, next.currentScene, change.scene_name);
  }
}

function createSceneFromChange(next: GameState, change: ResourceChange): Scene {
  return mergeSceneFromChange(next, undefined, change);
}

function mergeSceneFromChange(next: GameState, previous: Scene | undefined, change: ResourceChange): Scene {
  const sceneName = change.scene_name ?? previous?.name ?? '未知场景';
  const connectedScenes = mergeUnique([
    ...(previous?.connectedScenes ?? []),
    ...(change.scene_connected ?? []),
    next.currentScene,
  ].filter(name => name && name !== sceneName));

  return {
    name: sceneName,
    type: (change.scene_type as Scene['type']) ?? previous?.type ?? 'wild',
    region: change.scene_region ?? previous?.region ?? next.character.sect,
    description: change.scene_description ?? previous?.description ?? '',
    connectedScenes,
    npcs: previous?.npcs ?? [],
    availableResources: change.scene_resources ?? previous?.availableResources ?? [],
    isDangerous: change.scene_dangerous ?? previous?.isDangerous ?? false,
  };
}

function linkScenes(next: GameState, from: string, to: string): void {
  if (!from || !to || from === to)
    return;
  const fromScene = next.scenes[from];
  const toScene = next.scenes[to];
  if (fromScene && !isSceneConnected(fromScene, to))
    fromScene.connectedScenes.push(to);
  if (toScene && !isSceneConnected(toScene, from))
    toScene.connectedScenes.push(from);
}

function isSceneConnected(scene: Scene, target: string): boolean {
  return scene.connectedScenes.some(name => namesReferToSameScene(name, target));
}

function resolveSceneName(state: GameState, name: string): string {
  const trimmed = name.trim();
  if (!trimmed)
    return trimmed;
  if (state.scenes[trimmed])
    return trimmed;
  const existing = Object.keys(state.scenes).find(sceneName => namesReferToSameScene(sceneName, trimmed));
  return existing ?? trimmed;
}

function namesReferToSameScene(left: string, right: string): boolean {
  const a = normalizeSceneName(left);
  const b = normalizeSceneName(right);
  return a === b || a.endsWith(b) || b.endsWith(a);
}

function normalizeSceneName(name: string): string {
  return name.replace(/[\s·・,，。.!！?？、]/g, '').replace(/^(七玄门|黄枫谷|越国|天南)/, '');
}

function mergeUnique(items: string[]): string[] {
  const result: string[] = [];
  for (const item of items) {
    if (!result.some(existing => namesReferToSameScene(existing, item)))
      result.push(item);
  }
  return result;
}

function adjudicateResourceChange(state: GameState, change: ResourceChange): AdjudicationResult {
  if (state.isDead && change.type !== 'hp') {
    return { accepted: false, reason: '角色已身殒，无法继续产生新的世界变化。' };
  }

  if (change.type === 'item_remove')
    return adjudicateItemRemove(state, change);
  if (change.type === 'location')
    return adjudicateLocation(state, change);
  if (change.type === 'npc_add')
    return adjudicateNpcAdd(state, change);
  if (change.type === 'npc_update')
    return adjudicateNpcUpdate(state, change);
  if (change.type === 'favorability')
    return adjudicateFavorability(state, change);
  if (change.type === 'combat')
    return adjudicateCombat(state, change);
  if (change.type === 'item_add')
    return adjudicateOverlevelChance(state, resourceRealmReq[change.name ?? ''], `越级机缘「${change.name ?? '未知物品'}」`);
  if (change.type === 'skill_add')
    return adjudicateOverlevelChance(state, skillRealmReq[change.name ?? ''], `越级功法「${change.name ?? '未知功法'}」`);
  if (change.type === 'realm')
    return adjudicateRealm(state, change);
  return { accepted: true };
}

function adjudicateItemRemove(state: GameState, change: ResourceChange): AdjudicationResult {
  const name = change.name ?? '';
  const count = Math.max(1, change.count ?? 1);
  const item = state.inventory.find(entry => entry.name === name);
  if (!item || item.count < count)
    return { accepted: false, reason: `背包中没有足够的「${name || '未知物品'}」，无法扣除。` };
  return { accepted: true };
}

function adjudicateLocation(state: GameState, change: ResourceChange): AdjudicationResult {
  const target = String(change.value ?? '');
  if (!target)
    return { accepted: false, reason: '目标场景缺失，无法移动。' };
  const resolvedTarget = resolveSceneName(state, target);
  if (resolvedTarget === state.currentScene)
    return { accepted: true };
  const currentScene = state.scenes[state.currentScene];
  const targetScene = state.scenes[resolvedTarget];
  if (!targetScene)
    return { accepted: true, reason: '未记录场景可作为探索发现，但会创建空白场景等待 AI 补全。' };
  if (!currentScene || isSceneConnected(currentScene, resolvedTarget))
    return { accepted: true };

  const chance = currentScene.isDangerous || targetScene.isDangerous ? 0.35 : 0.12;
  return rollChance(chance, `你试图前往未关联场景「${resolvedTarget}」，但路线、身份或地形尚未支撑这次转移。`);
}

function adjudicateNpcAdd(state: GameState, change: ResourceChange): AdjudicationResult {
  const npcId = change.npc_id;
  if (npcId && state.defeatedNpcs.includes(npcId))
    return { accepted: false, reason: `「${change.npc_name ?? npcId}」已被记录为败亡或离场，不能无代价重新出现。` };
  if (npcId && state.npcs[npcId])
    return { accepted: false, reason: `NPC「${state.npcs[npcId].name}」已存在，新增请求应改为更新。` };

  const npcLevel = getRealmLevel(change.npc_realm ?? '凡人');
  const playerLevel = getRealmLevel(state.character.realm);
  const scene = state.scenes[change.npc_location ?? state.currentScene];
  const gap = npcLevel - playerLevel;
  if (gap <= 3)
    return { accepted: true };

  const base = scene?.isDangerous ? 0.18 : 0.06;
  const chance = Math.max(0.01, base / Math.max(1, gap - 2));
  return rollChance(chance, `高阶存在「${change.npc_name ?? '未知 NPC'}」与当前区域气机不合，暂未显化。`, chance);
}

function adjudicateNpcUpdate(state: GameState, change: ResourceChange): AdjudicationResult {
  const npc = change.npc_id ? state.npcs[change.npc_id] : undefined;
  if (!npc)
    return { accepted: false, reason: '尝试更新不存在的 NPC，已忽略。' };
  if (state.defeatedNpcs.includes(npc.id))
    return { accepted: false, reason: `「${npc.name}」已败亡或离场，不能继续更新状态。` };
  if (change.npc_location && !state.scenes[change.npc_location])
    return { accepted: false, reason: `目标场景「${change.npc_location}」尚未被定义，NPC 无法迁移。` };
  return { accepted: true };
}

function adjudicateFavorability(state: GameState, change: ResourceChange): AdjudicationResult {
  const npc = change.target_npc ? state.npcs[change.target_npc] : undefined;
  if (!npc)
    return { accepted: false, reason: '目标 NPC 不存在，无法改变好感度。' };
  if (state.defeatedNpcs.includes(npc.id))
    return { accepted: false, reason: `「${npc.name}」已败亡或离场，好感度不再变化。` };
  return { accepted: true };
}

function adjudicateCombat(state: GameState, change: ResourceChange): AdjudicationResult {
  const enemyLevel = inferCombatRealmLevel(change);
  const playerLevel = getRealmLevel(state.character.realm);
  const scene = state.scenes[state.currentScene];
  const gap = enemyLevel - playerLevel;
  if (gap <= 4)
    return { accepted: true };

  const base = scene?.isDangerous ? 0.16 : 0.04;
  const chance = Math.max(0.01, base / Math.max(1, gap - 3));
  return rollChance(chance, `远超当前层次的敌人「${change.opponent ?? '未知对手'}」没有被此地因果牵引出现。`, chance);
}

function adjudicateRealm(state: GameState, change: ResourceChange): AdjudicationResult {
  const targetLevel = getRealmLevel(String(change.value ?? ''));
  const currentLevel = getRealmLevel(state.character.realm);
  if (targetLevel <= currentLevel + 1)
    return { accepted: true };
  return rollChance(0.02, `境界跃迁过大，突破机缘未能成立。`, 0.02);
}

function adjudicateOverlevelChance(state: GameState, requiredRealm: string | undefined, label: string): AdjudicationResult {
  if (!requiredRealm)
    return { accepted: true };
  const playerLevel = getRealmLevel(state.character.realm);
  const requiredLevel = getRealmLevel(requiredRealm);
  const gap = requiredLevel - playerLevel;
  if (gap <= 0)
    return { accepted: true };

  const scene = state.scenes[state.currentScene];
  const sceneBoost = scene?.isDangerous ? 0.08 : 0.03;
  const chance = Math.max(0.01, sceneBoost / gap);
  return rollChance(chance, `${label}需要${requiredRealm}附近的因果与灵机，此次未真正落入你手。`, chance);
}

function inferCombatRealmLevel(change: ResourceChange): number {
  const attack = change.opponent_attack ?? 10;
  const defense = change.opponent_defense ?? 5;
  const hp = change.opponent_hp ?? 30;
  return Math.floor((attack + defense + hp / 8) / 8);
}

function rollChance(probability: number, failReason: string, reportedProbability = probability): AdjudicationResult {
  const accepted = Math.random() < probability;
  if (accepted)
    return { accepted: true, reason: `低概率机缘成立（约${Math.round(reportedProbability * 100)}%）。`, probability };
  return { accepted: false, reason: failReason, probability };
}

function addItem(next: GameState, change: ResourceChange): string {
  const name = change.name ?? '未知物品';
  const count = Math.max(1, change.count ?? 1);
  const access = checkResourceAccess(next, name);
  const existing = next.inventory.find(item => item.name === name);
  if (existing)
    existing.count += count;
  else next.inventory.push({ id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, name, count, discoveredAt: new Date().toISOString(), sourceScene: next.currentScene });
  return access.canUse ? `获得 ${name} x${count}` : `获得 ${name} x${count}，但${access.reason}`;
}

function removeItem(next: GameState, change: ResourceChange): string {
  const name = change.name ?? '未知物品';
  const count = Math.max(1, change.count ?? 1);
  const item = next.inventory.find(entry => entry.name === name);
  if (item)
    item.count -= count;
  next.inventory = next.inventory.filter(entry => entry.count > 0);
  return `失去 ${name} x${count}`;
}

function updateRealm(next: GameState, change: ResourceChange): string {
  const newRealm = resolveRealmName(String(change.value ?? ''));
  if (!newRealm)
    return '';
  const oldRealm = next.character.realm;
  const realmLevel = getRealmLevel(newRealm);
  next.character.realm = newRealm;
  next.stats.maxHp = Math.max(next.stats.maxHp + 20, 80 + realmLevel * 20);
  next.stats.maxMp = Math.max(next.stats.maxMp + 20, 80 + realmLevel * 24);
  next.stats.hp = next.stats.maxHp;
  next.stats.mp = next.stats.maxMp;
  next.stats.exp = 0;
  next.stats.maxExp = getRealmMaxExp(newRealm);
  return `境界突破：${oldRealm} -> ${newRealm}`;
}

function updateLocation(next: GameState, change: ResourceChange): string {
  const requestedLoc = String(change.value ?? '');
  const newLoc = resolveSceneName(next, requestedLoc);
  if (!newLoc)
    return '';
  const from = next.currentScene;
  next.character.location = newLoc;
  next.currentScene = newLoc;
  if (!next.scenes[newLoc]) {
    next.scenes[newLoc] = structuredClone(STARTER_SCENES[newLoc] ?? {
      name: newLoc,
      type: 'wild',
      region: next.character.sect,
      description: '',
      connectedScenes: [],
      npcs: [],
      availableResources: [],
      isDangerous: false,
    });
  }
  linkScenes(next, from, newLoc);
  return `你来到${newLoc}`;
}

function resolveCurrentSceneData(gameState: GameState): Scene | undefined {
  const scene = gameState.scenes[gameState.currentScene];
  const starterScene = STARTER_SCENES[gameState.currentScene];
  if (scene && starterScene) {
    return {
      ...starterScene,
      ...scene,
      description: scene.description || starterScene.description,
      connectedScenes: mergeUnique([...starterScene.connectedScenes, ...scene.connectedScenes]),
      availableResources: scene.availableResources.length ? scene.availableResources : starterScene.availableResources,
      npcs: mergeUnique([...starterScene.npcs, ...scene.npcs]),
    };
  }
  return scene ?? starterScene;
}

function isCultivationAction(actionText: string): boolean {
  return actionText.includes('修炼') || actionText.includes('练功') || actionText.includes('打坐') || actionText.includes('长春功');
}

function buildActionAIInstruction(actionText: string, changes: ResourceChange[]): string {
  const settled = describeLocalSettlements(changes);
  if (settled.length > 0) {
    return `【本地规则已结算】玩家行动「${actionText}」已经由本地规则处理：${settled.join('；')}。AI 不要重复返回这些同类资源变化，只推导额外的场景、人物、机缘、风险或快捷指令。`;
  }
  return `【AI 推导请求】玩家行动「${actionText}」没有固定本地数值结算，请根据当前人物数据、背包、功法、场景和凡人修仙传氛围推导合理后果；若产生资源、场景、NPC 或战斗变化，必须返回结构化资源变化。`;
}

function describeLocalSettlements(changes: ResourceChange[]): string[] {
  const descriptions: string[] = [];
  if (changes.some(change => change.type === 'exp'))
    descriptions.push('修炼修为已更新');
  if (changes.some(change => change.type === 'realm'))
    descriptions.push('境界突破已更新');
  if (changes.some(change => change.type === 'item_remove' && change.name === '黄龙丹'))
    descriptions.push('黄龙丹扣除已处理');
  if (changes.some(change => change.type === 'hp'))
    descriptions.push('气血恢复已处理');
  return descriptions;
}

function isHuanglongDanAction(actionText: string): boolean {
  return actionText.includes('黄龙丹') && (actionText.includes('服用') || actionText.includes('使用'));
}

function getCultivationGain(state: GameState): number {
  const sceneRate = state.currentScene === '练功房' ? 0.12 : 0.06;
  const scaledGain = Math.round(state.stats.maxExp * sceneRate);
  if (state.currentScene === '练功房')
    return Math.max(16, scaledGain);
  return Math.max(8, scaledGain);
}

function addSkill(next: GameState, change: ResourceChange): string {
  const name = change.name ?? '未知功法';
  if (!next.skills.some(skill => skill.name === name)) {
    next.skills.push({ id: `skill_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, name, level: change.level ?? '入门', proficiency: 0, source: next.currentScene });
  }
  return `学习功法：${name}（${change.level ?? '入门'}）`;
}

function levelSkill(next: GameState, change: ResourceChange): string {
  const skill = next.skills.find(entry => entry.name === change.name);
  if (!skill || !change.level)
    return '';
  const old = skill.level;
  skill.level = change.level;
  return `${skill.name}：${old} -> ${skill.level}`;
}

function defineScene(next: GameState, change: ResourceChange): string {
  const sceneName = change.scene_name ?? '';
  if (!sceneName)
    return '';
  const previous = next.scenes[sceneName];
  next.scenes[sceneName] = mergeSceneFromChange(next, previous, change);
  linkScenes(next, next.currentScene, sceneName);
  return previous ? `场景更新：${sceneName}` : `发现新场景：${sceneName}`;
}

function addNpc(next: GameState, change: ResourceChange): string {
  const npcId = change.npc_id ?? `npc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const npcLocation = resolveSceneName(next, change.npc_location ?? next.currentScene);
  next.npcs[npcId] = {
    id: npcId,
    name: change.npc_name ?? '未知人物',
    role: (change.npc_role as NPC['role']) ?? 'story',
    location: npcLocation,
    realm: change.npc_realm ?? '凡人',
    sect: change.npc_sect,
    favorability: next.npcs[npcId]?.favorability ?? 0,
    attackable: change.npc_attackable ?? false,
    description: change.npc_description ?? '',
    combat: change.npc_attackable
      ? { attack: change.npc_attack ?? 10, defense: change.npc_defense ?? 5, hp: change.npc_maxhp ?? 50, maxHp: change.npc_maxhp ?? 50 }
      : undefined,
  };
  const scene = next.scenes[next.npcs[npcId].location] ?? next.scenes[next.currentScene];
  if (scene && !scene.npcs.includes(npcId))
    scene.npcs.push(npcId);
  return `遇到 ${next.npcs[npcId].name}`;
}

function updateNpc(next: GameState, change: ResourceChange): string {
  const npc = change.npc_id ? next.npcs[change.npc_id] : undefined;
  if (!npc)
    return '';
  if (change.npc_location)
    npc.location = resolveSceneName(next, change.npc_location);
  if (change.npc_description)
    npc.description = change.npc_description;
  if (change.npc_realm)
    npc.realm = change.npc_realm;
  if (typeof change.npc_attackable === 'boolean')
    npc.attackable = change.npc_attackable;
  return `${npc.name} 信息更新`;
}

function updateFavorability(next: GameState, change: ResourceChange): string {
  const npc = change.target_npc ? next.npcs[change.target_npc] : undefined;
  if (!npc)
    return '';
  const delta = change.favor_change ?? 0;
  npc.favorability = Math.max(-100, Math.min(100, npc.favorability + delta));
  return `${npc.name} ${delta > 0 ? '好感度提升' : '好感度下降'} ${Math.abs(delta)}（当前：${npc.favorability}）`;
}

function executeCombatFromAI(state: GameState, opponentName: string, opponentAttack: number, opponentDefense: number, opponentHp: number): string {
  const difficultyMult = state.difficulty === 'hard' ? 1.5 : 0.8;
  const playerAttack = 10 + state.stats.maxHp * 0.1;
  const playerDefense = 5 + state.stats.maxHp * 0.05;
  const log = resolveCombat(playerAttack, playerDefense, state.stats.hp, state.stats.maxHp, opponentAttack, opponentDefense, opponentHp, opponentHp, difficultyMult);
  state.stats.hp = log.playerHp;
  const lines = [`【战斗】你 vs ${opponentName}`];
  for (const round of log.rounds) {
    const crit = round.isCritical ? ' 暴击!' : '';
    lines.push(round.attacker === '你' ? `你造成 ${round.damage} 点伤害${crit}（${opponentName}剩余 ${round.remainingHp}）` : `${opponentName}造成 ${round.damage} 点伤害${crit}（你剩余 ${round.remainingHp}）`);
  }
  if (log.result === 'win')
    lines.push(`你击败了${opponentName}！`);
  if (log.result === 'lose')
    lines.push(`你被${opponentName}击败了...`);
  if (log.result === 'flee')
    lines.push('战斗陷入僵持，你趁机撤退了。');
  return lines.join('\n');
}

function checkResourceAccess(gameState: GameState, itemName: string): { canUse: boolean; reason: string } {
  const req = resourceRealmReq[itemName];
  if (!req)
    return { canUse: true, reason: '' };
  const playerLevel = getRealmLevel(gameState.character.realm);
  const reqLevel = getRealmLevel(req);
  if (playerLevel < reqLevel)
    return { canUse: false, reason: `你的境界不足以使用${itemName}（需要${req}）` };
  return { canUse: true, reason: '' };
}
