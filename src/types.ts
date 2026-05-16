export type TopicId = "linear" | "geometry" | "probability" | "algebra" | "mix";

/** mix 親モード以外の、問題が属する単元 */
export type StemTopicId = Exclude<TopicId, "mix">;

export type DifficultyId = "normal" | "hard";

export interface TopicMeta {
  id: TopicId;
  title: string;
  subtitle: string;
  emoji: string;
  accent: string;
  /** 指定レベル未満ならロック（省略＝Lv1から） */
  unlockLevel?: number;
}

export interface Question {
  id: string;
  topic: StemTopicId;
  prompt: string;
  choices: string[];
  correctIndex: number;
  hint?: string;
  /** 不正解直後に見せる、わかりやすい標準フローの解説 */
  explanationDetailed: string;
  /** 「もう少し、やさしく説明してほしい」表示用。ひと段落ずつ \n\n で区切ると読みやすい */
  explanationGentler: string;
  /** 正解直後の「当たり！」向けの短文 */
  explanationOnCorrectBrief: string;
  /** 視覚的な補足（インライン SVG 文字列・任意）。正解のお祝いでも使う */
  correctDiagramSvg?: string;
  /** 不正解解説でも同じコンセプトを図で示す場合（省略時は正解側と同一のとき win() が自動でセット） */
  wrongDiagramSvg?: string;
}

export interface GameState {
  topic: TopicId;
  difficulty: DifficultyId;
  questionIndex: number;
  score: number;
  combo: number;
  maxCombo: number;
  lives: number;
  streakCorrect: number;
}

export interface Profile {
  totalXp: number;
  bestScores: Partial<Record<TopicId, number>>;
  /** 解放済み実績バッジの id */
  unlockedBadges: string[];
  /** ホームへ戻るまでを 1 と数えたプレイ済みラウンド数（XP付与済みのみ） */
  roundsPlayed: number;
  /** 少なくとも1回プレイしたステージ履歴（重複なし） */
  topicsPlayed: TopicId[];
}
