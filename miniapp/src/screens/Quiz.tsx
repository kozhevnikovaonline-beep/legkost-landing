import { useState } from "react";
import { TASK_REWARDS } from "../../shared/economy.ts";
import { guideById } from "../content/guides";
import { productById } from "../content/products";
import { quizById, scoreQuiz, type QuizResult } from "../content/quizzes";
import { Empty, MainAction, Progress, SubBar } from "../components/ui";
import { IconChevron } from "../components/Icons";
import { appStore, useUserState } from "../store/appStore";
import { navigate } from "../lib/router";
import { haptic } from "../telegram/sdk";

export function Quiz({ id }: { id: string }) {
  const s = useUserState();
  const quiz = quizById(id);
  const saved = quiz?.results.find((r) => r.id === s.progress.quizResults[id]);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<QuizResult | null>(saved ?? null);
  const [busy, setBusy] = useState(false);

  if (!quiz) {
    return (
      <main className="screen screen--sub">
        <SubBar title="Тест" />
        <Empty icon="🧭" title="Тест не найден" text="Попробуйте открыть его с главной." />
      </main>
    );
  }

  const step = answers.length;
  const q = quiz.questions[step];

  const choose = async (idx: number) => {
    haptic.select();
    const next = [...answers, idx];
    setAnswers(next);
    if (next.length < quiz.questions.length) return;
    const r = scoreQuiz(quiz, next);
    setBusy(true);
    const ok = await appStore.run({ type: "quiz", id: quiz.id, result: r.id });
    if (ok && !s.progress.tasksClaimed.includes(quiz.task)) {
      await appStore.run({ type: "task", id: quiz.task }, (rw) => `+${rw} лепестков за тест`);
    }
    setBusy(false);
    setResult(r);
  };

  const restart = () => {
    setAnswers([]);
    setResult(null);
  };

  if (result) {
    return (
      <main className="screen screen--sub">
        <SubBar title={quiz.title} />
        <div className="card card--ink grain" style={{ textAlign: "center", padding: "28px 20px" }}>
          <div style={{ fontSize: 52 }}>{result.emoji}</div>
          <div className="eyebrow" style={{ justifyContent: "center", marginTop: 8 }}>Ваш результат</div>
          <h1 className="h1">{result.title}</h1>
        </div>
        <p style={{ marginTop: 18, fontSize: 16 }}>{result.text}</p>
        <section className="section">
          <div className="eyebrow">Что делать</div>
          <div className="stack">
            {result.tips.map((t, i) => (
              <div className="step" key={i}>
                <span className="step__n">{String(i + 1).padStart(2, "0")}</span>
                <p style={{ color: "var(--text)" }}>{t}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="section">
          <div className="eyebrow">Рекомендую вам</div>
          <div className="stack">
            {result.recommend.map((r) => {
              const isGuide = guideById(r.guideOrProduct) && !productById(r.guideOrProduct);
              const emoji = guideById(r.guideOrProduct)?.emoji ?? productById(r.guideOrProduct)?.emoji ?? "💗";
              return (
                <button
                  key={r.guideOrProduct}
                  className="card card--pressable row"
                  style={{ textAlign: "left" }}
                  onClick={() => navigate(isGuide ? { name: "guide", id: r.guideOrProduct } : { name: "product", id: r.guideOrProduct })}
                >
                  <span className="task__icon">{emoji}</span>
                  <b className="grow">{r.label}</b>
                  <IconChevron width={18} />
                </button>
              );
            })}
          </div>
        </section>
        <button className="btn btn-ghost btn-block" style={{ marginTop: 18 }} onClick={restart}>
          Пройти ещё раз
        </button>
        <MainAction text={quiz.id === "type" ? "Подобрать мой формат" : "Смотреть программу"} onClick={() => navigate(quiz.id === "type" ? { name: "quiz", id: "format" } : { name: "product", id: result.recommend[0]!.guideOrProduct }, { replace: true })} />
      </main>
    );
  }

  return (
    <main className="screen screen--sub">
      <SubBar title={quiz.title} />
      {step === 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <p>{quiz.intro}</p>
          {!s.progress.tasksClaimed.includes(quiz.task) && <span className="chip" style={{ marginTop: 10 }}>+{TASK_REWARDS[quiz.task]} лепестков за прохождение</span>}
        </div>
      )}
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
        <span className="muted small" style={{ fontWeight: 700 }}>Вопрос {Math.min(step + 1, quiz.questions.length)} из {quiz.questions.length}</span>
        {step > 0 && (
          <button className="link-btn" onClick={() => setAnswers(answers.slice(0, -1))}>
            ← Назад
          </button>
        )}
      </div>
      <Progress value={step / quiz.questions.length} />
      {q && (
        <div key={step} style={{ animation: "screenIn .3s" }}>
          <h2 className="h2" style={{ margin: "22px 0 16px" }}>{q.q}</h2>
          <div className="stack">
            {q.options.map((o, i) => (
              <button key={i} className="quiz-opt" disabled={busy} onClick={() => void choose(i)}>
                {o.text}
              </button>
            ))}
          </div>
        </div>
      )}
      {busy && <div className="state" style={{ minHeight: 200 }}><span className="spinner" style={{ justifySelf: "center", color: "var(--pink)" }} /></div>}
    </main>
  );
}
