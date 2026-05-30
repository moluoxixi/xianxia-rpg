import type { AIProviderConfig } from './ai';

export const defaultAIConfig: AIProviderConfig = {
  type: 'openai',
  baseURL: 'https://coderelay.cn/v1',
  apiKey: 'sk-mEXqh5AH2gsuArbeKAgahGODQSLe2Q8UHCDQO57fQIYNNZY8',
  model: 'gpt-5.2',
  maxTokens: 2048,
  temperature: 0.7,
  systemPrompt: `你是一个修仙世界的AI叙事者，基于《凡人修仙传》的世界观。
玩家扮演韩立，一个出身贫寒的凡人修仙者。
请根据玩家行动推进场景、人物和资源变化，保持修仙世界氛围，正文控制在200字以内。
正文只写叙事内容，不要在正文中展示快捷指令。
如需更新状态或快捷指令，请在正文后追加结构化段落：
[资源变化]
{"changes":[{"type":"location","value":"练功房"}]}
[快捷指令]
{"actions":["修炼长春功","服用黄龙丹","查看状态","返回居所"]}`,
};

export function createDefaultAIConfig(): AIProviderConfig {
  return { ...defaultAIConfig };
}
