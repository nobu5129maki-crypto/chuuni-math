import type { Profile, TopicId } from "./types";

const KEY = "juken-math-profile-v1";

const defaultProfile: Profile = {
  totalXp: 0,
  bestScores: {},
  unlockedBadges: [],
  roundsPlayed: 0,
  topicsPlayed: [],
};

export function loadProfile(): Profile {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...defaultProfile };
    const p = JSON.parse(raw) as Profile;
    const badges = p.unlockedBadges;
    const topics = p.topicsPlayed;
    return {
      totalXp: typeof p.totalXp === "number" ? p.totalXp : 0,
      bestScores: p.bestScores && typeof p.bestScores === "object" ? p.bestScores : {},
      unlockedBadges: Array.isArray(badges) ? [...badges] : [],
      roundsPlayed: typeof p.roundsPlayed === "number" ? p.roundsPlayed : 0,
      topicsPlayed: Array.isArray(topics) ? [...topics] : [],
    };
  } catch {
    return { ...defaultProfile };
  }
}

export function saveProfile(p: Profile): void {
  localStorage.setItem(KEY, JSON.stringify(p));
}

export function mergeBestScore(profile: Profile, topic: TopicId, score: number): Profile {
  const prev = profile.bestScores[topic] ?? 0;
  const next = { ...profile, bestScores: { ...profile.bestScores } };
  if (score > prev) next.bestScores[topic] = score;
  return next;
}

export function addXp(profile: Profile, delta: number): Profile {
  return { ...profile, totalXp: Math.max(0, profile.totalXp + delta) };
}

export function incrementRound(profile: Profile): Profile {
  return { ...profile, roundsPlayed: profile.roundsPlayed + 1 };
}

export function recordTopicPlayed(profile: Profile, topic: TopicId): Profile {
  if (profile.topicsPlayed.includes(topic)) return profile;
  return { ...profile, topicsPlayed: [...profile.topicsPlayed, topic] };
}
