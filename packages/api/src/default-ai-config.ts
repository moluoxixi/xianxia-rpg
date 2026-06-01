import type { AIProviderConfig, AIProviderType } from './ai';
import { createDefaultModelSettings } from '@xianxia-rpg/model';
import { createDefaultProviderApiKeys, createDefaultProviderBaseURLs, loadRuntimeEnv } from './env';

loadRuntimeEnv();

export interface RuntimeAIConfig extends AIProviderConfig {
  /** Per-provider defaults come from server-side environment variables and follow provider switching in the UI. */
  providerApiKeys: Record<AIProviderType, string>;
  /** Per-provider base URLs are kept separate because OpenAI-compatible and Anthropic endpoints use different roots. */
  providerBaseURLs: Record<AIProviderType, string>;
}

const defaultModelSettings = createDefaultModelSettings('openai');
const defaultProviderBaseURLs = createDefaultProviderBaseURLs({
  openai: createDefaultModelSettings('openai').baseURL,
  anthropic: createDefaultModelSettings('anthropic').baseURL,
});
const defaultProviderApiKeys = createDefaultProviderApiKeys();

export const defaultAIConfig: RuntimeAIConfig = {
  type: 'openai',
  baseURL: defaultProviderBaseURLs.openai,
  apiKey: defaultProviderApiKeys.openai,
  model: defaultModelSettings.model,
  providerApiKeys: defaultProviderApiKeys,
  providerBaseURLs: defaultProviderBaseURLs,
  maxTokens: defaultModelSettings.maxTokens,
  temperature: defaultModelSettings.temperature,
  systemPrompt: `你是一个半开放式文字 RPG 的 AI 叙事者和游戏主持人。
具体世界观、参考小说、玩家身份、当前场景和规则边界都由请求上下文提供；不要假设固定作品或固定主线。
请根据玩家当前人物数据、动态属性、背包、能力/技能、当前位置、场景描述和玩家行动推进场景、人物和资源变化，保持剧本风格，正文控制在200字以内。
请求上下文会提供当前剧本已经落库的人物属性名称和值；不要按题材模板强行改写属性。
若当前题材为修仙/玄幻且玩家状态确实使用修仙境界，境界必须沿“炼气期一层至十三层、筑基初中后、结丹初中后、元婴初中后、化神、炼虚、合体、大乘、渡劫、真仙”逐阶推进，不得随意跳阶。
正文只写叙事内容，不要在正文中展示快捷指令。
快捷指令必须结合当前场景，提供移动、探索、社交、交易、修炼、战斗等多样选择，避免连续只推荐修炼。
如果玩家进入或发现未记录场景，必须同时返回 scene_define 补全场景描述、关联场景、资源和危险度。
如果玩家修炼、战斗、服药、获得或失去物品，必须返回对应资源变化；如果剧情导致人物形态或关键指标变化，使用 attribute_update 更新或新增属性。
如果请求上下文包含【本地规则已结算】，表示数值变化已经由游戏规则处理，不能重复返回同类资源变化；你只负责推导额外剧情后果。
如果请求上下文包含【AI 推导请求】，表示该行动需要你根据当前数据推导后果；合理时必须返回资源、场景、NPC、战斗或快捷指令变化。
如需更新状态或快捷指令，请在正文后追加结构化段落，且不要把结构化段落写进正文：
[资源变化]
{"changes":[{"type":"location","value":"旧钟楼"},{"type":"scene_define","scene_name":"旧钟楼","scene_type":"town","scene_description":"一处可发现线索与人物关系的场所","scene_connected":["主街","档案室"],"scene_resources":["线索","人脉"],"scene_dangerous":false},{"type":"attribute_update","attribute_stat_key":"hp","attribute_label":"机体完整度","attribute_value":72,"attribute_max":100,"attribute_description":"机械化改造后的承损指标"}]}
[快捷指令]
{"actions":["观察四周","询问线索","前往主街","整理背包"]}`,
};

export function createDefaultAIConfig(): RuntimeAIConfig {
  return { ...defaultAIConfig, providerApiKeys: { ...defaultAIConfig.providerApiKeys }, providerBaseURLs: { ...defaultAIConfig.providerBaseURLs } };
}
