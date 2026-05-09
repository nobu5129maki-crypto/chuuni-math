/** インライン表示用 SVG（同一画面上で defs の id がぶつからないよう番号を振る） */
let svgSeq = 0;
function nextId(): number {
  return ++svgSeq;
}

const NS = `xmlns="http://www.w3.org/2000/svg"`;

export function svgLinearSlopeAndIntercept(a: number, b: number): string {
  const id = nextId();
  const yTip = Math.max(40, Math.min(92, 100 - Math.min(48, Math.max(-48, a * 10))));
  const bY = Math.max(54, Math.min(112, 100 - Math.min(15, Math.max(-15, b * 5))));

  return `<svg ${NS} viewBox="0 0 240 128" role="img" aria-label="一次関数のグラフイメージ" class="diagram-svg-inner">
    <defs>
      <marker id="ax-${id}" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto-start-reverse"><path d="M0 0 V6 L6 3 Z" fill="currentColor"/></marker>
    </defs>
    <g fill="none" stroke="currentColor" stroke-width="2" opacity="0.38">
      <line x1="36" y1="100" x2="218" y2="100" marker-end="url(#ax-${id})"/>
      <line x1="60" y1="118" x2="60" y2="28" marker-end="url(#ax-${id})"/>
    </g>
    <text x="224" y="104" fill="currentColor" font-size="11" opacity="0.82">x</text>
    <text x="48" y="36" fill="currentColor" font-size="11" opacity="0.82">y</text>
    <circle cx="60" cy="${bY}" r="6" fill="rgba(74,222,128,0.35)" stroke="currentColor" stroke-width="2" />
    <text x="72" y="${bY > 94 ? bY - 10 : bY + 22}" fill="currentColor" font-size="10" opacity="0.85">切片≒y=${b}</text>
    <line x1="60" y1="${bY}" x2="150" y2="${yTip}" stroke="rgba(125,211,252,0.95)" stroke-width="3.2" stroke-linecap="round" />
    <text x="152" y="${(bY + yTip) / 2}" fill="#fbbf24" font-size="10">傾き≒${a}</text>
  </svg>`;
}

export function svgPlugX(x: number): string {
  return `<svg ${NS} viewBox="0 0 240 88" role="img" aria-label="代入イメージ" class="diagram-svg-inner">
    <rect x="20" y="20" width="200" height="48" rx="10" fill="rgba(56,189,248,0.07)" stroke="currentColor" stroke-width="2" />
    <text x="120" y="52" fill="currentColor" font-size="17" font-weight="700" text-anchor="middle">「x」→ 「${x}」に代入</text>
    <text x="120" y="78" fill="currentColor" font-size="11" opacity="0.72" text-anchor="middle">式のしかたはそのまま・数だけ入れ替え</text>
  </svg>`;
}

export function svgTwoPointsOnLine(): string {
  const id = nextId();
  return `<svg ${NS} viewBox="0 0 240 118" role="img" aria-label="2点を通る直線" class="diagram-svg-inner">
    <defs>
      <marker id="ax-${id}" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto-start-reverse"><path d="M0 0 V6 L6 3 Z" fill="currentColor"/></marker>
    </defs>
    <line x1="36" y1="96" x2="210" y2="96" stroke="currentColor" stroke-width="1.8" opacity="0.38" marker-end="url(#ax-${id})"/>
    <line x1="42" y1="94" x2="202" y2="34" stroke="rgba(167,139,250,0.95)" stroke-width="3.2" stroke-linecap="round"/>
    <circle cx="78" cy="72" r="7" fill="rgba(251,113,133,0.45)" stroke="currentColor"/>
    <circle cx="178" cy="44" r="7" fill="rgba(251,113,133,0.45)" stroke="currentColor"/>
    <text x="120" y="22" fill="currentColor" font-size="11" text-anchor="middle" opacity="0.85">傾き＝増え÷増え／切片は代入で</text>
  </svg>`;
}

export function svgSlopeDefinition(): string {
  return `<svg ${NS} viewBox="0 0 240 104" role="img" aria-label="傾きの言い方" class="diagram-svg-inner">
    <text x="120" y="44" fill="currentColor" font-size="14" font-weight="700" text-anchor="middle">傾き a</text>
    <text x="120" y="68" fill="currentColor" font-size="13" text-anchor="middle" opacity="0.86">「x が 1 増えたとき」の y の変化として考えられる</text>
    <text x="120" y="90" fill="currentColor" font-size="11" text-anchor="middle" opacity="0.72">切片 b は y 軸で会う「高さ」</text>
  </svg>`;
}

