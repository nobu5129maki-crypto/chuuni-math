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
        `まず安心していい問題です。\n\n正解は「${correct}」。\n\n・切片（グラフがたての軸／y軸から読むスタート地点の高さ）\n問題文の「点 (0, ${b}) を通る」は、そのまま「x が 0 のとき y が ${b}」です。これが切片＝ ${b}。\n\n・傾き（右に進んだときはどれだけ上／下へ動くか）\n「x が 1 増えると y が ${a} 増える」が，まさに傾き a = ${a} と読み取れる部分です。\n\n・仕上げ\n一次関数は y = ax + b でまとめます。a = ${a}、b = ${b} なので「${correct}」。`,
        `ここだけは覚えると強いです：「グラフが (0, ?) を通る」は「切片が ?」。\n\nつぎに、「x が 1 増えたとき、y がいくつ動く？」を見れば、それが傾きです。この問題では y が ${a} だけ動くから、傾きは ${a}。\n\nあとはゆっくり式に代入するだけです。\n\ny のスタート地点（切片）は ${b}。\n進み方の速さ（傾き）は ${a}。\nだから一番きれいに書いた式は「${correct}」。\n\nもしまだイメージがわかなかったら「x=1 を代入して、(1 のときの高さ)=(切片)+(傾き)」と一致するか、そっと確認してみてください。`
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
        `ゆっくりで大丈夫です。\n\n正解は「${y}」。\n\nやることは「式の x の場所を、問題の値にひとつだけ入れ替える」だけです。\n式：y = ${a}x ${b >= 0 ? "+ " + b : "− " + Math.abs(b)}\nここへ x = ${x} を代入。\n\n計算は\ny = (${a})×(${x}) ${b >= 0 ? "+ " + b : "− " + Math.abs(b)}\n  = ${a * x} ${b >= 0 ? "+ " + b : "− " + Math.abs(b)}\n  = ${y}\nと順番にできるとミスりにくいです。`,
        `いちばんてんてきです：「x」の文字を問題の数字に置きかえます。\n\nこの問題では x が ${x} なので、式のどこにある x も「${x}」に読みかえていいです。\n\nつぎに、式をひとつずつ順番どおりに計算しましょう。\n\nステップ①：(${a}) に (${x}) をかける → ${a * x}\nステップ②：${b >= 0 ? `そこへ +${b} を足す` : `そこから ${Math.abs(b)} を引く`} → ${y}\n\n答えだから「${y}」。\n\n代入のとき、マイナスが混じるともう一度「かけてから足す」「かけてから引く」を声にだして復唱すると、だいぶ安定します。`
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
        `大丈夫、手順があるタイプです。\n\n正解は「${correct}」。\n\n①【傾き】\nここにあるふたつの点から「右に進んだぶん」を x の増え、「上／下に進んだぶん」を y の増え、として\na = (yの増え) ÷ (xの増え)\nこれが傾きです。\n計算すると a = (${y2} − ${y1}) ÷ (${x2} − ${x1}) = ${a}。\n\n②【切片】\nいま y = ${a}x + b だとすると、どちらかの点で x と y がわかっているので代入して b が出せます。\n例：(${x1}, ${y1}) を使うと ${y1} = ${a}×${x1} + b から、b = ${b}。\n\n③【答えに直す】\n整理すると「${correct}」。`,
        `考え方を「順番」のみにしましょう。まず傾き、あと切片、最後に式をチェック。\n\n傾きのイメージ：\nグラフウォーカーでもいいので「${x1} から ${x2} に歩いた」とき、右に (${x2}−${x1})、縦には (${y2}−${y1}) 動いた。だから (${y2}−${y1})÷(${x2}−${x1}) が傾き。ここでは ${a}。\n\n切片のイメージ：\nグラフが y 軸をどの高さで切るか。点を代入すれば、その「足りない定数項」だけ残ります。ここでは b が ${b}。\n\n最後にもう一回：傾き ${a} と切片 ${b} から y = … を書いたら、「${correct}」が答えになります。\n\n迷ったら、このふたつの点どちらかをもう一回式に代入して、「本当に成り立つか」だけ確認するのも強い復習です。`
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
      `ひとことずついきましょう。\n\n正解は「${correctText}」。\n\n傾き a の意味だけ、はっきりさせます。\nx がちょうど 1 だけ増えたとき、y がいくつ変わるか、と読むのが伝わりやすい定義です。だから「傾き a は x が 1 増えたときの y の増え」と言える選択肢が、この文章ではいちばん正確です。\n\n他の選択肢がダメな例：\n・「右に進むほど y が必ず大きくなる」→ a が負なら小さくなります。\n・「グラフが原点を通る」→ 切片 b が 0 とは限らないので、決して言えません。\n・「傾きが負なら右ほどグラフが上がる」→ 傾きが負だとだいたい下がり側です。\n・「切片は x 軸との交点の x」→ x じゃなく、y軸側の読み／高さ（y の値）の話になります。\n`,
      `ここだけは頭のチェックリストにしておくと強いです。\n\nチェック①：傾き＝「右に 1 にしたときに、y がじつはいくつ動く？」\nこれが伝わっているのは、「${correctText}」だけです。\n\nチェック②：切片って何？ → y 軸を切るときの高さ。\nチェック③：原点を通る？ → 「必ず」とは書けません（場合による）。\n\nつまり、言い切れるのは「増え」の定義の話。「${correctText}」という一行が、グラフでも式でも共通のひもづいたルールになります。\n\n学校のワークでは、ひとつの例（a が正／負それぞれ）をスケッチすると、体感がぐっときます。ゆっくりで大丈夫です。`
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
        `落ち着いて底角だけをひっぱりだす問題です。\n\n正解は「${correct}」。\n\n二等辺三角形は「下のほうにある同じサイズのふたつの角（底角）が等しい」形です。\n頂角 ${vertex}° が決まっているので、残り (180 − ${vertex})° をちょうどふたつに分けるとそれぞれが底角です。\n式で書けば、(180 − ${vertex}) ÷ 2 = ${base}°。\n`,
        `考えかたはとてもラクです。三角形には角がちょうど 3つあります。その合計がいつでも 180°。\n\nいま「ふさわしく同じ」の底角だけを α とおいたら、方程式はこれだけになります。\n\n${vertex}° + α + α = 180°\n\nまず両から ${vertex}° をひくと残りが ${180 - vertex}°。\nそれを二等分 → ${base}°。\n\n紙になぐり書きの三角形でも、数字をラベルを貼るイメージで「残り」を半分にわける、だけです。\n\n答えだから「${correct}」。`
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
        `ここでも「ひとつのルール」を使えば十分です。\n\n正解は「${correct}」。\n\n三角形のふたつの角がわかれば、さいごのひとつの角まわりの数は自動で決まります。\n式：残りの角 = 180° − ${a}° − ${b}° = ${180 - a - b}°。\n`,
        `手順だけ覚えるなら、この一行です。\n\n「ひとつの三角形の仲間のすみっこ（内角）は、足すといつでも 180°」\n\nすでにわかっているふたつを足して、それを 180° から引いたら、ひとつの答えだけ残ります。\n\n計算だけ書くなら 180 − ${a} − ${b} = ${c}。だから「${correct}」。\n\n入試だと、このあと二等辺・平行線・証明問題に転がされるので、この「ひき算で残り」を秒で出せると安心です。\n`
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
        `公式をそのまま使う問題です。\n\n正解は「${correct}」（単位までのイメージ：${correct} と書かれた選択肢を選ぶ）。\n\nn 角形の内角の和は ( n − 2 ) × 180°。\n代入すると (${n} − 2) × 180° = ${n - 2} × 180° = ${interior}°。\n`,
        `なぜ (n − 2) と出てくるか、イメージだけつかんでおくと忘れません。\n\nへんが n 本分ある多角形でも、ひとつのすみから「ちょうど重ならない三角形」だけにちぎれば、(へんが n に対して三角形は n−2個) と数えられるしくみがあります。\n\nそのぶんだけ、180° ブロックがある、と覚えて大丈夫です。\n\nこの問題では (${n} − 2) × 180° をじっさいにかけるだけで ${interior}°。\n\nだから選択肢でも「${correct}」だけがひっかかります。`
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
            `用語問題は「定義に立ちかえられるか」がカギ。\n\n正解は「${p.ok}」。\n\n平行四辺形とは「向き合っている辺の組が、それぞれペアになって並行している四角形」のことです。その結果として、「向き合っている辺の長さも同じ」になります。このふたつはセットで使うことが多い性質です。`,
            `かんたんでいう話です。\n\n平行四辺形＝向かい側のヘンたちがそれぞれ「ならんだ向き」になり、かつ「むこうぐらい同じ長さ」。\n\nだから問題の並びでも「並行」かつ「じつは長さまでそろっている」セットが正解になります。\n\nいっぽう、たとえば「たてと横がいつでも垂直」の話は正方形や長方形のイメージに寄りやすいので、この設問とはちがう、とだけ区別しましょう。`
          )
        : p.ok === "4つの角はすべて 90°"
          ? expl(
              `定義問題ですね。\n\n正解は「${p.ok}」。\n\n長方形とは「四角い角がすべてまっすぐ（直角＝90°）」という条件でとらえるのが標準です。だから、この文章が「必ず成り立つ」ものです。\n\n「隣の辺も同じ長さ」になるのは正方形に近づいたときだけ。長方形だけ・一般では言い切れません。`,
              `長方形という名前を聞いたら、頭のメモでもいいので「正方形っぽいけれど、縦と横の長さはちがっても／すべて同じでなくてもいい」を貼っておく。\n\nまわりの角は、すべて 90° と読めるのが共通ルール。この設問でも「すべて 90°」が唯一のひっかけない答えになります。\n\n縦だけ短めの長方形を紙にかくなら、「たてとよこの長さはちがうけど、角はすべてまっすぐ」と体感できます。ゆっくりで大丈夫です。`
            )
          : expl(
              `定義問題ですね。\n\n正解は「${p.ok}」。\n\nひし形（菱形）は「4つの辺の長さが同じ」を満たす平行四辺形として紹介されることがほとんどです。そのまま並行にもなっているので、「平行でもあるし、ねたたちはぜんぶ同じ」がポイント。`,
              `ひし形＝4辺がすべて同じ長さをもつ並行の四辺形、と頭のひとつの箱にしましょう。\n\n語をならべると、「4辺とも同じ長さ」を直接言えるのはこの設問だけです。\n\n覚えるイメージは「カイトの親戚」でもいいのですが、ひし形は「並行であること」をセットで復習しておくと、長方形だけのときに正方形を混ぜないで済みます。`
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
      `平行線セットの問題です。\n\n正解は「${correct}」。\n\n「同側の内角」は、2本の平行線を横切った一本の一直線について、線のちょうど同じ側にあって、平行線どうしの間にあるふたつの角のペア。\nこれらをたすとつねに 180°（補角としてのペア）になります。\n\n一方がすでに ${t}° なので、もう一方は 180 − ${t} = ${corr}°。`,
      `まずゆっくり「どの角たちを見ている問題か」を思いだします。\n\n同側の内角＝平行線の内側にある、しかもひと側にそろったふたつの角。\nふたつをたすと 180° になるペアです。\n\nだから 180 − ${t} とけば ${corr}°。\n\n錯角・同位角などとはちがう「関係の名前」なので、この設問は「ひとまずたし算でそろえる」だけ心がければ大丈夫です。`
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
        `確率の基本パターンです。\n\n正解は「${correct}」。\n\n①目の出方は、平等に 1〜6 の 6 通りと考えます。\n②ほしい目は「${nums}」の ${favorable} 通り。\n③確率は (ほしい通り) ÷ (ぜんぶの通り) = ${favorable}/6。\n④分子と分母の共通の約数でちぢめる（約分）→「${correct}」。`,
        `さいころは「6 パターンのどれかひとつ」というシンプルな箱だと思ってください。\n\nそこへ「自分が気にしている目がいくつ入っている？」をただ数えるだけです。この問題では ${favorable} 個。\n\nだからひとつの目が出てくる期待の割り合いは ${favorable} ぶん の 6、と読み、その分数をひとつのかたちにまとめると「${correct}」。\n\nもしまだひっかかったら、(1の目だけをみる)→(2つの目…)と、樹形図でも列挙して「ぜんぶ 6」をもう一丁書き、そのうち何本が自分の名前の目か、ゆっくり数えれば同じ結果になります。`
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
        `並べると視界がひらけるタイプ。\n\n正解は「${correct}」。\n\n公平なコインなら、「表か裏か」の列を ${coins === 2 ? "2枚" : "3枚"} ぶん並べられるので、総数はちょうど ${total} とおりになります。そのうち「表がちょうど ${wantHeads} 枚」となるのが ${favorable} とおりなので確率は ${favorable}/${total}、約分で「${correct}」。`,
        `かんたんいう話は「全部の並び」を「そろばん」のようにならべるイメージです。\n\n${coins === 2 ? "ひとつのコインだけを表裏だけで並べれば 2 とおり。そのさきにもうひとつくっつけると 2×2＝4" : "3枚なら縦にもう一本足すだけで 8。"}。\n\nそこから「表の数がちょうど ${wantHeads}」になっている列だけを色をつけて数えると ${favorable} 本。\n\nだから ${favorable} ぶんの ${total} → 約分「${correct}」。\n\nもし樹形図を紙にして「表を上、裏を下」に書くと、目で追いやすいです。`
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
        `袋の問題は「割合」そのものです。\n\n正解は「${correct}」。\n\n玉は合計 ${red + white} 個、そのうち赤が ${red} 個。よって赤が出る確率は ${red}/${bag}。約分すると「${correct}」。`,
        `頭にゆるいモデルでもいいです：袋からランダムにひとつ取るとき、「赤がいくつ入っている？」を数えます。${red} 個。\n\n袋のなかにある玉は全部で ${bag} とおもえば、ひとつの取りひきで赤が出やすさはそのまま分数 ${red}/${bag}。\n\nあとは共通の約数でちいさくすると「${correct}」。`
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
      `並べ一覧にするとひらけます。\n\n正解は「${correct}」。\n\nふたつのさいころだと順を区別すると 6×6＝36 とおり。そのうち和がちょうど ${sums} になる並びだけ数えると ${actual} とおりです。確率は ${actual}/36、約分「${correct}」。`,
      `まず 36 とおりしかないことを覚える（上のサイコロが決まったうえでしたのサイコロをならぶ）と頭がラクになります。\n\nつぎに「ほしい『和』だけに色」をつける。${sums} が作れる組だけ数える→ ${actual}。\n\nなのでひとつの投げセットで期待する割り合いは ${actual}/36 → ひとつのかたちにまとめると「${correct}」。\n\n表を紙におくときはひとつの列に「ひとつの目」をならべ、もうひとつの行にほかをならぶと視界がゆるくなるはずです。`
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
        `展開問題はゆっくりで十分です。\n\n正解は「${correct}」。\n\n(x+P)(x+Q) のとき、いちばんよく見るひとつのまとめ方はこう書けます。\n・x と x があって x²。\n・x に P と Q がくっつくぶんだけ足すので、一次の係数は P+Q＝(${p}+${q})=${p + q}。\n・さいごにただの数は P と Q がかかったもの PQ＝${p * q}。\n並べれば「${correct}」。`,
        `ゆっくりかっこを「ひろげる」だけです。\n\n(x)×(x) で x²。あとは x にくっつく項をすべて足し、そのあとで数だけの項をひとつのかたまりに。\nかっこのふたつの数をたす→ x の係数は ${p + q}。かっこのふたつの数をかける→ 定数だけは ${p * q}。\n\nゆっくり並べれば「${correct}」。紙に「先頭・外・内・末尾」の順で矢印を引くともっと安心です。\n`,
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
        `じっさいの数がほしいときの王道パターンです。\n\n正解は「${correct}」。\n\nひとつのルート：まずかっこを分配法則でひろげる。\n${k}(x+${a}) = ${k}x + ${k * a}。\nここへ x=${b} を代入します。\n\nしたがって\n${k}×${b} + ${k * a} = ${k * b + k * a}。\n共通因数として ${k} をくくると ${k}(${b}+${a})=${correctNum}。`,
        `かっこだけに数字が残っても慌てなくて大丈夫です。\n\nいちばん迷わない順番は「かっこをひろぐ → 代入」です。\n\nステップ①：${k}(x + ${a}) を ${k}×x + ${k}×${a} に。\nステップ②：x のところに ${b} を入れるので ${k}×${b} + ${k * a}。\nステップ③：${k * b}+${k * a} で ${correctNum}、共通因数の見方でもひとしく ${k}×(${a}+${b})。\n\nゆっくり電卓でたしかめてもいいので、この順番だけは身体にきざんでおけば大丈夫です。`
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
        `符号はこわくない問題です。\n\n正解は「${simp}」。\n\nゆっくり項をたしていきます。\n・x×(−x) = −x²。\n・x×${n} と (−${m})×(−x) が x の係数に効くので、係数だけを足すと ${n + m}。\n・(−${m})×(${n}) が定数 ${-m * n}。\nまとめれば「${simp}」。`,
        `マイナスが多くても、やることは「クロスにもくもく分配」だけです。\n\n左のひとつの文字と右のかっこの各項をつながり順にかけ、つぎに左にある「−数字」と右にある各項でも同じようにかける。\n\nかけおわったひとセットを、順に x²の仲間／x の仲間／数だけ に分類して足せば頭がすっきりします。\n\nこの問題では −x²、${n + m}x、${-m * n} までいけば並べられる「${simp}」。ゆっくり紙にも一度だけそのまま写してみて大丈夫です。\n`,
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
          `ゆっくり代入で大丈夫です。\n\n正解は「${correct}」。\n\n(${x})² − 4×(${x}) + 3 と一行ずつひらくと：\n= ${x * x} − ${4 * x} + 3\n= ${correct}\n`,
          `x の文字を問題の値 ${x} に置き換えたあと、( )² と −4×( ) は別々のひとセットとしてゆっくり計算しましょう。\n\nひとときつまずきやすいのは x² を x×2 とまちがえることだけです。実際には (${x})² = ${x * x} と、ひとつの数をふたじゅう乗。\n\n最後まで足しひいて「${correct}」。`
        )
      : expl(
          `ゆっくり代入で大丈夫です。\n\n正解は「${correct}」。\n\n(${x})² + 3×(${x}) + 2 を一行ずつ：\n= ${x * x} + ${3 * x} + 2\n= ${correct}\n`,
          `やることはひとつ、式のすべての x をゆっくり ${x} にかきかえ、そのあとはかけてたす順でだいじょうぶです。\n\n(${x})×(${x}) が ${x * x}、3×(${x}) が ${3 * x}、あとひとつの +2 と足せばそのまま「${correct}」。`
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
