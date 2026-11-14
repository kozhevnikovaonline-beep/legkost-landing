import { useEffect, useRef } from "react";
import { ErrorBoundary, TabBar, Toasts } from "./components/Shell";
import { Skeleton } from "./components/ui";
import { appStore, useApp } from "./store/appStore";
import { claimableTasks, hasDailyReward } from "./store/selectors";
import { navigate, TABS, useRoute, type Route, type Tab } from "./lib/router";
import { getStartParam } from "./telegram/sdk";
import { lessonById } from "./content/lessons";
import { guideById } from "./content/guides";
import { productById } from "./content/products";
import { Onboarding } from "./screens/Onboarding";
import { Home } from "./screens/Home";
import { Lessons } from "./screens/Lessons";
import { Lesson } from "./screens/Lesson";
import { Tap } from "./screens/Tap";
import { Shop } from "./screens/Shop";
import { Product } from "./screens/Product";
import { Guide } from "./screens/Guide";
import { Quiz } from "./screens/Quiz";
import { Profile } from "./screens/Profile";
import { Materials } from "./screens/Materials";
import { Author } from "./screens/Author";

/** Глубокие ссылки: t.me/<bot>/<app>?startapp=lesson-2 | guide-cortisol | system | shop | tap */
function routeFromStartParam(p: string | null): Route | null {
  if (!p || p.startsWith("ref_")) return null;
  if ((TABS as string[]).includes(p)) return { name: p as Tab };
  if (lessonById(p)) return { name: "lesson", id: p };
  if (productById(p)) return { name: "product", id: p };
  if (guideById(p)) return { name: "guide", id: p };
  if (p === "quiz-type" || p === "quiz-format") return { name: "quiz", id: p.slice(5) };
  return null;
}

function Screen({ route }: { route: Route }) {
  switch (route.name) {
    case "home":
      return <Home />;
    case "lessons":
      return <Lessons />;
    case "tap":
      return <Tap />;
    case "shop":
      return <Shop />;
    case "profile":
      return <Profile />;
    case "lesson":
      return <Lesson id={route.id} />;
    case "guide":
      return <Guide id={route.id} />;
    case "product":
      return <Product id={route.id} />;
    case "quiz":
      return <Quiz id={route.id} />;
    case "materials":
      return <Materials />;
    case "author":
      return <Author />;
  }
}

function Loading() {
  return (
    <main className="screen" aria-busy="true" aria-label="Загрузка">
      <div className="topbar">
        <Skeleton h={34} r={20} />
      </div>
      <div className="stack">
        <Skeleton h={60} />
        <Skeleton h={250} r={28} />
        <Skeleton h={140} />
        <Skeleton h={80} />
      </div>
    </main>
  );
}

export function App() {
  const { status, error, state } = useApp();
  const route = useRoute();
  const deepLinked = useRef(false);

  useEffect(() => {
    void appStore.init();
  }, []);

  useEffect(() => {
    if (status !== "ready" || !state?.progress.onboarded || deepLinked.current) return;
    deepLinked.current = true;
    const target = routeFromStartParam(getStartParam());
    if (target) navigate(target);
  }, [status, state?.progress.onboarded]);

  if (status === "loading" || (status === "ready" && !state)) return <Loading />;

  if (status === "error") {
    return (
      <div className="state">
        <div className="state__icon">📡</div>
        <h1 className="h2">Не удалось загрузить</h1>
        <p className="muted">{error}</p>
        <button className="btn btn-primary" onClick={() => void appStore.init()}>
          Попробовать снова
        </button>
      </div>
    );
  }

  const s = state!;
  const isTab = (TABS as string[]).includes(route.name);

  return (
    <div className="app">
      <ErrorBoundary>
        {!s.progress.onboarded ? (
          <Onboarding />
        ) : (
          <>
            <Screen key={"id" in route ? `${route.name}/${route.id}` : route.name} route={route} />
            {isTab && (
              <TabBar
                active={route.name as Tab}
                dots={{ tap: claimableTasks(s).length > 0 || hasDailyReward(s), lessons: s.progress.lessonsCompleted.length < 3 }}
              />
            )}
          </>
        )}
      </ErrorBoundary>
      <Toasts />
    </div>
  );
}
