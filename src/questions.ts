import type { DifficultyId, Question, StemTopicId, TopicId } from "./types";
import * as D from "./diagramSvgs";
import { mulberry32, pickUnique, shuffle } from "./rng";

function expl(detailed: string, gentler: string): Pick<Question, "explanationDetailed" | "explanationGentler"> {
  return { explanationDetailed: detailed, explanationGentler: gentler };
}

function win(brief: string, diagramSvg?: string): Pick<Question, "explanationOnCorrectBrief"> &
  Partial<Pick<Question, "correctDiagramSvg" | "wrongDiagramSvg">> {
  if (diagramSvg !== undefined) {
    return {
      explanationOnCorrectBrief: brief,
      correctDiagramSvg: diagramSvg,
      wrongDiagramSvg: diagramSvg,
    };
  }
  return { explanationOnCorrectBrief: brief };
}

const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));

function fracString(num: number, den: number): string {
  const g = gcd(num, den);
  const n = num / g;
  const d = den / g;
  if (d === 1) return `${n}`;
  return `${n}/${d}`;
}

function wrongLinearAnswers(correctSlope: number, correctIntercept: number, rng: () => number): string[] {
  const pool = new Set<string>();
  const correctStr = `y=${correctSlope}x${correctIntercept >= 0 ? "+" : ""}${correctIntercept}`;
  while (pool.size < 8) {
    const da = rng() > 0.5 ? 1 : -1;
    const db = rng() > 0.5 ? 1 : -1;
    const a = correctSlope + Math.floor(rng() * 5) * da;
    const b = correctIntercept + Math.floor(rng() * 7) * db;
    if (a === 0) continue;
    const s = `y=${a}x${b >= 0 ? "+" : ""}${b}`;
    if (s !== correctStr) pool.add(s);
  }
  return [...pool];
}

