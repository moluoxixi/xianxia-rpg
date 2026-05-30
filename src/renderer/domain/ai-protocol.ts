import type { Choice } from './types';
import type { ResourceChange } from './game-state';

export function parseResourceChanges(aiReply: string): { cleanText: string; changes: ResourceChange[] } {
  const result = { cleanText: aiReply, changes: [] as ResourceChange[] };
  const match = aiReply.match(/\[资源变化\]\s*\n?([\s\S]*?)(?=\n\n|\n?\[快捷指令\]|\n*$)/);
  if (!match) return result;

  let jsonStr = match[1].trim();
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) jsonStr = codeBlockMatch[1].trim();

  const parsed = parseJsonObject(jsonStr);
  if (parsed && Array.isArray(parsed.changes)) {
    result.changes = parsed.changes.filter(isResourceChange);
  }

  result.cleanText = aiReply.replace(/\[资源变化\]\s*\n?[\s\S]*?(?=\n\n|\n?\[快捷指令\]|\n*$)/, '').trim();
  return result;
}

export function parseQuickActions(text: string): { cleanText: string; actions: string[] } {
  const match = text.match(/\[快捷指令\]\s*(\{[\s\S]*?\})/);
  if (!match) return { cleanText: text, actions: [] };

  const parsed = parseJsonObject(match[1]);
  const actions = parsed && Array.isArray(parsed.actions)
    ? parsed.actions.filter((item: unknown) => typeof item === 'string' && item.trim().length > 0)
    : [];

  return {
    cleanText: text.replace(/\[快捷指令\]\s*\{[\s\S]*?\}/, '').trim(),
    actions,
  };
}

export function parseChoices(text: string): Choice[] {
  const choices: Choice[] = [];
  const regex = /^\s*(\d+)\s*[)）、.．]\s*(.+)$/gm;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    choices.push({ index: Number(match[1]), text: match[2].trim() });
  }
  return choices;
}

export function stripChoices(text: string): string {
  return text.replace(/^\s*\d+\s*[)）、.．]\s*.+$/gm, '').replace(/\n{3,}/g, '\n\n').trim();
}

function parseJsonObject(source: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(source) as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
  } catch {
    const jsonMatch = source.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    try {
      const parsed = JSON.parse(jsonMatch[0]) as unknown;
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
    } catch {
      return null;
    }
  }
}

function isResourceChange(value: unknown): value is ResourceChange {
  if (!value || typeof value !== 'object') return false;
  const type = (value as { type?: unknown }).type;
  return typeof type === 'string';
}
