import type { TopicId, TopicMeta } from "./types";

export const TOPICS: TopicMeta[] = [
  {
    id: "linear",
    title: "一次関数クエスト",
    subtitle: "傾き・切片・グラフの読み取り",
    emoji: "📈",
    accent: "#38bdf8",
  },
  {
    id: "geometry",
    title: "図形ダンジョン",
    subtitle: "平行線・三角形・四角形の性質",
    emoji: "△",
    accent: "#a78bfa",
  },
  {
    id: "probability",
    title: "確率アリーナ",
    subtitle: "さいころ・硬貨・数え上げ",
    emoji: "🎲",
    accent: "#f472b6",
  },
  {
    id: "algebra",
    title: "式のタワー",
    subtitle: "展開・代入・文字式の計算",
    emoji: "✨",
    accent: "#4ade80",
  },
  {
    id: "mix",
    title: "オールジャンル・ラッシュ",
    subtitle: "4単元まぜこぜ・いつ何が出るかお楽しみ",
    emoji: "🎪",
    accent: "#f472b6",
    unlockLevel: 5,
  },
];

export function topicMeta(id: TopicId): TopicMeta {
  const found = TOPICS.find((t) => t.id === id);
  if (!found) throw new Error("unknown topic");
  return found;
}