function qLinear(seed: number, difficulty: DifficultyId): Question {
  const rng = mulberry32(seed);
  const mode = Math.floor(rng() * 4);
  const aRange = difficulty === "hard" ? 6 : 4;
  const a = (Math.floor(rng() * aRange) + 1) * (rng() > 0.5 ? 1 : -1);
  const b = Math.floor(rng() * 11) - 5;
  const correct = `y=${a}x${b >= 0 ? "+" : ""}${b}`;

  if (mode === 0) {
    const wrong = shuffle(wrongLinearAnswers(a, b, rng).slice(0, 5), rng);
    const choices = shuffle([correct, ...wrong], rng).slice(0, 4);
    const correctIndex = choices.indexOf(correct);
    return {
      id: `L-${seed}`,
      topic: "linear",
      prompt: `関数 y = ax + b のグラフが点 (0, ${b}) を通り、x が 1 増えると y が ${a} 増える。このとき、この一次関数はどれ？`,
      choices,
      correctIndex: correctIndex >= 0 ? correctIndex : 0,
      hint: "傾き a は「xが1増えたときのyの増え」。切片はグラフがy軸と交わるところ。",
      ...expl(
        `正解は「${correct}」です。グラフが点 (0, ${b}) を通る、ということは「x = 0 のとき y = ${b}」なので、切片（y 切片）は ${b} です。今度は「x が 1 増えると y が ${a} 増える」から、傾き a は ${a}。したがって式は y = ${a}x + (${b}) をきれいに書くと「${correct}」になります。`,
        `かんたんにいうと、「y軸（たての線）との交点の高さ」が ${b}。あと「右に 1 いどうしたら y が ${a} 変わる」が傾き。だから「${correct}」が答えになります。`
      ),
      ...win(
        `当たり！切片 ${b} と傾き ${a} を読めたので、${correct} が唯一の候補になります。さいこうです。`,
        D.svgLinearSlopeAndIntercept(a, b)
      ),
    };
  }

  if (mode === 1) {
    const x = Math.floor(rng() * 9) - 4;
    const y = a * x + b;
    const wrongYs = shuffle(
      [y + 2, y - 3, -a * x + b, a * x - b].map((v) => String(v)),
      rng
    );
    const choices = shuffle([String(y), ...wrongYs], rng).slice(0, 4);
    const correctIndex = choices.indexOf(String(y));
    return {
      id: `L-${seed}`,
      topic: "linear",
      prompt: `一次関数 y = ${a}x ${b >= 0 ? "+" : ""} ${b} について、x = ${x} のときの y の値は？`,
      choices,
      correctIndex: correctIndex >= 0 ? correctIndex : 0,
      hint: "y に x の値を代入して計算しよう。",
      ...expl(
        `正解は「${y}」です。式 y = ${a}x ${b >= 0 ? "+ " + b : "− " + Math.abs(b)} に、x = ${x} を代入します。計算は y = ${a}×(${x}) ${b >= 0 ? "+ " + b : "− " + Math.abs(b)} = ${a * x} ${b >= 0 ? "+ " + b : "− " + Math.abs(b)} = ${y} です。`,
        `「x のところ」に ${x} を入れて、${a} と ${x} をかけて、あと ${b >= 0 ? "+ " + b : "− " + Math.abs(b)} するだけ。答えは ${y} です。`
      ),
      ...win(
        `当たり！x = ${x} を代入して y = ${y}。ルールどおりの計算です。`,
        D.svgPlugX(x)
      ),
    };
  }

  if (mode === 2) {
    const x1 = Math.floor(rng() * 5) - 2;
    let x2 = Math.floor(rng() * 5) - 2;
    while (x2 === x1) x2 = Math.floor(rng() * 5) - 2;
    const y1 = a * x1 + b;
    const y2 = a * x2 + b;
    const wrong = shuffle(
      wrongLinearAnswers(a + 1, b, rng).concat(wrongLinearAnswers(a - 1, b + 2, rng)).slice(0, 8),
      rng
    );
    const choices = shuffle([correct, ...wrong], rng).slice(0, 4);
    const correctIndex = choices.indexOf(correct);
    return {
      id: `L-${seed}`,
      topic: "linear",
      prompt: `グラフが点 (${x1}, ${y1}) と (${x2}, ${y2}) を通る一次関数はどれ？`,
      choices,
      correctIndex: correctIndex >= 0 ? correctIndex : 0,
      hint: "まず傾き a = (yの増え) ÷ (xの増え) を求める。切片は代入で。",
      ...expl(
        `正解は「${correct}」です。傾き a は「x の増え」に対する「y の増え」なので、a = (${y2} − ${y1}) ÷ (${x2} − ${x1}) = ${a}。あとはどちらかの点を式 y = ${a}x + b に代入して b を求めます（例：(${x1}, ${y1}) を使うと ${y1} = ${a}×${x1} + b から b = ${b}）。整理すると「${correct}」です。`,
        `まず「右にいくつ進んだら、上にいくつ進んだ？」を割り算して傾きを出す。次に「点を式に入れて、足りない数 b を探す」。最後に「${correct}」の形にします。`
      ),
      ...win(
        `当たり！2点から傾き → 代入で切片、までいけています。そのままグラフとも一致です。`,
        D.svgTwoPointsOnLine()
      ),
    };
  }

  const wrong = shuffle(
    [
      "xが大きくなると y も必ず大きくなる",
      "グラフは必ず原点を通る",
      "傾きが負なら右に行くほどグラフは上がる",
      "切片は x 軸との交点の x 座標",
    ],
    rng
  );
  const correctText = "傾き a は、x が 1 増えたときの y の増えとして定義できる";
  const choices = shuffle([correctText, ...wrong], rng).slice(0, 4);
  return {
    id: `L-${seed}`,
    topic: "linear",
    prompt: `次の説明で正しいものはどれ？（一次関数 y = ax + b）`,
    choices,
    correctIndex: choices.indexOf(correctText),
    hint: "傾きと切片を言葉で整理してみよう。",
    ...expl(
      `正解は「${correctText}」です。傾き a は、グラフの「なだらかさ」を数で表したもので、x が 1 増えたぶんだけ y がどれだけ変わるか、と定義できます。a が正なら右に行くほど y は増え、a が負なら右に行くほど y は減りますが、「必ず増える」とは限りません。切片は y 軸との交点の y 座標で、原点を通るとも限りません。`,
      `傾き＝「x を 1 つ右に進めたときの y の変化」で覚えるとラク。だから「${correctText}」が正しい説明です。`
    ),
    ...win(
      `大正解です！説明文の問題でも「傾き＝増え」がたんとうをしてくれます。`,
      D.svgSlopeDefinition()
    ),
  };
}

