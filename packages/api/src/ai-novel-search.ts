import type { HostNovelSearchResult } from '@xianxia-rpg/core';
import type { AIProviderConfig } from './ai';
import { z } from 'zod';
import { chatWithAI } from './ai';

const aiNovelSchema = z.object({
  id: z.string(),
  title: z.string(),
  author: z.string(),
  description: z.string(),
  source: z.string(),
});

const aiNovelSearchSchema = z.object({
  novels: z.array(aiNovelSchema).min(1).max(12),
  message: z.string().optional(),
});

export async function searchNovelsWithAI(config: AIProviderConfig, keyword: string): Promise<HostNovelSearchResult> {
  if (!config.apiKey || config.apiKey === 'YOUR_API_KEY') {
    return { success: false, data: [], message: 'AI 小说搜索需要先配置模型 API Key。' };
  }

  try {
    const result = await chatWithAI(
      { ...config, maxTokens: 1200, temperature: 0.2, systemPrompt: createNovelSearchSystemPrompt() },
      { messages: [], userMessage: createNovelSearchUserPrompt(keyword) },
    );
    if (!result.success)
      return { success: false, data: [], message: `AI 小说搜索失败：${result.error ?? '未知错误'}` };

    const parsed = aiNovelSearchSchema.parse(JSON.parse(extractJsonObject(result.reply)));
    return {
      success: true,
      data: parsed.novels.map((novel, index) => ({
        ...novel,
        id: novel.id || `ai-novel-${index + 1}`,
        source: novel.source || 'AI 小说识别',
      })),
      message: parsed.message ?? 'AI 小说搜索结果',
    };
  }
  catch (error) {
    return { success: false, data: [], message: `AI 小说搜索结果解析失败：${error instanceof Error ? error.message : String(error)}` };
  }
}

function createNovelSearchSystemPrompt(): string {
  return `你是中文网络小说检索助手。你只返回 JSON，不要 Markdown。
任务：根据用户输入的小说名、别名或关键词，返回最可能的中文网络小说候选。
要求：
1. 优先匹配真实存在、常见读者认知中的作品。
2. 用户输入具体书名时，第一项必须尽量是该书本身。
3. 不需要章节正文，不要输出版权文本，只返回元数据。
4. description 用一句话描述题材、世界观或核心设定，方便文字 RPG 生成开局。
JSON 结构：
{"novels":[{"id":"stable-slug","title":"小说名","author":"作者","description":"题材描述","source":"AI 小说识别"}],"message":"说明"}`;
}

function createNovelSearchUserPrompt(keyword: string): string {
  if (keyword)
    return `搜索关键词：${keyword}\n请返回 8 到 12 个候选。`;
  return '用户还没有输入关键词，请返回 8 到 12 个适合作为半开放式文字 RPG 参考的中文网络小说候选。';
}

function extractJsonObject(text: string): string {
  const startIndex = text.indexOf('{');
  const endIndex = text.lastIndexOf('}');
  if (startIndex < 0 || endIndex < startIndex)
    throw new Error('AI 小说搜索未返回 JSON 对象');
  return text.slice(startIndex, endIndex + 1);
}
