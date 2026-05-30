import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
import { chatWithAI } from './src/ai';
import type { AIProviderConfig, AIChatRequest } from './src/ai';
import { GameDatabase } from './src/main/database';

// ========== 配置文件路径 ==========
const configDir = path.join(app.getPath('userData'), 'data');
const aiConfigPath = path.join(configDir, 'ai-config.json');
const gameDb = new GameDatabase(path.join(configDir, 'game-runs.sqlite'));

function initializeDataDir(): void {
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
}

initializeDataDir();
void gameDb.init().catch((err) => {
  console.error('初始化游戏数据库失败:', err);
});
// ========== AI 配置（优先从文件加载） ==========
const defaultAIConfig: AIProviderConfig = {
  type: 'openai',
  baseURL: 'https://coderelay.cn/v1',
  apiKey: 'sk-mEXqh5AH2gsuArbeKAgahGODQSLe2Q8UHCDQO57fQIYNNZY8',
  model: 'gpt-5.2',
  maxTokens: 2048,
  temperature: 0.7,
  systemPrompt: `你是一个修仙世界的AI叙事者，基于《凡人修仙传》的世界观。
玩家扮演韩立，一个出身贫寒的凡人修仙者。
你需要：
1. 根据玩家的行动描述场景和事件
2. 保持修仙世界的氛围和设定
3. 给予玩家选择和互动的机会
4. 回复控制在200字以内，保持节奏感

【世界知识框架】
基于《凡人修仙传》世界观，以下是参考知识（你可以在此基础上自由扩展）：

境界体系：炼气期（1-9层）→ 筑基期（初/中/后）→ 结丹期 → 元婴期 → 化神期 → 炼虚期 → 合体期 → 大乘期 → 渡劫期
初期场景：七玄门（外门居所、练功房、后山、丹药房、藏经阁）
后期场景（随境界解锁）：黄枫谷、落云宗、天南修仙界、乱星海、灵界

初期可能遇到的人物（你可以自由引入新角色）：
- 墨大夫：阴沉老者，七玄门长老，炼气期六层，暗中图谋不轨
- 厉飞雨：精瘦少年，同门师弟，炼气期二层
- 张铁：憨厚少年，同期入门，炼气期一层
- 药老：须发皆白的老者，七玄门炼丹师
- 后山妖兽：灰狼、铁臂猿等低阶妖兽

势力分布：七玄门（越国小门派）→ 黄枫谷（越国大宗）→ 掩月宗、御灵宗等 → 天南六派 → 乱星海各大势力

【重要】资源变化标记规则：
当玩家的行动导致资源变化时，你必须在回复末尾（用空行隔开）输出一个 [资源变化] 代码块：
[资源变化]
{"changes":[
  {"type":"item_add","name":"物品名","count":数量},
  {"type":"item_remove","name":"物品名","count":数量},
  {"type":"hp","value":数值},
  {"type":"mp","value":数值},
  {"type":"exp","value":数值},
  {"type":"realm","value":"新境界"},
  {"type":"location","value":"新位置"},
  {"type":"skill_add","name":"功法名","level":"等级"},
  {"type":"skill_levelup","name":"功法名","level":"新等级"},
  {"type":"combat","opponent":"对手名","opponent_attack":数值,"opponent_defense":数值,"opponent_hp":数值},
  {"type":"scene_define","scene_name":"场景名","scene_type":"sect/town/wild/dungeon","scene_region":"所属区域","scene_description":"描述","scene_connected":["关联场景1","关联场景2"],"scene_resources":["可产出资源"],"scene_dangerous":true/false},
  {"type":"npc_add","npc_id":"唯一ID","npc_name":"NPC名","npc_role":"story/enemy/merchant/mentor","npc_realm":"境界","npc_sect":"所属势力","npc_description":"描述","npc_attackable":true/false,"npc_attack":数值,"npc_defense":数值,"npc_maxhp":数值,"npc_location":"所在场景"},
  {"type":"npc_update","npc_id":"NPC ID","npc_location":"新位置","npc_description":"新描述"},
  {"type":"favorability","target_npc":"NPC ID","favor_change":数值}
]}
说明：
- item_add/item_remove: 获得/失去物品
- hp/mp/exp: 直接设置为目标值（0表示死亡）
- realm: 境界突破
- location: 位置变化（玩家移动到新场景）
- skill_add/skill_levelup: 功法变化
- combat: 触发战斗（系统自动计算结果）
- scene_define: 定义新场景（玩家探索新区域时使用）
  - scene_type: sect(宗门)/town(城镇)/wild(野外)/dungeon(副本)
  - scene_connected: 可直达的关联场景列表
  - scene_resources: 该场景可产出的物资类型（如"灵草","妖兽内丹"）
  - scene_dangerous: 是否危险区域（可能有敌对NPC）
- npc_add: 添加新NPC（玩家遇到新人物时使用）
  - npc_role: story(剧情NPC)/enemy(敌人)/merchant(商人)/mentor(导师)
  - npc_attackable: 是否可被玩家攻击
  - 战斗属性仅对 enemy 或 attackable=true 的 NPC 需要
- npc_update: 更新NPC信息（NPC移动或状态变化）
- favorability: 好感度变化（-100到100，正数提升，负数下降）
- 如果没有任何资源变化，则不需要输出此标记

【场景驱动规则】
- 场景是核心，物资和NPC都依附于场景
- 玩家首次进入新区域时，使用 scene_define 定义场景
- 场景内的NPC使用 npc_add 添加，NPC会自动关联到当前场景
- 场景切换应通过 location 标记，同时更新玩家位置
- 关联场景应合理设置（如"练功房"关联"外门居所"）
- 危险场景（如后山深处）应设置 scene_dangerous=true，可能遇到敌人

【NPC与好感度规则】
- NPC好感度范围 -100~100，影响NPC对玩家的态度
- 好感度>50：友好，可能提供帮助或优惠
- 好感度<0：冷淡或敌意
- 好感度<-50：敌对，可能主动攻击
- 对话、送礼、帮助NPC可提升好感度
- 冒犯、攻击、拒绝请求会降低好感度
- 商人NPC好感度高时可能打折
- 导师NPC好感度高时可能传授更高阶功法

【场景与资源规则】
- 场景由你自由生成，但要符合世界观逻辑（不能让炼气期一层玩家出现在灵界）
- 资源掉落要匹配场景和难度（后山掉低阶材料，秘境掉高阶宝物）
- 高阶物品（如筑基丹）需要对应境界才能使用，低境界获得时会提示
- 玩家可以通过和NPC对话获取物品信息

【快捷指令规则】
- 每次回复时，你必须在 [资源变化] 之后（如果有的话）输出一个 [快捷指令] 标记
- 格式：[快捷指令]{"actions":["操作1","操作2","操作3","操作4"]}
- 提供3-6个当前场景下最合理的操作选项
- 指令应基于当前场景、NPC、玩家状态动态生成
- 示例：在外门居所时 → ["修炼长春功","查看背包","去练功房","去后山探索","和周围的人交谈"]
- 示例：在后山遇到灰狼时 → ["攻击灰狼","服用黄龙丹","逃跑回居所","观察灰狼"]
- 示例：在丹药房时 → ["向药老购买丹药","和药老交谈","离开丹药房"]
- 如果没有任何资源变化也没有快捷指令需要更新，则都不需要输出`,
};