function qGeometry(seed: number, difficulty: DifficultyId): Question {
  const rng = mulberry32(seed + 901);
  const mode = Math.floor(rng() * 5);

  if (mode === 0) {
    const vertex = [40, 50, 60, 70, 80][Math.floor(rng() * 5)]!;
    const base = (180 - vertex) / 2;
    const wrong = shuffle([90 - base, base + vertex, 180 - vertex], rng).map((x) => `${x}°`);
    const correct = `${base}°`;
    const choices = shuffle([correct, ...wrong], rng).slice(0, 4);
    return {
      id: `G-${seed}`,
      topic: "geometry",
      prompt: `二等辺三角形で、頂角が ${vertex}° のとき、底角の大きさは？`,
      choices,
      correctIndex: choices.indexOf(correct),
      hint: "三角形の内角の和は 180°。二等辺三角形は底角が等しい。",
      ...expl(
        `正解は「${correct}」です。二等辺三角形は底角が等しいので、底角を α° とおくと頂角と合わせて ${vertex}° + α° + α° = 180°。つまり 2α = 180 − ${vertex} = ${180 - vertex} なので α = ${base} です。`,
        `三角形の内角の和は 180°。残り ${180 - vertex}° を「下のふたつの同じ角」で分け合うので、半分の ${base}° が答えです。`
      ),
      ...win(
        `当たり！${vertex}°の分をふたつの底角で半分こにできています。`,
        D.svgIsosceles(vertex, base)
      ),
    };
  }

  if (mode === 1) {
    const a = Math.floor(rng() * 25) + 45;
    const b = Math.floor(rng() * 25) + 45;
    const c = 180 - a - b;
    const pool = [`${a}°`, `${b}°`, `${c}°`, `${180 - c}°`];
    const choices = shuffle([...new Set(pool)], rng).slice(0, 4);
    const correct = `${c}°`;
    return {
      id: `G-${seed}`,
      topic: "geometry",
      prompt: `三角形の 2 つの内角が ${a}° と ${b}° のとき、残りの内角は？`,
      choices,
      correctIndex: Math.max(0, choices.indexOf(correct)),
      hint: "内角の和は 180°。",
      ...expl(
        `正解は「${correct}」です。三角形の内角の和は 180°。残りの角は 180° − ${a}° − ${b}° = ${180 - a - b}° です。`,
        `3つの角を足すと 180°。「すでに出ているふたつ」を引けば、あとの 1 つは ${correct} です。`
      ),
      ...win(
        `当たり！${a}+${b}+(${c})=180° とかみ合わせできましたね。`,
        D.svgTriangleAngles(a, b, c)
      ),
    };
  }

  if (mode === 2) {
    const n = difficulty === "hard" ? 8 : 6;
    const interior = (n - 2) * 180;
    const wrong = [(n - 1) * 180, n * 180, interior - 180, interior + 360].map(String);
    const correct = String(interior);
    const choices = shuffle([correct, ...pickUnique(wrong, 4, rng)], rng).slice(0, 4);
    return {
      id: `G-${seed}`,
      topic: "geometry",
      prompt: `${n} 角形の内角の和は？（公式：内角の和 = (n − 2) × 180°）`,
      choices,
      correctIndex: choices.indexOf(correct),
      hint: "(n − 2) に 180° をかけるだけ。",
      ...expl(
        `正解は「${correct}」です。n 角形の内角の和は (${n} − 2) × 180° = ${n - 2} × 180° = ${interior}° と計算できます。`,
        `覚え方：三角形（3角形）では内角の和は 180°。へんが 1 本増えるごとに 180° ずつ足すイメージで (${n} − 2) × 180°。計算すると ${interior}°（選択肢では「${correct}」などの形になっています）。`
      ),
      ...win(
        `当たり！(${n}−2)×180° の公式をもくてきとに使えています。`,
        D.svgPolygonSlices(n)
      ),
    };
  }

  if (mode === 3) {
    const prompts = [
      {
        q: "平行四辺形の向かい合う辺どうしの関係として正しいものは？",
        ok: "長さが等しく、互いに平行",
        bad: ["長さは違うが必ず垂直", "対角線は必ず垂直に交わる", "すべての角が等しい"],
      },
      {
        q: "長方形の性質として必ず成り立つものは？",
        ok: "4つの角はすべて 90°",
        bad: ["隣り合う辺は必ず等しい", "対角線は垂直に交わる", "4辺の長さはすべて等しい"],
      },
      {
        q: "ひし形（菱形）について正しいものは？",
        ok: "4辺の長さはすべて等しい",
        bad: ["必ず長方形でもある", "対角線の長さは等しい", "平行四辺形ではない"],
      },
    ];
    const p = prompts[Math.floor(rng() * prompts.length)]!;
    const choices = shuffle([p.ok, ...p.bad], rng).slice(0, 4);
    const geoExpl =
      p.ok === "長さが等しく、互いに平行"
        ? expl(
            `正解は「${p.ok}」です。平行四辺形の定義は「向かい合う辺がそれぞれ平行である四角形」。その性質として、向かい合う辺の長さも等しくなります。`,
            `平行四辺形は「向かい合う辺は平行」が基本。あわせて「長さも同じ」になります（これもよく使う性質です）。`
          )
        : p.ok === "4つの角はすべて 90°"
          ? expl(
              `正解は「${p.ok}」です。長方形は「4つの角がすべて直角」の四角形、と定義できます。すべての長方形が正方形になるわけではないので「隣り合う辺が等しい」は必ずしも成り立ちません。`,
              `長方形は「角が正方形みたいにまっすぐ（90°）」が一番の特ちょう。それがすべての長方形には言えます。`
            )
          : expl(
              `正解は「${p.ok}」です。ひし形は「4辺の長さがすべて等しい」平行四辺形です（定義により平行四辺形でもあります）。`,
              `ひし形＝かたまりのひし形。4本のへんが同じ長さ、と覚えると強いです。`
            );
    return {
      id: `G-${seed}`,
      topic: "geometry",
      prompt: p.q,
      choices,
      correctIndex: choices.indexOf(p.ok),
      hint: "定義と性質を区別しよう。",
      ...geoExpl,
      ...win(
        `当たり！「${p.ok}」がこの図形のおきまりとぴったり一致です。`,
        D.svgShapeFacts()
      ),
    };
  }

  const t = Math.floor(rng() * 35) + 35;
  const corr = 180 - t;
  const wrong = shuffle([t, 90 - t / 2, 2 * t, corr + 30], rng)
    .filter((x) => Math.abs(x - corr) > 0.01)
    .slice(0, 3)
    .map((x) => `${Math.round(x)}°`);
  const correct = `${corr}°`;
  const choices = shuffle([correct, ...wrong], rng).slice(0, 4);
  return {
    id: `G-${seed}`,
    topic: "geometry",
    prompt: `2 本の平行線を一直線が横切る。同側の内角の一方が ${t}° のとき、もう一方の同側の内角は？`,
    choices,
    correctIndex: choices.indexOf(correct),
    hint: "同側の内角は、たしざんで 180° になる組み合わせ。",
    ...expl(
      `正解は「${correct}」です。平行線には「同側の内角」（同じ側にある内側の角）があって、このふたつは足すと 180° になります（補角の関係）。一方が ${t}° なので、もう一方は 180 − ${t} = ${corr}° です。`,
      `同じ側のなかの角は、「ふたつをたすと 180°」のペアです。だから「180 − ${t}」=${corr}° です。錯角（さっかく）や同位角とはちがう関係だよ、とだけ区別しましょう。`
    ),
    ...win(
      `当たり！同側の内角は足して 180°。${corr}° でしたね。`,
      D.svgParallelSameSide(t)
    ),
  };
}

