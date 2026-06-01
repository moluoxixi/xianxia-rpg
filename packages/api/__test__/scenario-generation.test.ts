import { describe, expect, it } from 'vitest';
import { createScenarioUserPrompt } from '../src/scenario-generation';

describe('scenario generation prompt', () => {
  it('pins known reference protagonists instead of letting the model invent a player name', () => {
    const prompt = createScenarioUserPrompt({
      referenceNovel: '第一序列',
      author: '会说话的肘子',
      description: '壁垒、荒野、灾变后的生存与成长。',
      difficulty: 'normal',
      gameTypeId: 'cyberpunk',
      themeId: 'cyberpunk',
    });

    expect(prompt).toContain('任小粟');
    expect(prompt).toContain('player.name 必须使用这个名字');
    expect(prompt).toContain('不要根据 UI 主题 ID 或题材 ID 改写玩家身份');
  });
});