export function svgIsosceles(vertexDeg: number, baseDeg: number): string {
  return `<svg ${NS} viewBox="0 0 200 128" role="img" aria-label="二等辺三角形" class="diagram-svg-inner">
    <polygon points="100,16 176,116 24,116" fill="rgba(167,139,250,0.07)" stroke="currentColor" stroke-width="2.4" />
    <text x="92" y="44" fill="#fbbf24" font-size="12" font-weight="700">${vertexDeg}°</text>
    <text x="36" y="112" fill="#7dd3fc" font-size="12" font-weight="700">${baseDeg}°</text>
    <text x="132" y="112" fill="#7dd3fc" font-size="12" font-weight="700">${baseDeg}°</text>
    <text x="100" y="126" fill="currentColor" font-size="10" text-anchor="middle" opacity="0.72">下の角はちから合わせ</text>
  </svg>`;
}

export function svgTriangleAngles(a: number, b: number, c: number): string {
  return `<svg ${NS} viewBox="0 0 200 130" role="img" aria-label="三角形と内角" class="diagram-svg-inner">
    <polygon points="100,22 174,116 26,116" fill="rgba(74,222,128,0.06)" stroke="currentColor" stroke-width="2.4" />
    <text x="96" y="108" fill="currentColor" font-size="13">${a}°</text>
    <text x="40" y="108" fill="currentColor" font-size="13">${b}°</text>
    <text x="142" y="58" fill="#fbbf24" font-size="13" font-weight="700">${c}°</text>
    <text x="100" y="126" fill="currentColor" font-size="11" text-anchor="middle" opacity="0.74">${a}+${b}+${c}=180°</text>
  </svg>`;
}

export function svgPolygonSlices(n: number): string {
  return `<svg ${NS} viewBox="0 0 220 118" role="img" aria-label="多角形" class="diagram-svg-inner">
    <polygon points="110,20 174,92 160,114 110,114 62,114 48,92" fill="rgba(125,211,252,0.06)" stroke="currentColor" stroke-width="2" />
    <text x="110" y="112" fill="currentColor" font-size="12" text-anchor="middle">内角の和 = (${n}−2)×180°</text>
  </svg>`;
}

export function svgParallelSameSide(one: number): string {
  const other = 180 - one;
  return `<svg ${NS} viewBox="0 0 248 140" role="img" aria-label="平行線と同側の内角" class="diagram-svg-inner">
    <line x1="24" y1="42" x2="224" y2="42" stroke="currentColor" stroke-width="2.6" opacity="0.72" />
    <line x1="24" y1="106" x2="224" y2="106" stroke="currentColor" stroke-width="2.6" opacity="0.72" />
    <line x1="168" y1="12" x2="94" y2="138" stroke="rgba(251,113,133,0.88)" stroke-width="2.4" />
    <text x="110" y="128" fill="currentColor" font-size="13" font-weight="700" text-anchor="middle">${one}+${other}=180</text>
    <text x="130" y="98" fill="#fbbf24" font-size="11">${one}°</text>
    <text x="84" y="68" fill="#7dd3fc" font-size="11">${other}°</text>
  </svg>`;
}

export function svgShapeFacts(): string {
  return `<svg ${NS} viewBox="0 0 236 112" role="img" aria-label="図形の性質" class="diagram-svg-inner">
    <rect x="32" y="52" width="72" height="48" rx="8" transform="skewX(-10)" fill="rgba(167,139,250,0.12)" stroke="currentColor"/>
    <rect x="132" y="44" width="72" height="56" rx="6" fill="rgba(125,211,252,0.08)" stroke="currentColor"/>
    <text x="118" y="32" fill="currentColor" font-size="13" font-weight="700" text-anchor="middle">たいごとに決まりがある</text>
  </svg>`;
}

export function svgSingleDieHighlighted(favorable: number): string {
  const chips = [1, 2, 3, 4, 5, 6]
    .map((d, i) => {
      const cx = 42 + i * 28;
      const ok = d <= favorable;
      const fill = ok ? "rgba(74,222,128,0.5)" : "rgba(148,163,184,0.35)";
      return `<circle cx="${cx}" cy="56" r="11" fill="${fill}" stroke="currentColor"/><text x="${cx}" y="60" fill="currentColor" font-size="11" font-weight="700" text-anchor="middle">${d}</text>`;
    })
    .join("");
  return `<svg ${NS} viewBox="0 0 220 112" role="img" aria-label="さいころの出目" class="diagram-svg-inner">
    ${chips}
    <text x="110" y="102" fill="currentColor" font-size="11" text-anchor="middle" opacity="0.74">6 とおりすべて同じような確からしさで</text>
  </svg>`;
}

export function svgTwoDiceGrid(): string {
  return `<svg ${NS} viewBox="0 0 236 124" role="img" aria-label="2つのさいころ" class="diagram-svg-inner">
    <rect x="38" y="38" width="68" height="68" rx="10" fill="rgba(148,163,184,0.14)" stroke="currentColor"/>
    <rect x="130" y="38" width="68" height="68" rx="10" fill="rgba(148,163,184,0.14)" stroke="currentColor"/>
    <text x="118" y="28" fill="currentColor" font-size="12" text-anchor="middle" opacity="0.76">6×6＝全部36 とおりで数える</text>
    <text x="72" y="120" fill="currentColor" font-size="13" font-weight="700" text-anchor="middle">①</text>
    <text x="164" y="120" fill="currentColor" font-size="13" font-weight="700" text-anchor="middle">②</text>
  </svg>`;
}