function twoCoinHeadsCount(headsWanted: number): { favorable: number; total: number } {
  const total = 4;
  if (headsWanted === 0 || headsWanted === 2) return { favorable: 1, total };
  return { favorable: 2, total };
}

function threeCoinHeadsCount(headsWanted: number): { favorable: number; total: number } {
  const comb = [1, 3, 3, 1];
  return { favorable: comb[headsWanted] ?? 0, total: 8 };
}

function qProbability(seed: number, difficulty: DifficultyId): Question {
  const rng = mulberry32(seed + 3301);
  const mode = Math.floor(rng() * 4);

  if (mode === 0) {
    const total = 6;
    const favorable = Math.floor(rng() * 3) + 1;
    const correct = fracString(favorable, total);
    const wrong = shuffle(
      [
        fracString(favorable, 36),
        fracString(favorable + 1, total),
        fracString(1, favorable),
        `${favorable}/${total + 1}`,
      ],
      rng
    );
    const choices = shuffle([correct, ...wrong], rng).slice(0, 4);
    const nums = Array.from({ length: favorable }, (_, i) => i + 1).join(" か ");
    return {
      id: `P-${seed}`,
      topic: "probability",
      prompt: `1 個のさいころを投げる。出る目が ${nums} である確率は？（既約分数で）`,
      choices,
      correctIndex: choices.indexOf(correct),
      hint: "場合の数を「すべて」と「ほしい」とに分ける。約分も忘れずに。",
      ...expl(
        `正解は「${correct}」です。出る目は全部で 6 通り（全部すこし同じくらい起こる、と考えます）。そのうち「${nums}」に入る目は ${favorable} 通り。よって確率は ${favorable}/6。分子と分母の最大公約数で約分すると「${correct}」になります。`,
        `さいころは 1〜6 の 6 パターン。そのうちほしい目が ${favorable} 個なので「${favorable} わり 6」。約分して「${correct}」。`
      ),
      ...win(
        `当たり！ほしい目 ${favorable}/6 → 約分「${correct}」。数の整い方が見事です。`,
        D.svgSingleDieHighlighted(favorable)
      ),
    };
  }

  if (mode === 1) {
    const coins = difficulty === "hard" ? 3 : 2;
    const wantHeads =
      coins === 2 ? Math.floor(rng() * 3) : Math.floor(rng() * 4);
    const { favorable, total } =
      coins === 2 ? twoCoinHeadsCount(wantHeads) : threeCoinHeadsCount(wantHeads);
    const correct = fracString(favorable, total);
    const text =
      coins === 2
        ? `公平な硬貨を 2 枚投げて、表がちょうど ${wantHeads} 枚出る確率は？`
        : `公平な硬貨を 3 枚投げて、表がちょうど ${wantHeads} 枚出る確率は？`;
    const choices = shuffle(
      [correct, fracString(favorable + 1, total), fracString(favorable, Math.max(total, 12)), fracString(1, 8)],
      rng
    ).slice(0, 4);
    return {
      id: `P-${seed}`,
      topic: "probability",
      prompt: `${text}（既約分数で）`,
      choices,
      correctIndex: choices.indexOf(correct),
      hint: "樹形図ですべての出方を書き出すと安心。",
      ...expl(
        `正解は「${correct}」です。${coins === 2 ? "2枚" : "3枚"}なら、表裏の組み合わせは全部で ${total} 通りあります（きちんと数えると ${total}）。そのうち「表がちょうど ${wantHeads} 枚」になるのは ${favorable} 通り。よって ${favorable}/${total} を約分すると「${correct}」です。`,
        `「全部の出方」を数えて、「ほしい出方」で割る。ここでは ${favorable} パターン ÷ ${total} パターン → 約分して「${correct}」。`
      ),
      ...win(
        `やったね！${coins === 2 ? "4" : "8"} とおりのうち ${favorable}/${total}→「${correct}」。`,
        D.svgCoinsRow(coins)
      ),
    };
  }

  if (mode === 2) {
    const bag = difficulty === "hard" ? 7 : 5;
    const red = Math.floor(rng() * (bag - 2)) + 1;
    const white = bag - red;
    const correct = fracString(red, bag);
    const choices = shuffle(
      [correct, fracString(red, bag + 2), fracString(white, bag), fracString(1, bag)],
      rng
    ).slice(0, 4);
    return {
      id: `P-${seed}`,
      topic: "probability",
      prompt: `袋に赤玉が ${red} 個、白玉が ${white} 個ある。よく混ぜて 1 個取ると、赤玉が出る確率は？（既約分数で）`,
      choices,
      correctIndex: choices.indexOf(correct),
      hint: "全体の個数で割る。必要なら約分。",
      ...expl(
        `正解は「${correct}」です。玉は全部で ${red + white} 個。そのうち赤は ${red} 個。よって確率は ${red}/${red + white}。約分すると「${correct}」です。`,
        `「赤の数 ÷ ぜんぶの数」で OK。${red} ÷ ${bag} を分数で書いて、ちぢめる（約分）と「${correct}」。`
      ),
      ...win(
        `当たり！袋の中の「赤の割合」がそのまま「${correct}」に。`,
        D.svgBag(red, white)
      ),
    };
  }

  const sumWays = (s: number): number => {
    if (s < 2 || s > 12) return 0;
    let c = 0;
    for (let i = 1; i <= 6; i++) {
      const j = s - i;
      if (j >= 1 && j <= 6) c++;
    }
    return c;
  };
  const sums = [7, 8, 9, 10][Math.floor(rng() * 4)]!;
  const actual = sumWays(sums);
  const correct = fracString(actual, 36);
  const choices = shuffle(
    [correct, fracString(actual + 1, 36), fracString(actual, 72), fracString(1, 6)],
    rng
  ).slice(0, 4);
  return {
    id: `P-${seed}`,
    topic: "probability",
    prompt: `2 個のさいころの目の和が ${sums} になる確率は？（既約分数で）`,
    choices,
    correctIndex: choices.indexOf(correct),
    hint: "36 通りの表か、数え上げで。",
    ...expl(
      `正解は「${correct}」です。2 個のさいころは合わせて 6×6＝36 通りが同じくらいの確率で起こる、と考えます。和が ${sums} になる出方を数えると ${actual} 通りです。確率は ${actual}/36。約分して「${correct}」です（表や樹形図で確認するのもおすすめです）。`,
      `ぜんぶ 36 のパターン。${sums} になる並びが ${actual} 個だったら ${actual}/36。約分「${correct}」。`
    ),
    ...win(
      `当たり！和 ${sums} は ${actual}/36 →「${correct}」。表で数えても同じです。`,
      D.svgTwoDiceGrid()
    ),
  };
}

