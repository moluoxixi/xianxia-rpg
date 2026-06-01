// ========== 战斗系统类型定义 ==========

/** 战斗结果 */
export type CombatResult = 'win' | 'lose' | 'flee';

/** 战斗回合记录 */
export interface CombatRound {
  attacker: string; // 攻击方名称
  defender: string; // 防守方名称
  damage: number; // 造成伤害
  remainingHp: number; // 防守方剩余生命值
  isCritical: boolean; // 是否暴击
}

/** 战斗日志 */
export interface CombatLog {
  player: string; // 玩家名称
  opponent: string; // 对手名称
  rounds: CombatRound[]; // 回合记录
  result: CombatResult; // 战斗结果
  playerHp: number; // 玩家剩余生命值
  opponentHp: number; // 对手剩余生命值
  loot: Array<{ name: string; count: number }>; // 获得战利品
  expGained: number; // 获得经验
}

/**
 * 简易战斗判定（服务端/渲染端均可调用）
 * 返回战斗日志
 */
export function resolveCombat(
  playerAttack: number,
  playerDefense: number,
  playerHp: number,
  _playerMaxHp: number,
  opponentAttack: number,
  opponentDefense: number,
  opponentHp: number,
  _opponentMaxHp: number,
  difficultyMultiplier: number,
  lootTable?: Array<{ name: string; count: number; chance: number }>,
  expReward?: number,
): CombatLog {
  const rounds: CombatRound[] = [];
  let currentPlayerHp = playerHp;
  let currentOpponentHp = opponentHp;
  const loot: Array<{ name: string; count: number }> = [];
  let expGained = 0;

  // 玩家攻击力受难度系数影响
  const adjustedPlayerAttack = Math.floor(playerAttack * (2 - difficultyMultiplier));
  const adjustedOpponentAttack = Math.floor(opponentAttack * difficultyMultiplier);

  // 最多 20 回合防止死循环
  const maxRounds = 20;
  for (let i = 0; i < maxRounds; i++) {
    // 玩家攻击
    const playerDmg = Math.max(1, adjustedPlayerAttack - Math.floor(opponentDefense * 0.5));
    const isCrit = Math.random() < 0.15;
    const finalPlayerDmg = isCrit ? Math.floor(playerDmg * 1.5) : playerDmg;
    currentOpponentHp = Math.max(0, currentOpponentHp - finalPlayerDmg);
    rounds.push({
      attacker: '你',
      defender: '对手',
      damage: finalPlayerDmg,
      remainingHp: currentOpponentHp,
      isCritical: isCrit,
    });

    if (currentOpponentHp <= 0) {
      // 玩家胜利
      if (lootTable) {
        for (const entry of lootTable) {
          if (Math.random() < entry.chance) {
            loot.push({ name: entry.name, count: entry.count });
          }
        }
      }
      expGained = expReward ?? 0;
      return {
        player: '你',
        opponent: '对手',
        rounds,
        result: 'win',
        playerHp: currentPlayerHp,
        opponentHp: 0,
        loot,
        expGained,
      };
    }

    // 对手攻击
    const oppDmg = Math.max(1, adjustedOpponentAttack - Math.floor(playerDefense * 0.5));
    const oppCrit = Math.random() < 0.1;
    const finalOppDmg = oppCrit ? Math.floor(oppDmg * 1.5) : oppDmg;
    currentPlayerHp = Math.max(0, currentPlayerHp - finalOppDmg);
    rounds.push({
      attacker: '对手',
      defender: '你',
      damage: finalOppDmg,
      remainingHp: currentPlayerHp,
      isCritical: oppCrit,
    });

    if (currentPlayerHp <= 0) {
      return {
        player: '你',
        opponent: '对手',
        rounds,
        result: 'lose',
        playerHp: 0,
        opponentHp: currentOpponentHp,
        loot: [],
        expGained: 0,
      };
    }
  }

  // 超过回合上限，判定为平局逃跑
  return {
    player: '你',
    opponent: '对手',
    rounds,
    result: 'flee',
    playerHp: currentPlayerHp,
    opponentHp: currentOpponentHp,
    loot: [],
    expGained: 0,
  };
}