function loadAIConfigFromFile(): AIProviderConfig {
  try {
    if (fs.existsSync(aiConfigPath)) {
      const raw = fs.readFileSync(aiConfigPath, 'utf-8');
      const parsed = JSON.parse(raw);
      return { ...defaultAIConfig, ...parsed };
    }
  } catch (err) {
    console.error('加载 AI 配置文件失败:', err);
  }
  return { ...defaultAIConfig };
}

const aiConfig: AIProviderConfig = loadAIConfigFromFile();

// ========== 窗口管理 ==========
let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: '凡人修仙传 - AI修仙RPG',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (devServerUrl) {
    mainWindow.loadURL(devServerUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  if (devServerUrl) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ========== IPC 通信处理 ==========

/** 保存游戏数据 */
ipcMain.handle('save-game-data', async (_event, data: unknown) => {
  try {
    await gameDb.init();
    const record = gameDb.saveGame(data && typeof data === 'object' ? (data as Record<string, unknown>) : {});
    return { success: true, message: '存档成功', data: record.snapshot, runId: record.runId };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return { success: false, message: `存档失败: ${errorMessage}` };
  }
});

/** 读取游戏数据 */
ipcMain.handle('load-game-data', async () => {
  try {
    await gameDb.init();
    const record = gameDb.loadLatestGame();
    return { success: true, data: record?.snapshot ?? null };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return { success: false, data: null, message: errorMessage };
  }
});

/** 发送消息给 AI */
ipcMain.handle('send-to-ai', async (_event, payload: { message: string; history: Array<{ role: string; content: string }> }) => {
  const { message, history } = payload;

  if (!aiConfig.apiKey || aiConfig.apiKey === 'YOUR_API_KEY') {
    return {
      success: true,
      reply: `[AI回复占位] 你说了："${message}"\n\n（AI接口尚未配置 API Key，请在设置中配置后保存）`,
    };
  }

  try {
    const request: AIChatRequest = {
      messages: history.map((msg) => ({
        role: msg.role as 'system' | 'user' | 'assistant',
        content: msg.content,
      })),
      userMessage: message,
    };

    const result = await chatWithAI(aiConfig, request);

    if (result.success) {
      return { success: true, reply: result.reply };
    } else {
      return { success: false, reply: '', error: result.error ?? '未知错误' };
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return { success: false, reply: '', error: errorMessage };
  }
});

/** 更新 AI 配置（运行时，不持久化） */
ipcMain.handle('update-ai-config', (_event, newConfig: Partial<AIProviderConfig>) => {
  Object.assign(aiConfig, newConfig);
  return { success: true, message: `AI 配置已更新: ${aiConfig.type} / ${aiConfig.model}` };
});

/** 保存 AI 配置到文件 */
ipcMain.handle('save-ai-config', (_event, newConfig: Record<string, unknown>) => {
  try {
    // 写入文件
    fs.writeFileSync(aiConfigPath, JSON.stringify(newConfig, null, 2), 'utf-8');
    // 同步更新运行时配置
    Object.assign(aiConfig, newConfig);
    return { success: true, message: 'AI 配置已保存' };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return { success: false, message: `保存失败: ${errorMessage}` };
  }
});

/** 从文件加载 AI 配置 */
ipcMain.handle('load-ai-config', () => {
  try {
    if (fs.existsSync(aiConfigPath)) {
      const raw = fs.readFileSync(aiConfigPath, 'utf-8');
      const data = JSON.parse(raw);
      return { success: true, data };
    }
    // 文件不存在，返回当前运行时配置
    return { success: true, data: { ...aiConfig } };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return { success: false, data: null, message: errorMessage };
  }
});

/** 测试 AI 连接 */
ipcMain.handle('test-ai-connection', async (_event, testConfig: Record<string, unknown>) => {
  try {
    const config: AIProviderConfig = {
      type: (testConfig.type as AIProviderConfig['type']) ?? 'openai',
      baseURL: (testConfig.baseURL as string) ?? '',
      apiKey: (testConfig.apiKey as string) ?? '',
      model: (testConfig.model as string) ?? '',
      maxTokens: 64,
      temperature: 0,
      systemPrompt: '测试连接，请回复"连接成功"四个字。',
    };

    const result = await chatWithAI(config, {
      messages: [],
      userMessage: '测试',
    });

    if (result.success) {
      return { success: true, reply: result.reply };
    } else {
      return { success: false, error: result.error ?? '连接失败' };
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return { success: false, error: errorMessage };
  }
});

// ========== 死亡存档（仅简单模式） ==========
const deathArchiveDir = path.join(configDir, 'death-archives');
if (!fs.existsSync(deathArchiveDir)) {
  fs.mkdirSync(deathArchiveDir, { recursive: true });
}

ipcMain.handle('save-death-archive', (_event, data: unknown) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filePath = path.join(deathArchiveDir, `death-${timestamp}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return { success: true, message: '死亡存档已保存' };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return { success: false, message: `保存失败: ${errorMessage}` };
  }
});

// ========== Electron 生命周期 ==========

app.whenReady().then(async () => {
  await gameDb.init();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