function normalizePoly(p: number, q: number): string {
  const b = p + q;
  const c = p * q;
  return polyToString(1, b, c);
}

function perturbPoly(p: number, q: number, rng: () => number): string {
  const kind = rng();
  const b = p + q + (kind < 0.33 ? 1 : kind < 0.66 ? -1 : 2);
  const c = p * q + (rng() > 0.5 ? 1 : -1);
  return polyToString(1, b, c);
}

function polyToString(_a: number, b: number, c: number): string {
  let s = "x²";
  if (b !== 0) s += b > 0 ? `+${b}x` : `${b}x`;
  if (c !== 0) s += c > 0 ? `+${c}` : `${c}`;
  return simplifyExpStr(s);
}

function simplifyExpStr(s: string): string {
  return s.replace(/\+-/g, "-").replace(/^x²\+0x/, "x²").replace(/\+0$/, "");
}

function expandMinusProduct(m: number, n: number): string {
  const bCoef = m + n;
  const cCoef = -m * n;
  let s = "-x²";
  if (bCoef !== 0) s += bCoef > 0 ? `+${bCoef}x` : `${bCoef}x`;
  if (cCoef !== 0) s += cCoef > 0 ? `+${cCoef}` : `${cCoef}`;
  return simplifyExpStr(s);
}