export function svgCoinsRow(count: number): string {
  const n = Math.min(count, 3);
  const w = Math.max(180, n * 54 + 40);
  const coins = Array.from({ length: n }, (_, i) => {
    const cx = 40 + i * 54;
    return `<circle cx="${cx}" cy="44" r="20" fill="rgba(251,191,36,0.22)" stroke="currentColor"/><text x="${cx}" y="49" fill="currentColor" font-size="13" font-weight="700" text-anchor="middle">?</text>`;
  }).join("");
  const lbl = count === 3 ? "パターンを全部 8 とおり書き出せる" : "パターンを全部 4 とおり書き出せる";
  return `<svg ${NS} viewBox="0 0 ${w} 88" role="img" aria-label="硬貨" class="diagram-svg-inner">
    ${coins}
    <text x="${w / 2}" y="82" fill="currentColor" font-size="11" opacity="0.74" text-anchor="middle">${lbl}</text>
  </svg>`;
}

export function svgBag(red: number, white: number): string {
  const total = red + white;
  return `<svg ${NS} viewBox="0 0 236 118" role="img" aria-label="袋から玉をひく" class="diagram-svg-inner">
    <path d="M 52 48 Q 110 138 174 48 Q 128 138 118 146 Q 90 138 52 48 Z" fill="rgba(125,211,252,0.07)" stroke="currentColor" stroke-width="2.2"/>
    <circle cx="90" cy="58" r="11" fill="rgba(251,113,133,0.55)" stroke="currentColor"/>
    <text x="152" y="46" fill="currentColor" font-size="13">赤 ${red} / ${total}</text>
    <text x="152" y="74" fill="currentColor" font-size="11" opacity="0.76">全体で割れば確率になる</text>
  </svg>`;
}

export function svgExpandBoxes(): string {
  return `<svg ${NS} viewBox="0 0 220 124" role="img" aria-label="展開ブロックイメージ" class="diagram-svg-inner">
    <rect x="40" y="30" width="68" height="68" fill="rgba(74,222,128,0.1)" stroke="currentColor"/>
    <rect x="108" y="30" width="72" height="68" fill="rgba(167,139,250,0.09)" stroke="currentColor"/>
    <line x1="40" y1="62" x2="180" y2="62" stroke="currentColor" stroke-dasharray="3 5" opacity="0.55"/>
    <line x1="108" y1="30" x2="108" y2="98" stroke="currentColor" stroke-dasharray="3 5" opacity="0.55"/>
    <text x="108" y="116" fill="currentColor" font-size="11" text-anchor="middle" opacity="0.78">4マスぶんが x² と x と常数になる</text>
  </svg>`;
}

export function svgKxPlusA(): string {
  const id = nextId();
  return `<svg ${NS} viewBox="0 0 240 100" role="img" aria-label="分配と代入の順" class="diagram-svg-inner">
    <defs>
      <marker id="hr-${id}" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 Z" fill="currentColor"/></marker>
    </defs>
    <text x="120" y="30" fill="currentColor" font-size="13" font-weight="700" text-anchor="middle">分配 → のちに代入 がスッキリ</text>
    <path d="M36 62 H216" marker-end="url(#hr-${id})" stroke="currentColor" stroke-width="2" opacity="0.45"/>
    <text x="102" y="88" fill="currentColor" font-size="13" opacity="0.82" text-anchor="middle">広げて</text>
    <text x="176" y="88" fill="currentColor" font-size="13" opacity="0.82" text-anchor="middle">数字を代入</text>
    <circle cx="64" cy="62" r="16" fill="rgba(125,211,252,0.15)" stroke="#7dd3fc"/>
    <circle cx="120" cy="62" r="16" fill="rgba(125,211,252,0.15)" stroke="#7dd3fc"/>
    <circle cx="178" cy="62" r="16" fill="rgba(74,222,128,0.2)" stroke="#4ade80"/>
  </svg>`;
}

export function svgSignShuffle(): string {
  return `<svg ${NS} viewBox="0 0 240 116" role="img" aria-label="符号チェックくくり" class="diagram-svg-inner">
    <text x="120" y="42" fill="currentColor" font-size="13" font-weight="700" text-anchor="middle">左と右から順にじっくりひろげよう</text>
    <rect x="30" y="58" width="180" height="44" rx="12" fill="rgba(251,113,133,0.07)" stroke="currentColor"/>
    <text x="122" y="86" fill="currentColor" font-size="19" opacity="0.88" font-weight="800" text-anchor="middle">± × は一つずつ</text>
  </svg>`;
}

