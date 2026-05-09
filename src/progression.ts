import type { Profile, TopicId } from "./types";

/** この XP 以上でそのレベル（1始まり） */
export const LEVEL_MIN_XP: number[] = [
  0, 100, 220, 380, 580, 820, 1100, 1420, 1780, 2180, 2620, 3100, 3620, 4180, 4780, 5420, 6100, 6820, 7580, 8380,
  9220, 10100, 11020, 11980, 12980, 14020, 15100, 16220, 17380, 18580, 19820, 21100, 22420, 23780, 25180, 26620,
  28100, 29620, 31180, 32780,
];

const POST_TABLE_STEP = 5000;

export function levelFromTotalXp(xp: number): number {
  const lastIx = LEVEL_MIN_XP.length - 1;
  const cap = LEVEL_MIN_XP[lastIx];
  if (xp < cap) {
    for (let i = lastIx; i >= 0; i--) {
      if (xp >= LEVEL_MIN_XP[i]) return i + 1;
    }
    return 1;
  }
  return lastIx + 1 + Math.floor((xp - cap) / POST_TABLE_STEP);
}

export function xpThresholdForLevel(level: number): number {
  if (level <= 1) return 0;
  if (level <= LEVEL_MIN_XP.length) return LEVEL_MIN_XP[level - 1];
  const cap = LEVEL_MIN_XP[LEVEL_MIN_XP.length - 1];
  const over = level - LEVEL_MIN_XP.length;
  return cap + over * POST_TABLE_STEP;
}

export function rankForLevel(level: number): { title: string; emoji: string; tagline: string } {
  if (level >= 35) return { title: "グランドマスター", emoji: "👑", tagline: "プロデューサー賞・頂への招待ゾーン" };
  if (level >= 28) return { title: "レジェンド受験生", emoji: "🌟", tagline: "応用〜ひっかけも自在" };
  if (level >= 20) return { title: "数チャンプロ", emoji: "🏆", tagline: "実力試しもクリア級" };
  if (level >= 14) return { title: "定期テストの守り人", emoji: "🛡️", tagline: "ひっつき防止の基礎完成" };
  if (level >= 8) return { title: "中2ランナー", emoji: "🏃", tagline: "続けるほど速くなる" };
  if (level >= 4) return { title: "公式ドリル突破者", emoji: "📐", tagline: "パターン暗記より理解へ" };
  return { title: "かけだしチャレンジャー", emoji: "🌱", tagline: "この先がどんどん楽しくなる" };
}

export function progressionSnapshot(totalXp: number): {
  level: number;
  rank: { title: string; emoji: string; tagline: string };
  xpIntoLevel: number;
  xpForNextLevel: number;
  xpToNext: number;
  pctToNext: number;
} {
  const level = levelFromTotalXp(totalXp);
  const curFloor = xpThresholdForLevel(level);
  const nextFloor = xpThresholdForLevel(level + 1);
  const span = Math.max(1, nextFloor - curFloor);
  const xpIntoLevel = totalXp - curFloor;
  const xpToNext = nextFloor - totalXp;
  return {
    level,
    rank: rankForLevel(level),
    xpIntoLevel,
    xpForNextLevel: span,
    xpToNext,
    pctToNext: Math.min(100, Math.floor((100 * xpIntoLevel) / span)),
  };
}

export const MIX_UNLOCK_LEVEL = 5;

export interface BadgeDef {
  id: string;
  title: string;
  description: string;
  emoji: string;
}

export const BADGE_CATALOG: BadgeDef[] = [
  { id: "first_clear", title: "はじめの一歩", description: "1 ラウンドをおわらせた", emoji: "🎯" },
  { id: "xp_350", title: "XP はじける", description: "累計 XP 350 をこえた", emoji: "✨" },
  { id: "level_8", title: "ランナー認定", description: "レベル 8 に到達した", emoji: "🏃" },
  { id: "level_14", title: "ステディ守り", description: "レベル 14 に到達した", emoji: "🛡️" },
  { id: "level_20", title: "プロの背中", description: "レベル 20 に到達した", emoji: "🏆" },
  { id: "rounds_10", title: "根気の達人", description: "プレイしたラウンドが 10", emoji: "📚" },
  { id: "rounds_30", title: "練磨マニアック", description: "プレイしたラウンドが 30", emoji: "🔥" },
  { id: "mix_visitor", title: "オールスター参加者", description: "オールジャンルを一度プレイした", emoji: "🎪" },
  { id: "triple_topic", title: "広く強くチャート", description: "3種類以上のステージでベスト記録がある", emoji: "🎗️" },
];

function hasBadge(profile: Profile, id: string): boolean {
  return profile.unlockedBadges.includes(id);
}

function uniqTopicsWithBest(profile: Profile): number {
  const scores = profile.bestScores;
  let n = 0;
  for (const tid of ["linear", "geometry", "probability", "algebra", "mix"] as TopicId[]) {
    const v = scores[tid];
    if (v != null && v > 0) n++;
  }
  return n;
}

/** 未獲得で条件をみたしたバッジ id */
export function computeNewBadgeIds(profile: Profile): string[] {
  const level = levelFromTotalXp(profile.totalXp);
  const earned: string[] = [];

  const tryAdd = (id: string, ok: boolean) => {
    if (ok && !hasBadge(profile, id)) earned.push(id);
  };

  tryAdd("first_clear", profile.roundsPlayed >= 1);
  tryAdd("xp_350", profile.totalXp >= 350);
  tryAdd("level_8", level >= 8);
  tryAdd("level_14", level >= 14);
  tryAdd("level_20", level >= 20);
  tryAdd("rounds_10", profile.roundsPlayed >= 10);
  tryAdd("rounds_30", profile.roundsPlayed >= 30);
  tryAdd("mix_visitor", profile.topicsPlayed.includes("mix"));
  tryAdd("triple_topic", uniqTopicsWithBest(profile) >= 3);

  return earned;
}

export function mergeBadges(profile: Profile, ids: string[]): Profile {
  if (!ids.length) return profile;
  const set = new Set(profile.unlockedBadges);
  for (const id of ids) set.add(id);
  return { ...profile, unlockedBadges: [...set] };
}

export function badgeById(id: string): BadgeDef | undefined {
  return BADGE_CATALOG.find((b) => b.id === id);
}