function qAlgebra(seed: number, difficulty: DifficultyId): Question {
  const rng = mulberry32(seed + 777);
  const mode = Math.floor(rng() * 4);

  if (mode === 0) {
    const p = Math.floor(rng() * 6) - 3;
    const q = Math.floor(rng() * 6) - 3;
    if (p === q) return qAlgebra(seed + 99, difficulty);
    const correct = normalizePoly(p, q);
    const distractors = [
      perturbPoly(p, q, rng),
      perturbPoly(q, p, rng),
      perturbPoly(p + 1, q - 1, rng),
    ];
    const choices = shuffle([correct, ...shuffle(distractors, rng)], rng).slice(0, 4);
    let correctIndex = choices.indexOf(correct);
    if (correctIndex < 0) correctIndex = 0;
    return {
      id: `A-${seed}`,
      topic: "algebra",
      prompt: `(x ${p >= 0 ? "+ " + p : "− " + Math.abs(p)})(x ${q >= 0 ? "+ " + q : "− " + Math.abs(q)}) を展開すると、次のどれになる？※ x の 2 乗は x² と表記`,
      choices,
      correctIndex,
      hint: "FOIL（先頭・外・内・末）または分配法則で。",
      ...expl(
        `正解は「${correct}」です。(x+P)(x+Q) は展開すると x² + (P+Q)x + PQ、とおさえられることが多いです。この問題では P=${p}, Q=${q} です（符号もこみでかっこの中の値）。よって一次の係数は ${p + q}、定数項は ${p * q}。まとめると「${correct}」。`,
        `「ふたつのかけ算」をゆっくりひろげて、同じ種類（x²、x、数）でまとめます。(x+P)(x+Q) でいうと、x をふたつかけて x²、あとは x がつくものをたして、つぎに数だけ。ここまでくると「${correct}」。`
      ),
      ...win(
        `当たり！4タイルのたたみかけみたいに、${correct} になりました。`,
        D.svgExpandBoxes()
      ),
    };
  }

  if (mode === 1) {
    const a = Math.floor(rng() * 5) + 2;
    const b = Math.floor(rng() * 7) + 2;
    const k = difficulty === "hard" ? Math.floor(rng() * 5) + 2 : Math.floor(rng() * 3) + 2;
    const correctNum = k * (a + b);
    const correct = String(correctNum);
    const choices = shuffle(
      [correct, String(k * a + b), String(k + a + b), String(k * Math.abs(a - b))],
      rng
    ).slice(0, 4);
    return {
      id: `A-${seed}`,
      topic: "algebra",
      prompt: `${k}(x + ${a}) を展開してから x = ${b} を代入すると、値はいくつ？`,
      choices,
      correctIndex: choices.indexOf(correct),
      hint: "分配法則 → 代入の順がラク。",
      ...expl(
        `正解は「${correct}」です。まず分配法則で ${k}(x + ${a}) = ${k}x + ${k * a}。ここへ x=${b} を代入すると ${k}×${b} + ${k * a} = ${k * b + k * a} の計算。くくると ${k}(${b} + ${a}) = ${k}×(${a + b}) = ${correctNum} で、代入と展開どちらの順でも答えは同じです。`,
        `いったんかっこはかけ算の分配で広げて「${k}×x と ${k}×${a}」。あとから x に ${b} を入れる。結果は「${correct}」。`
      ),
      ...win(`当たり！${correct} と一致。広げ→代入ルートばっちりです。`, D.svgKxPlusA()),
    };
  }

  if (mode === 2) {
    const m = Math.floor(rng() * 8) + 2;
    const n = Math.floor(rng() * 8) + 2;
    const simp = expandMinusProduct(m, n);
    const choices = shuffle(
      [
        simp,
        simplifyExpStr(`-x²+${m + n}x+${m * n}`),
        simplifyExpStr(`x²+${-m + n}x+${-m * n}`),
        simplifyExpStr(`-x²+${m * n}x+1`),
      ],
      rng
    ).slice(0, 4);
    const correctIndex = choices.indexOf(simp);
    return {
      id: `A-${seed}`,
      topic: "algebra",
      prompt: `(x − ${m})(−x + ${n}) を展開すると、次のどれになる？`,
      choices,
      correctIndex: correctIndex >= 0 ? correctIndex : 0,
      hint: "分配法則。符号に注意！",
      ...expl(
        `正解は「${simp}」です。順に広げます。まず「x×(−x)」が −x²。「x×${n}」が ${n >= 0 ? "+" + n + "x" : n + "x"}、(−${m})×(−x) が +${m}x、(−${m})×(${n}) が ${-m * n >= 0 ? "+" + -m * n : -m * n}。x の係数は ${n + m}、定数項は ${-m * n}。まとめると「${simp}」。`,
        `マイナスが多いときは、いったん「前から順に」かけて、あとで x²・x・数に分けてたす。最後に「${simp}」。`
      ),
      ...win(`さいこうです！複雑な符号でも「${simp}」。`, D.svgSignShuffle()),
    };
  }

  const x = Math.floor(rng() * 5) + 1;
  const expr = difficulty === "hard" ? "x² − 4x + 3" : "x² + 3x + 2";
  const val = difficulty === "hard" ? x * x - 4 * x + 3 : x * x + 3 * x + 2;
  const correct = String(val);
  const choices = shuffle(
    [correct, String(val + 1), String(val - 2), String(x * x + x)],
    rng
  ).slice(0, 4);
  const explain =
    difficulty === "hard"
      ? expl(
          `正解は「${correct}」です。代入すると (${x})² − 4×(${x}) + 3 = ${x * x} − ${4 * x} + 3。これを順に計算すると ${correct}です。`,
          `かっこにある x に ${x} を入れる。それぞれの項をほどいたあとに、たしたりひいたりすると「${correct}」。`
        )
      : expl(
          `正解は「${correct}」です。代入すると (${x})² + 3×(${x}) + 2 = ${x * x} + ${3 * x} + 2 = ${correct}です。`,
          `x のところに ${x} を入れて、かけて・たしていく。こたえは「${correct}」。`
        );
  return {
    id: `A-${seed}`,
    topic: "algebra",
    prompt: `x = ${x} のとき、${expr} の値は？`,
    choices,
    correctIndex: choices.indexOf(correct),
    hint: "代入して丁寧に計算しよう。",
    ...explain,
    ...win(`当たり！代入まわりの計算そのままで ${correct}。`, D.svgPlugX(x)),
  };
}

