import type { TopicId } from "./types";

/** 中学校（本アプリは中2範囲）の学期区分 */
export type SemesterId = 1 | 2 | 3;

export interface CurriculumUnit {
  id: string;
  title: string;
  summary: string;
  emoji: string;
  accent: string;
  /**
   * メインの自動出題ステージ。null の単元は教科書単元として掲載し、
   * 近いステージ（relatedTopic）で土台練習できる旨を表示する。
   */
  playTopic: TopicId | null;
  /** playTopic が null のときの提案ステージ */
  relatedTopic?: TopicId;
  /** 関連ステージボタンの補足 */
  relatedHint?: string;
}

export interface CurriculumGenre {
  id: string;
  label: string;
  emoji: string;
  accent: string;
  units: CurriculumUnit[];
}

export interface SemesterPlan {
  id: SemesterId;
  title: string;
  ribbon: string;
  periodHint: string;
  lead: string;
  genres: CurriculumGenre[];
}

/**
 * 公立中学校・中2 の典型的な進度イメージで学期・領域を整理。
 * （自治体・教科書で前後しますが、「学期ごとに何を学ぶか」の地図として網羅）
 */
export const SEMESTER_PLANS: SemesterPlan[] = [
  {
    id: 1,
    title: "1学期",
    ribbon: "基礎を固める",
    periodHint: "おおむね 4〜7月",
    lead:
      "文字の計算から連立方程式まで。テストで差がつきやすい「式の筋トレ」を中心に、チャレンジで反射をつくりましょう。",
    genres: [
      {
        id: "s1-numbers-expr",
        label: "数と式",
        emoji: "🔢",
        accent: "#4ade80",
        units: [
          {
            id: "s1-poly",
            title: "単項式・多項式と次数",
            summary: "項・係数・次数を整理し、式の形を見て読めるようにする。",
            emoji: "📝",
            accent: "#4ade80",
            playTopic: "algebra",
          },
          {
            id: "s1-add-sub",
            title: "文字式の加法・減法",
            summary: "かっこの外し・類項どうしをまとめる手順をならす。",
            emoji: "➕",
            accent: "#34d399",
            playTopic: "algebra",
          },
          {
            id: "s1-mul-div",
            title: "文字式の乗法・除法",
            summary: "指数法則や単項式×多項式の型をはやく処理できるように。",
            emoji: "✖️",
            accent: "#22c55e",
            playTopic: "algebra",
          },
          {
            id: "s1-expand",
            title: "展開（分配法則・公式の入口）",
            summary: "符号に強くなる展開の基本。テストの巾着問題が楽になります。",
            emoji: "📦",
            accent: "#86efac",
            playTopic: "algebra",
          },
          {
            id: "s1-subst",
            title: "式の値・代入と計算順序",
            summary: "代入して値を求める・式を評価するまわりを安定させる。",
            emoji: "🎯",
            accent: "#bbf7d0",
            playTopic: "algebra",
          },
        ],
      },
      {
        id: "s1-equations",
        label: "方程式・連立方程式",
        emoji: "⚖️",
        accent: "#38bdf8",
        units: [
          {
            id: "s1-linear-review",
            title: "一元一次方程式の復習",
            summary: "移項・両辺同じ操作・分数や小数の方程式までの土台。",
            emoji: "🪜",
            accent: "#38bdf8",
            playTopic: null,
            relatedTopic: "algebra",
            relatedHint: "いまは「式の計算・代入」のステージで計算筋を鍛えられます。",
          },
          {
            id: "s1-system-sub-add",
            title: "連立方程式（代入法・加減法）",
            summary: "二元を同時に満たす解を求める手順をはやく・確実に。",
            emoji: "🔗",
            accent: "#7dd3fc",
            playTopic: null,
            relatedTopic: "algebra",
            relatedHint: "専用セットは準備中ですが、符号と代入の安定がそのまま武器になります。",
          },
          {
            id: "s1-system-word",
            title: "連立方程式の文章題",
            summary: "速さ・割合・代金など、式に翻訳してから解く練習。",
            emoji: "📚",
            accent: "#bae6fd",
            playTopic: null,
            relatedTopic: "algebra",
            relatedHint: "文章題は「式にする」練習と計算練習のセットで伸びます。",
          },
        ],
      },
      {
        id: "s1-data-prep",
        label: "データの活用（見通し）",
        emoji: "📊",
        accent: "#f472b6",
        units: [
          {
            id: "s1-data-review",
            title: "資料の読み取り・ひろがり",
            summary: "グラフや表から傾向を言葉にする（後の関数・確率の入口）。",
            emoji: "📈",
            accent: "#f472b6",
            playTopic: null,
            relatedTopic: "probability",
            relatedHint: "「場合を整理する」感覚は確率チャレンジで先取りできます。",
          },
        ],
      },
    ],
  },
  {
    id: 2,
    title: "2学期",
    ribbon: "グラフと図形・確率",
    periodHint: "おおむね 9〜12月",
    lead:
      "一次関数でグラフと式をつなぐ感覚を育て、図形の性質と確率で応用力を伸ばす学期です。",
    genres: [
      {
        id: "s2-functions",
        label: "関数",
        emoji: "📈",
        accent: "#38bdf8",
        units: [
          {
            id: "s2-linear-rate",
            title: "変化の割合・比例・反比例の復習",
            summary: "一次関数に入る前の変化の見方をおさらい。",
            emoji: "🔄",
            accent: "#38bdf8",
            playTopic: "linear",
          },
          {
            id: "s2-linear-form",
            title: "一次関数 y = ax + b",
            summary: "傾きと切片、グラフと式の往復ができるようにする。",
            emoji: "📐",
            accent: "#7dd3fc",
            playTopic: "linear",
          },
          {
            id: "s2-linear-graph-read",
            title: "グラフの読み取り・ドメインの感覚",
            summary: "増減・座標読み・実現象との対応づけをする。",
            emoji: "🔍",
            accent: "#bae6fd",
            playTopic: "linear",
          },
        ],
      },
      {
        id: "s2-geometry",
        label: "図形",
        emoji: "△",
        accent: "#a78bfa",
        units: [
          {
            id: "s2-parallel-angles",
            title: "平行線と角（錯角・同位角）",
            summary: "平行線のせっつく条件と角の相等を素早く見つける。",
            emoji: "📏",
            accent: "#a78bfa",
            playTopic: "geometry",
          },
          {
            id: "s2-polygons",
            title: "三角形・多角形の性質",
            summary: "内角・外角・合同・二等辺・中正三角形などを整理。",
            emoji: "🔺",
            accent: "#c4b5fd",
            playTopic: "geometry",
          },
          {
            id: "s2-quads",
            title: "平行四辺形から特殊な四角形へ",
            summary: "特徴と判定を見分ける・ヒントから形を決める。",
            emoji: "🟪",
            accent: "#ddd6fe",
            playTopic: "geometry",
          },
          {
            id: "s2-circle-sector",
            title: "円・おうぎ形・弧の長さ・おうぎの面積",
            summary: "中心角と半径から長さ・面積へつなぐ単元。",
            emoji: "⭕",
            accent: "#8b5cf6",
            playTopic: null,
            relatedTopic: "geometry",
            relatedHint: "角や図形の性質クイズで「角度まわり」の土台を固められます。",
          },
        ],
      },
      {
        id: "s2-data",
        label: "データの活用",
        emoji: "🎲",
        accent: "#f472b6",
        units: [
          {
            id: "s2-prob-basic",
            title: "確率の考え（試行・事象・場合の数）",
            summary: "樹形図・表で漏れなく数える基本。",
            emoji: "🌿",
            accent: "#f472b6",
            playTopic: "probability",
          },
          {
            id: "s2-prob-dice-coin",
            title: "サイコロ・コイン・順列組合せの入口",
            summary: "対称性・「同じものの並べ替え」に慣れる。",
            emoji: "🪙",
            accent: "#fb7185",
            playTopic: "probability",
          },
        ],
      },
    ],
  },
  {
    id: 3,
    title: "3学期",
    ribbon: "応用・証明・総仕上げ",
    periodHint: "おおむね 1〜3月",
    lead:
      "証明・空間図形・関数の活用など発展に触れつつ、これまでの総復習で実力を確かめる学期です。",
    genres: [
      {
        id: "s3-geometry",
        label: "図形",
        emoji: "✍️",
        accent: "#a78bfa",
        units: [
          {
            id: "s3-proof-prep",
            title: "論証の準備（言い換え・根拠の書き方）",
            summary: "なぜそう言えるかを短く筋道立てる練習。",
            emoji: "📖",
            accent: "#a78bfa",
            playTopic: "geometry",
          },
          {
            id: "s3-proof-triangle",
            title: "三角形・四角形の証明",
            summary: "合同や平行・垂直を示す定型パターンを身につける。",
            emoji: "🏛️",
            accent: "#c4b5fd",
            playTopic: null,
            relatedTopic: "geometry",
            relatedHint: "性質クイズで「なぜそうなるか」の素材をたくさん触れます。",
          },
          {
            id: "s3-solid",
            title: "空間図形（柱・錐・球・切断）",
            summary: "見取り図・展開図・体積・表面積のイメージをつなぐ。",
            emoji: "🧊",
            accent: "#8b5cf6",
            playTopic: null,
            relatedTopic: "geometry",
            relatedHint: "平面図形の角や長さの感覚がそのまま立体にも効きます。",
          },
        ],
      },
      {
        id: "s3-functions",
        label: "関数",
        emoji: "📈",
        accent: "#38bdf8",
        units: [
          {
            id: "s3-linear-apps",
            title: "一次関数の活用・グラフ読み（総合）",
            summary: "交点・変域・文章題グラフなど定期テスト後半に効くまとめ。",
            emoji: "🚀",
            accent: "#38bdf8",
            playTopic: "linear",
          },
        ],
      },
      {
        id: "s3-numbers-expr",
        label: "数と式",
        emoji: "🔢",
        accent: "#4ade80",
        units: [
          {
            id: "s3-algebra-review",
            title: "式の計算・恒等式の気持ち（総復習）",
            summary: "展開・代入・符号ミスをゼロに近づける仕上げラップ。",
            emoji: "✨",
            accent: "#4ade80",
            playTopic: "algebra",
          },
        ],
      },
      {
        id: "s3-data",
        label: "データの活用",
        emoji: "🎲",
        accent: "#f472b6",
        units: [
          {
            id: "s3-prob-review",
            title: "確率の総復習・思考力問題",
            summary: "場合分けと前提確認でひっかけに強くなる。",
            emoji: "🎯",
            accent: "#f472b6",
            playTopic: "probability",
          },
        ],
      },
      {
        id: "s3-mixdown",
        label: "総合チャレンジ",
        emoji: "🎪",
        accent: "#fbbf24",
        units: [
          {
            id: "s3-mix-rush",
            title: "オールジャンル・ラッシュ",
            summary: "4ステージからランダム出題。試験まわりの切り替え練習に。",
            emoji: "🎪",
            accent: "#fbbf24",
            playTopic: "mix",
          },
        ],
      },
    ],
  },
];

export function semesterPlan(id: SemesterId): SemesterPlan {
  const p = SEMESTER_PLANS.find((s) => s.id === id);
  if (!p) throw new Error("unknown semester");
  return p;
}
