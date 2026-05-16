import { useCallback, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { CurriculumUnit, SemesterId } from "./curriculum";
import { SEMESTER_PLANS, semesterPlan } from "./curriculum";
import type { DifficultyId, Question, TopicId } from "./types";
import { topicMeta } from "./topics";
import { buildQuestionDeck } from "./questions";
import {
  addXp,
  incrementRound,
  loadProfile,
  mergeBestScore,
  recordTopicPlayed,
  saveProfile,
} from "./storage";
import {
  BADGE_CATALOG,
  badgeById,
  computeNewBadgeIds,
  levelFromTotalXp,
  mergeBadges,
  MIX_UNLOCK_LEVEL,
  progressionSnapshot,
} from "./progression";

type RewardModal = {
  xpGain: number;
  oldLevel: number;
  newLevel: number;
  leveledUp: boolean;
  newBadgeIds: string[];
};

type Phase = "home" | "quiz" | "result";

const QUESTIONS_PER_ROUND = 10;

function randomSeed(): number {
  return Math.floor(Math.random() * 1_000_000_000);
}

/** 単元カードから実際に起動するステージ（専用セットがない単元は関連ステージ） */
function resolveLaunchTopic(unit: CurriculumUnit): TopicId | null {
  return unit.playTopic ?? unit.relatedTopic ?? null;
}

export default function App() {
  const [profile, setProfile] = useState(loadProfile);
  const [phase, setPhase] = useState<Phase>("home");
  const [selectedSemester, setSelectedSemester] = useState<SemesterId>(1);
  const [topic, setTopic] = useState<TopicId>("linear");
  const [difficulty, setDifficulty] = useState<DifficultyId>("normal");
  const [deck, setDeck] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [lives, setLives] = useState(3);
  const [correctCount, setCorrectCount] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [locked, setLocked] = useState(false);
  const [wrongGentlerOpen, setWrongGentlerOpen] = useState(false);
  /** ハードでライフ枯渇後に結果へ進んだとき true（撃沈終了） */
  const [endedByHardKnockout, setEndedByHardKnockout] = useState(false);
  const [rewardModal, setRewardModal] = useState<RewardModal | null>(null);

  const comboRef = useRef(0);

  const persist = useCallback((next: ReturnType<typeof loadProfile>) => {
    setProfile(next);
    saveProfile(next);
  }, []);

  const prog = useMemo(() => progressionSnapshot(profile.totalXp), [profile.totalXp]);
  const semester = useMemo(() => semesterPlan(selectedSemester), [selectedSemester]);

  const startGame = (t: TopicId, d: DifficultyId) => {
    const meta = topicMeta(t);
    if (meta.unlockLevel != null && prog.level < meta.unlockLevel) return;
    setTopic(t);
    setDifficulty(d);
    setDeck(buildQuestionDeck(t, d, QUESTIONS_PER_ROUND, randomSeed()));
    setIndex(0);
    setScore(0);
    setCombo(0);
    comboRef.current = 0;
    setMaxCombo(0);
    setLives(d === "hard" ? 3 : 3);
    setCorrectCount(0);
    setPicked(null);
    setShowHint(false);
    setLocked(false);
    setWrongGentlerOpen(false);
    setEndedByHardKnockout(false);
    setPhase("quiz");
  };

  const current = deck[index];

  const progress = useMemo(() => {
    if (!deck.length) return 0;
    return ((index + (locked && picked !== null ? 0.15 : 0)) / deck.length) * 100;
  }, [deck.length, index, locked, picked]);

  const goNext = useCallback(() => {
    setPicked(null);
    setShowHint(false);
    setLocked(false);
    setWrongGentlerOpen(false);
    setIndex((i) => i + 1);
  }, []);

  const endRound = useCallback(() => {
    setPhase("result");
  }, []);

  const onChoose = (choiceIndex: number) => {
    if (!current || locked) return;
    const ok = choiceIndex === current.correctIndex;
    setPicked(choiceIndex);
    setLocked(true);
    const bonus = difficulty === "hard" ? 35 : 25;
    if (ok) {
      const prev = comboRef.current;
      const gained = 100 + prev * bonus;
      comboRef.current = prev + 1;
      setCombo(comboRef.current);
      setScore((s) => s + gained);
      setMaxCombo((m) => Math.max(m, comboRef.current));
      setCorrectCount((c) => c + 1);
    } else {
      comboRef.current = 0;
      setCombo(0);
      if (difficulty === "hard") setLives((l) => Math.max(0, l - 1));
      setWrongGentlerOpen(false);
    }
  };

  const showCorrectCelebrate = !!(current && locked && picked !== null && picked === current.correctIndex);
  const showWrongExplain = !!(current && locked && picked !== null && picked !== current.correctIndex);

  const proceedFromCorrect = () => {
    const isLast = index + 1 >= deck.length;
    if (isLast) endRound();
    else goNext();
  };

  const proceedFromWrong = () => {
    if (difficulty === "hard" && lives <= 0) {
      setEndedByHardKnockout(true);
      endRound();
      return;
    }
    if (index + 1 >= deck.length) endRound();
    else goNext();
  };

  /** 撃沈ひとつ前（最後の1ハート）。次のミスでゼロ＝強制終了予告に使う */
  const hardOnLastHeart =
    difficulty === "hard" && locked && picked !== null && picked !== current?.correctIndex && lives === 1;

  const finishResult = useCallback(() => {
    const xpGain = Math.min(120, Math.floor(score / 25 + correctCount * 4));
    const oldLevel = levelFromTotalXp(profile.totalXp);
    let next = addXp(profile, xpGain);
    next = mergeBestScore(next, topic, score);
    next = incrementRound(next);
    next = recordTopicPlayed(next, topic);
    const newBadgeIds = computeNewBadgeIds(next);
    next = mergeBadges(next, newBadgeIds);
    const newLevel = levelFromTotalXp(next.totalXp);
    persist(next);
    setRewardModal({
      xpGain,
      oldLevel,
      newLevel,
      leveledUp: newLevel > oldLevel,
      newBadgeIds,
    });
    setEndedByHardKnockout(false);
    setPhase("home");
  }, [correctCount, persist, profile, score, topic]);

  const quizHeader = useMemo(() => {
    const meta = topicMeta(topic);
    const qp = progressionSnapshot(profile.totalXp);
    const heartStr =
      difficulty === "hard"
        ? (() => {
            const bust = [...Array(3)].map((_, i) => (i < lives ? "♥" : "♡")).join("");
            if (lives <= 0) return `${bust} · KO`;
            if (lives < 3) return `${bust} · のこり ${lives}`;
            return `${bust}`;
          })()
        : "練習ライフ無制限";
    return (
      <>
        <div className="quiz-top">
          <div>
            <div className="quiz-meta">
              {meta.emoji} {meta.title}
            </div>
            <div className="quiz-meta">
              Lv.{qp.level} {qp.rank.emoji} · {difficulty === "hard" ? "ハード" : "ノーマル"} ·{" "}
              {Math.min(index + 1, deck.length)}/{deck.length}
            </div>
          </div>
            <div style={{ textAlign: "right" }}>
            <div className="combo" title="連続正解するとボーナスがつきます">
              コンボ ×{combo}
            </div>
            <div className={`lives ${difficulty === "hard" ? "lives-hard-track" : ""}`}>{heartStr}</div>
          </div>
        </div>
        <div className="progress-track">
          <div className="progress-bar" style={{ width: `${Math.min(100, progress)}%` }} />
        </div>
      </>
    );
  }, [combo, deck.length, difficulty, index, lives, progress, profile.totalXp, topic]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <h1 className="brand-title">数チャレ！中2マスター</h1>
          <p className="brand-sub">中学2年｜1〜3学期マップ — ジャンル別にクエストで身につける</p>
        </div>
        <div className="header-stats" title={prog.rank.tagline}>
          <div className="xp-pill" title="プレイを重ねるほど少しずつふえる経験値（合計）">
            ⭐ XP {profile.totalXp}
          </div>
          <div className="level-pill">
            Lv.{prog.level}{" "}
            <span className="level-pill-rank">
              {prog.rank.emoji} {prog.rank.title}
            </span>
          </div>
        </div>
      </header>

      {phase === "home" && (
        <main className="card">
          <h2 className="home-title">学期とジャンルからえらぶ</h2>
          <p className="lead">
            公立中学校・中学2年の典型的な進度で、<strong>1学期／2学期／3学期</strong>と
            <strong>数と式・関数・図形・データの活用</strong>に整理しました。単元カードをタップするとチャレンジがはじまります。
            「オールジャンル・ラッシュ」はレベル {MIX_UNLOCK_LEVEL} から・3学期の総合からもどうぞ。
          </p>
          <section className="progression-card" aria-label="レベルと次のごほうびまで">
            <div className="prog-row">
              <span className="prog-level">Lv.{prog.level}</span>
              <span className="prog-rank-label">
                {prog.rank.emoji} {prog.rank.title}
              </span>
            </div>
            <p className="prog-tagline">{prog.rank.tagline}</p>
            <div className="prog-bar-track">
              <div className="prog-bar-fill" style={{ width: `${prog.pctToNext}%` }} />
            </div>
            <p className="prog-xp-caption">
              つぎのレベルまで <strong>{prog.xpToNext}</strong> XP · このレベル帯は {prog.xpIntoLevel} / {prog.xpForNextLevel}
            </p>
          </section>
          <section className="badge-panel" aria-label="実績バッジ">
            <h3 className="badge-panel-title">実績バッジ</h3>
            <div className="badge-chip-grid">
              {BADGE_CATALOG.map((b) => {
                const got = profile.unlockedBadges.includes(b.id);
                return (
                  <div key={b.id} className={got ? "badge-chip badge-chip--earned" : "badge-chip badge-chip--muted"} title={b.description}>
                    <span className="badge-chip-emoji" aria-hidden>
                      {b.emoji}
                    </span>
                    <span className="badge-chip-body">
                      <span className="badge-chip-title">{b.title}</span>
                      <span className="badge-chip-desc">{b.description}</span>
                      {!got && <span className="badge-chip-status">未取得</span>}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
          <details className="glossary">
            <summary>コンボ · XP · レベル · バッジ</summary>
            <p>
              <strong>コンボ</strong>は「連続で正解している回数」です。
              コンボが多いほど、つぎに正解したときのスコアにボーナスがつきます（だから「つなげるほどおいしい」）。途中でまちがえるとコンボは 0 にリセットされます。
            </p>
            <p>
              <strong>ハード</strong>はミスするたびに ♥ が 1 つ減り、<strong>ゼロになったタイミングでそのラウンドは終了</strong>です（撃沈終了）。
              説明は最後まで読んでから結果へ進めます。その時点までのスコアと経験値はきちんと反映されます。
            </p>
            <p>
              <strong>XP（えっくすぴー）</strong>は、ゲームでよく使う「経験値」イメージのポイントです。このアプリではラウンド結果から少しずつ増えます。
              画面右上の ⭐ は「いままでにためた XP の合計」です。ためると<strong>レベル</strong>が上がり、称号や解放コンテンツ（オールジャンルは Lv.{MIX_UNLOCK_LEVEL}〜）につながります。
            </p>
            <p>
              <strong>実績バッジ</strong>は、プレイ回数や累計 XP・レベル・いろいろなステージの記録など、条件を満たすと光ります。
            </p>
          </details>
          <div className="row" style={{ marginBottom: "0.85rem" }}>
            <span className="quiz-meta">難易度（すべての単元共通）</span>
            <div className="pill-toggle">
              <button type="button" className={difficulty === "normal" ? "active" : ""} onClick={() => setDifficulty("normal")}>
                ノーマル
              </button>
              <button type="button" className={difficulty === "hard" ? "active" : ""} onClick={() => setDifficulty("hard")}>
                ハード（♥3・ゼロで終了）
              </button>
            </div>
          </div>

          <div className="semester-tablist" role="tablist" aria-label="学期の切り替え">
            {SEMESTER_PLANS.map((s) => {
              const active = selectedSemester === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`semester-tab ${active ? "semester-tab--active" : ""}`}
                  onClick={() => setSelectedSemester(s.id)}
                >
                  <span className="semester-tab-title">{s.title}</span>
                  <span className="semester-tab-sub">{s.periodHint}</span>
                </button>
              );
            })}
          </div>

          <section className="semester-banner" aria-live="polite">
            <div className="semester-banner-top">
              <span className="semester-ribbon">{semester.ribbon}</span>
              <span className="semester-banner-label">中学2年・この学期のゴールイメージ</span>
            </div>
            <p className="semester-lead">{semester.lead}</p>
          </section>

          <div className="semester-genres">
            {semester.genres.map((genre) => (
              <section key={genre.id} className="genre-section" aria-labelledby={`genre-${genre.id}`}>
                <h3 className="genre-heading" id={`genre-${genre.id}`} style={{ "--genre-accent": genre.accent } as CSSProperties}>
                  <span className="genre-heading-emoji" aria-hidden>
                    {genre.emoji}
                  </span>
                  <span className="genre-heading-label">{genre.label}</span>
                </h3>
                <div className="unit-grid">
                  {genre.units.map((unit) => {
                    const launchTopic = resolveLaunchTopic(unit);
                    if (!launchTopic) return null;
                    const stageMeta = topicMeta(launchTopic);
                    const needLv = stageMeta.unlockLevel ?? 1;
                    const locked = prog.level < needLv;
                    const dedicated = unit.playTopic != null;
                    const best = profile.bestScores[launchTopic];

                    return (
                      <article
                        key={unit.id}
                        className={`unit-card ${locked ? "unit-card--locked" : ""} ${dedicated ? "" : "unit-card--placeholder"}`}
                        style={{ "--unit-accent": unit.accent } as CSSProperties}
                      >
                        {locked && (
                          <span className="unit-lock-badge" aria-hidden>
                            🔒 Lv.{needLv}
                          </span>
                        )}
                        {!dedicated && (
                          <span className="unit-placeholder-badge" title={unit.relatedHint}>
                            専用セット準備中
                          </span>
                        )}
                        <div className="unit-card-head">
                          <span className="unit-card-emoji" aria-hidden>
                            {unit.emoji}
                          </span>
                          <div className="unit-card-titles">
                            <h4 className="unit-card-title">{unit.title}</h4>
                            <p className="unit-card-stage">
                              ステージ：{stageMeta.emoji} {stageMeta.title}
                              {!dedicated && unit.relatedHint ? (
                                <span className="unit-card-stage-note">（{unit.relatedHint}）</span>
                              ) : null}
                            </p>
                          </div>
                        </div>
                        <p className="unit-card-summary">{unit.summary}</p>
                        <div className="unit-card-actions">
                          <button
                            type="button"
                            className="unit-card-btn"
                            disabled={locked}
                            aria-disabled={locked}
                            onClick={() => startGame(launchTopic, difficulty)}
                          >
                            {dedicated ? "この単元でチャレンジ" : "関連ステージで練習"}
                          </button>
                          {!locked && best != null && (
                            <span className="unit-card-best" title="このステージのベストスコア">
                              ベスト {best} pt
                            </span>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </main>
      )}

      {phase === "quiz" && current && (
        <main className="card">
          {quizHeader}
          <p className="prompt">{current.prompt}</p>
          <div className="choice-grid">
            {current.choices.map((c, i) => {
              let cls = "choice-btn";
              if (picked !== null) {
                if (i === current.correctIndex) cls += " correct";
                else if (i === picked) cls += " wrong";
              }
              return (
                <button key={i} type="button" className={cls} disabled={locked} onClick={() => onChoose(i)}>
                  {c}
                </button>
              );
            })}
          </div>
          {showCorrectCelebrate && (
            <section className="correct-feedback" aria-live="polite">
              <p className="correct-feedback-title">当たり！</p>
              <div className="correct-feedback-body">{current.explanationOnCorrectBrief}</div>
              {current.correctDiagramSvg ? <div className="diagram-slot" dangerouslySetInnerHTML={{ __html: current.correctDiagramSvg }} /> : null}
              <button type="button" className="btn-primary btn-full correct-feedback-next" onClick={proceedFromCorrect}>
                次へ
              </button>
            </section>
          )}
          {showWrongExplain && (
            <section className="wrong-feedback" aria-live="polite">
              <p className="wrong-feedback-title">だいじょうぶ、ここで一緒におさらいしよう</p>
              {hardOnLastHeart && (
                <p className="wrong-feedback-hard-warn" role="status">
                  ♥ は<strong>あと 1 つ</strong>だけ。次のミスでゼロになり、説明を読んだうえで結果へジャンプします。焦らずおさらいしよう。
                </p>
              )}
              {difficulty === "hard" && lives <= 0 && (
                <div className="wrong-feedback-knockout-banner" role="status">
                  <p className="wrong-feedback-knockout-title">ハートゼロ — 撃沈ラウンド</p>
                  <p className="wrong-feedback-knockout-body">
                    ハードモードでは、ここでフィニッシュです。でもこのあと進む問題はなく、結果画面で<strong>ここまでの記録（スコア・XP）</strong>を確認できます。ミスから学んだところは、つぎのチャレで武器になります。
                  </p>
                </div>
              )}
              <p className="wrong-feedback-correct">
                正解は「{current.choices[current.correctIndex]}」です。
              </p>
              <p className="wrong-feedback-lead">
                まちがえても大丈夫です。下は「なぜその答えになるか」を、つまずきやすい順にそろえたおさらいです。
              </p>
              {current.wrongDiagramSvg ? (
                <div className="diagram-slot diagram-slot-wrong" dangerouslySetInnerHTML={{ __html: current.wrongDiagramSvg }} />
              ) : null}
              <div className="wrong-feedback-body">{current.explanationDetailed}</div>
              {!wrongGentlerOpen ? (
                <button type="button" className="btn-soft" onClick={() => setWrongGentlerOpen(true)}>
                  もう少し、やさしく説明してほしい
                </button>
              ) : (
                <div className="wrong-feedback-gentler">
                  <p className="wrong-feedback-gentler-label">さらに、やさしく一歩ずつ</p>
                  <p className="wrong-feedback-gentler-intro">
                    用語が多く感じたら、こちらを先に読んでも大丈夫です。やることだけに分けてあります。
                  </p>
                  {current.explanationGentler.split(/\n\n+/).map((para, i) => (
                    <p key={i} className="wrong-feedback-gentler-p">
                      {para.trim()}
                    </p>
                  ))}
                </div>
              )}
              <button type="button" className="btn-primary btn-full" onClick={proceedFromWrong}>
                {difficulty === "hard" && lives <= 0 ? "結果を見る（ハートゼロ）" : "次へ"}
              </button>
            </section>
          )}
          <div className="row" style={{ marginTop: "0.75rem" }}>
            <button type="button" className="btn-ghost" onClick={() => setShowHint((h) => !h)}>
              💡 {showHint ? "ヒントを隠す" : "ヒント"}
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setPhase("home")}
            >
              ホームへ
            </button>
          </div>
          {showHint && current.hint && <p className="hint">{current.hint}</p>}
          {!showWrongExplain && !showCorrectCelebrate && (
            <details className="glossary glossary-inline">
              <summary>コンボ / XP ってなに？</summary>
              <p>
                <strong>コンボ</strong>は連続せいかいの回数です。つながるほど、つぎに正解したときのスコアボーナスが増えます。ミスで 0 に戻ります。
              </p>
              <p>
                <strong>XP</strong>はプレイの積み重ねですこしずつたまる値で、合計が右上の ⭐ に表示されます。ホームに戻ったタイミングでレベルやバッジが更新されます。
              </p>
            </details>
          )}
        </main>
      )}

      {phase === "result" && (
        <main className={`card ${endedByHardKnockout ? "card--knockout" : ""}`}>
          <div className={`result-hero ${endedByHardKnockout ? "result-hero--knockout" : ""}`}>
            {endedByHardKnockout && (
              <p className="result-knockout-ribbon">
                撃沈終了（ハートゼロ）
              </p>
            )}
            <p className="result-score">{score}</p>
            <p className="result-label">
              {endedByHardKnockout ? "ここまでのスコア（記録済み）" : "このラウンドのスコア"}
            </p>
          </div>
          {endedByHardKnockout && (
            <p className="result-knockout-copy">
              残り<strong>{Math.max(0, QUESTIONS_PER_ROUND - index - 1)}</strong>
              問は未チャレンジ（ハード撃沈時はここまで）。復習しつつ、また ♥ を満タンから挑戦だ。
            </p>
          )}
          <div className="stat-grid">
            <div className="stat">
              {endedByHardKnockout ? "挑戦済み問題" : "せいかい"}
              <strong>
                {endedByHardKnockout ? `${correctCount} / ${index + 1}` : `${correctCount} / ${QUESTIONS_PER_ROUND}`}
              </strong>
            </div>
            <div className="stat">
              最大コンボ
              <strong>{maxCombo}</strong>
            </div>
          </div>
          <div className="row" style={{ marginTop: "1.25rem", justifyContent: "center", gap: "0.65rem" }}>
            <button type="button" className="btn-primary" onClick={() => startGame(topic, difficulty)}>
              もういちど
            </button>
            <button type="button" className="btn-ghost" onClick={finishResult}>
              ホームへ
            </button>
          </div>
        </main>
      )}

      <p className="footer-note">
        問題は自動生成です。学期マップは教科書・自治体で前後しますが、中学2年の主な単元をジャンル別に一通り載せています（連立方程式・証明専用など一部は関連ステージから土台練習）。
      </p>

      {rewardModal && (
        <div className="reward-overlay" role="dialog" aria-modal="true" aria-labelledby="reward-title">
          <div className="reward-modal card">
            <h3 id="reward-title" className="reward-title">
              {rewardModal.leveledUp ? "レベルアップ！" : "おつかれさま！"}
            </h3>
            <p className="reward-xp-line">
              +<strong>{rewardModal.xpGain}</strong> XP
            </p>
            {rewardModal.leveledUp && (
              <p className="reward-level-line">
                Lv.{rewardModal.oldLevel} → Lv.{rewardModal.newLevel}
              </p>
            )}
            {rewardModal.newBadgeIds.length > 0 && (
              <div className="reward-new-badges">
                <p className="reward-new-badges-label">新しいバッジ</p>
                <ul>
                  {rewardModal.newBadgeIds.map((id) => {
                    const b = badgeById(id);
                    if (!b) return null;
                    return (
                      <li key={id}>
                        <span className="reward-badge-emoji" aria-hidden>
                          {b.emoji}
                        </span>{" "}
                        {b.title}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            <button type="button" className="btn-primary btn-full" onClick={() => setRewardModal(null)}>
              つぎへ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