const STEM_TOPICS: StemTopicId[] = ["linear", "geometry", "probability", "algebra"];

function stemQuestion(seed: number, stem: StemTopicId, difficulty: DifficultyId): Question {
  if (stem === "linear") return qLinear(seed, difficulty);
  if (stem === "geometry") return qGeometry(seed, difficulty);
  if (stem === "probability") return qProbability(seed, difficulty);
  return qAlgebra(seed, difficulty);
}

export function buildQuestionDeck(topic: TopicId, difficulty: DifficultyId, count: number, baseSeed: number): Question[] {
  if (topic === "mix") {
    const rng = mulberry32((baseSeed ^ 0x4d4958) >>> 0);
    const out: Question[] = [];
    for (let i = 0; i < count; i++) {
      const stem = STEM_TOPICS[Math.floor(rng() * STEM_TOPICS.length)]!;
      const seed = baseSeed * 1000 + i * 31 + stem.length * 17;
      out.push(stemQuestion(seed, stem, difficulty));
    }
    return out;
  }
  const out: Question[] = [];
  const stem = topic as StemTopicId;
  for (let i = 0; i < count; i++) {
    const seed = baseSeed * 1000 + i * 17 + topic.length * 3;
    out.push(stemQuestion(seed, stem, difficulty));
  }
  return out;
}
