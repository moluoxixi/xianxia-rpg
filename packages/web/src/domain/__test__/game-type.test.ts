import { describe, expect, it } from 'vitest';
import { gameTypeIds, getGameTypePreset } from '../game-type';

describe('game type UI copy', () => {
  it('defines status labels for every supported game type', () => {
    for (const gameTypeId of gameTypeIds) {
      const preset = getGameTypePreset(gameTypeId);

      expect(preset.ui.rankLabel).not.toHaveLength(0);
      expect(preset.ui.nextRankLabel).not.toHaveLength(0);
      expect(preset.ui.factionLabel).not.toHaveLength(0);
      expect(preset.ui.statLabels.hp).not.toHaveLength(0);
      expect(preset.ui.statLabels.mp).not.toHaveLength(0);
      expect(preset.ui.statLabels.exp).not.toHaveLength(0);
      expect(preset.ui.abilitiesTitle).not.toHaveLength(0);
      expect(preset.ui.abilityItemLabel).not.toHaveLength(0);
    }
  });

  it('keeps cultivation copy scoped to the xianxia game type', () => {
    const cultivationWords = ['境界', '门派', '气血', '灵力', '修为', '功法'];
    for (const gameTypeId of gameTypeIds.filter(id => id !== 'xianxia')) {
      const preset = getGameTypePreset(gameTypeId);
      const uiCopy = [
        preset.ui.rankLabel,
        preset.ui.nextRankLabel,
        preset.ui.factionLabel,
        preset.ui.statLabels.hp,
        preset.ui.statLabels.mp,
        preset.ui.statLabels.exp,
        preset.ui.abilitiesTitle,
        preset.ui.abilityItemLabel,
        preset.ui.emptyAbilitiesText,
      ].join('');

      for (const word of cultivationWords) {
        expect(uiCopy).not.toContain(word);
      }
    }
  });
});
