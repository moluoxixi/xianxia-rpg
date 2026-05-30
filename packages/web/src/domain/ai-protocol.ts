import type { ResourceChange } from './game-state';
import type { Choice } from './types';

interface MarkedSection {
  content: string;
  start: number;
  end: number;
}

const CHOICE_SEPARATORS = new Set([')', '）', '、', '.', '．']);

export function parseResourceChanges(aiReply: string): { cleanText: string; changes: ResourceChange[] } {
  const result = { cleanText: aiReply, changes: [] as ResourceChange[] };
  const section = readMarkedSection(aiReply, '[资源变化]', ['[快捷指令]', '快捷指令：', '快捷指令:']);
  if (!section)
    return result;

  const jsonText = unwrapCodeFence(section.content.trim());
  const parsed = parseJsonObject(jsonText);
  if (parsed && Array.isArray(parsed.changes))
    result.changes = parsed.changes.filter(isResourceChange);

  result.cleanText = `${aiReply.slice(0, section.start)}${aiReply.slice(section.end)}`.trim();
  return result;
}

export function parseQuickActions(text: string): { cleanText: string; actions: string[] } {
  const section = readMarkedSection(text, '[快捷指令]');
  if (!section)
    return parseInlineQuickActions(text);

  const jsonText = extractFirstJsonObject(section.content);
  const parsed = jsonText ? parseJsonObject(jsonText) : null;
  const actions = parsed && Array.isArray(parsed.actions)
    ? parsed.actions.filter((item: unknown) => typeof item === 'string' && item.trim().length > 0)
    : parseQuickActionList(section.content);

  return {
    cleanText: `${text.slice(0, section.start)}${text.slice(section.end)}`.trim(),
    actions,
  };
}

export function parseChoices(text: string): Choice[] {
  const choices: Choice[] = [];
  for (const line of text.split('\n')) {
    const choice = parseChoiceLine(line);
    if (choice) {
      choices.push(choice);
    }
  }
  return choices;
}

export function stripChoices(text: string): string {
  return text
    .split('\n')
    .filter(line => !parseChoiceLine(line))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function parseInlineQuickActions(text: string): { cleanText: string; actions: string[] } {
  const section = readInlineQuickActionSection(text);
  if (!section)
    return { cleanText: text, actions: [] };

  return {
    cleanText: `${text.slice(0, section.start)}${text.slice(section.end)}`.trim(),
    actions: parseQuickActionList(section.content),
  };
}

function readInlineQuickActionSection(text: string): MarkedSection | null {
  const markers = ['快捷指令：', '快捷指令:'];
  let match: { marker: string; start: number } | null = null;
  for (const marker of markers) {
    const start = text.indexOf(marker);
    if (start !== -1 && (!match || start < match.start))
      match = { marker, start };
  }
  if (!match)
    return null;

  const contentStart = match.start + match.marker.length;
  return {
    content: text.slice(contentStart),
    start: match.start,
    end: text.length,
  };
}

function parseQuickActionList(source: string): string[] {
  // 兼容模型偶尔把快捷指令输出成中文标签行，避免它混入对话正文。
  return source
    .split('\n')
    .flatMap(line => line.split('｜'))
    .flatMap(line => line.split('|'))
    .flatMap(line => line.split('、'))
    .map(action => normalizeQuickAction(action))
    .filter(action => action.length > 0);
}

function normalizeQuickAction(action: string): string {
  return removeQuickActionPrefix(action)
    .split('`')
    .join('')
    .trim();
}

function removeQuickActionPrefix(action: string): string {
  let cursor = 0;
  while (cursor < action.length && isQuickActionPrefixChar(action[cursor])) {
    cursor += 1;
  }
  return action.slice(cursor);
}

function isQuickActionPrefixChar(char: string): boolean {
  return char === '-' || char === '*' || char === '•' || char === '.' || char === ')' || char === '）' || char.trim() === '' || isDigit(char);
}

function parseChoiceLine(line: string): Choice | null {
  let cursor = skipWhitespace(line, 0);
  const numberStart = cursor;

  while (cursor < line.length && isDigit(line[cursor])) {
    cursor += 1;
  }

  if (numberStart === cursor) {
    return null;
  }

  const numberEnd = cursor;
  cursor = skipWhitespace(line, cursor);
  if (!CHOICE_SEPARATORS.has(line[cursor])) {
    return null;
  }

  cursor = skipWhitespace(line, cursor + 1);
  const choiceText = line.slice(cursor).trim();
  if (!choiceText) {
    return null;
  }

  return { index: Number(line.slice(numberStart, numberEnd)), text: choiceText };
}

function skipWhitespace(line: string, start: number): number {
  let cursor = start;
  while (cursor < line.length && line[cursor].trim() === '') {
    cursor += 1;
  }
  return cursor;
}

function isDigit(char: string): boolean {
  return char >= '0' && char <= '9';
}

function readMarkedSection(text: string, marker: string, nextMarkers: string[] = []): MarkedSection | null {
  const start = text.indexOf(marker);
  if (start === -1)
    return null;

  const contentStart = start + marker.length;
  const end = findSectionEnd(text, contentStart, nextMarkers);
  return { content: text.slice(contentStart, end), start, end };
}

function findSectionEnd(text: string, contentStart: number, nextMarkers: string[]): number {
  let end = text.length;
  for (const marker of nextMarkers) {
    const markerIndex = text.indexOf(marker, contentStart);
    if (markerIndex !== -1 && markerIndex < end)
      end = markerIndex;
  }
  return end;
}

function unwrapCodeFence(source: string): string {
  if (!source.startsWith('```'))
    return source;

  const firstLineEnd = source.indexOf('\n');
  const lastFenceStart = source.lastIndexOf('```');
  if (firstLineEnd === -1 || lastFenceStart <= firstLineEnd)
    return source;

  return source.slice(firstLineEnd + 1, lastFenceStart).trim();
}

function parseJsonObject(source: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(source) as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
  }
  catch {
    const jsonText = extractFirstJsonObject(source);
    if (!jsonText)
      return null;

    try {
      const parsed = JSON.parse(jsonText) as unknown;
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
    }
    catch {
      return null;
    }
  }
}

function extractFirstJsonObject(source: string): string | null {
  const start = source.indexOf('{');
  if (start === -1)
    return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  // 只匹配 JSON 对象边界，不尝试修正 JSON 内容；解析失败继续交给调用方暴露为空结果。
  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString)
      continue;

    if (char === '{') {
      depth += 1;
    }
    else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return source.slice(start, index + 1);
      }
    }
  }

  return null;
}

function isResourceChange(value: unknown): value is ResourceChange {
  if (!value || typeof value !== 'object')
    return false;
  const type = (value as { type?: unknown }).type;
  return typeof type === 'string';
}
