import type { CharacterAttribute, CharacterStats, StatAttributeKey } from './types';

const statSlots: Record<StatAttributeKey, { valueKey: keyof CharacterStats; maxKey: keyof CharacterStats }> = {
  hp: { valueKey: 'hp', maxKey: 'maxHp' },
  mp: { valueKey: 'mp', maxKey: 'maxMp' },
  exp: { valueKey: 'exp', maxKey: 'maxExp' },
};

const defaultAttributeLabels: Record<StatAttributeKey, string> = {
  hp: '状态',
  mp: '行动力',
  exp: '进展',
};

export function createDefaultAttributes(stats: CharacterStats): CharacterAttribute[] {
  return (Object.keys(defaultAttributeLabels) as StatAttributeKey[]).map(statKey => ({
    key: statKey,
    label: defaultAttributeLabels[statKey],
    value: Number(stats[statSlots[statKey].valueKey]),
    max: Number(stats[statSlots[statKey].maxKey]),
    statKey,
  }));
}

export function applyAttributesToStats(stats: CharacterStats, attributes: CharacterAttribute[] | undefined): CharacterStats {
  const next = { ...stats };
  for (const attribute of attributes ?? []) {
    if (attribute.statKey === 'hp') {
      next.hp = attribute.value;
      next.maxHp = attribute.max;
    }
    if (attribute.statKey === 'mp') {
      next.mp = attribute.value;
      next.maxMp = attribute.max;
    }
    if (attribute.statKey === 'exp') {
      next.exp = attribute.value;
      next.maxExp = attribute.max;
    }
  }
  return next;
}

export function createAttributesFromScenario(initialAttributes: CharacterAttribute[] | undefined, stats: CharacterStats): CharacterAttribute[] {
  const attributes = initialAttributes?.length ? structuredClone(initialAttributes) : createDefaultAttributes(stats);
  return syncAttributesFromStats(attributes, stats);
}

export function syncAttributesFromStats(attributes: CharacterAttribute[], stats: CharacterStats): CharacterAttribute[] {
  return attributes.map((attribute) => {
    if (!attribute.statKey)
      return attribute;
    const slot = statSlots[attribute.statKey];
    return {
      ...attribute,
      value: Number(stats[slot.valueKey]),
      max: Number(stats[slot.maxKey]),
    };
  });
}

export function syncStatAttribute(attributes: CharacterAttribute[], stats: CharacterStats, statKey: StatAttributeKey): CharacterAttribute[] {
  const slot = statSlots[statKey];
  return attributes.map((attribute) => {
    if (attribute.statKey !== statKey)
      return attribute;
    return {
      ...attribute,
      value: Number(stats[slot.valueKey]),
      max: Number(stats[slot.maxKey]),
    };
  });
}

export function getStatAttributeLabel(attributes: CharacterAttribute[], statKey: StatAttributeKey): string {
  return attributes.find(attribute => attribute.statKey === statKey)?.label ?? defaultAttributeLabels[statKey];
}

export function formatAttribute(attribute: CharacterAttribute): string {
  return `${attribute.label}:${attribute.value}/${attribute.max}`;
}

export function upsertAttribute(attributes: CharacterAttribute[], nextAttribute: CharacterAttribute): CharacterAttribute[] {
  const index = attributes.findIndex(attribute => attribute.key === nextAttribute.key);
  if (index === -1)
    return [...attributes, nextAttribute];

  const next = [...attributes];
  next[index] = { ...next[index], ...nextAttribute };
  return next;
}
