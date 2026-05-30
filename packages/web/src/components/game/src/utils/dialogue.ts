import { parseQuickActions } from '@/domain';

export interface AssistantDialogue {
  speakerName: string;
  content: string;
}

const narratorName = '叙事者';

export function resolveAssistantDialogue(content: string): AssistantDialogue {
  const cleanContent = parseQuickActions(content).cleanText;
  const prefix = splitSpeakerPrefix(cleanContent);
  return prefix ?? { speakerName: narratorName, content: cleanContent };
}

function splitSpeakerPrefix(content: string): AssistantDialogue | null {
  const firstLineEnd = content.indexOf('\n');
  const firstLine = firstLineEnd === -1 ? content : content.slice(0, firstLineEnd);
  const colonIndex = getFirstColonIndex(firstLine);

  // AI 回复首行可写成“墨大夫：……”，气泡标题承接说话人，正文只保留台词。
  if (colonIndex <= 0 || colonIndex > 12)
    return null;

  const speakerName = stripSpeakerDecorations(firstLine.slice(0, colonIndex));
  if (speakerName.length === 0)
    return null;

  const firstLineContent = removeOneLeadingSpace(firstLine.slice(colonIndex + 1));
  const restContent = firstLineEnd === -1 ? firstLineContent : `${firstLineContent}${content.slice(firstLineEnd)}`;
  return { speakerName, content: restContent };
}

function getFirstColonIndex(value: string): number {
  const chineseColonIndex = value.indexOf('：');
  const asciiColonIndex = value.indexOf(':');

  if (chineseColonIndex === -1)
    return asciiColonIndex;
  if (asciiColonIndex === -1)
    return chineseColonIndex;
  return Math.min(chineseColonIndex, asciiColonIndex);
}

function stripSpeakerDecorations(value: string): string {
  return value
    .replaceAll('「', '')
    .replaceAll('」', '')
    .replaceAll('“', '')
    .replaceAll('”', '')
    .replaceAll('"', '');
}

function removeOneLeadingSpace(value: string): string {
  if (value.startsWith(' ') || value.startsWith('　'))
    return value.slice(1);
  return value;
}
