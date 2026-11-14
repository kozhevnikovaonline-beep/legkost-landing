/** Квизы: «Ваш тип набора веса» (из сценария бота) и «Какой формат мне подходит» (сегментация воронки) */

export interface QuizOption {
  text: string;
  /** Баллы результатам */
  score: Record<string, number>;
}

export interface QuizResult {
  id: string;
  title: string;
  emoji: string;
  text: string;
  tips: string[];
  /** Рекомендуемые материал/продукт */
  recommend: { guideOrProduct: string; label: string }[];
}

export interface Quiz {
  id: "type" | "format";
  title: string;
  intro: string;
  task: "quiz-type" | "quiz-format";
  questions: { q: string; options: QuizOption[] }[];
  results: QuizResult[];
}

export const QUIZZES: Quiz[] = [
  {
    id: "type",
    title: "Ваш тип набора веса",
    intro: "5 вопросов — 1 минута. Узнаете, что держит вес именно у вас, и с чего начать.",
    task: "quiz-type",
    questions: [
      {
        q: "Где в первую очередь копится лишнее?",
        options: [
          { text: "Живот и бока", score: { stress: 2, hormonal: 1 } },
          { text: "Бёдра и ноги, к вечеру тяжесть", score: { edema: 2 } },
          { text: "Равномерно по всему телу", score: { sweet: 2 } },
          { text: "Изменилось после родов / с возрастом", score: { hormonal: 2 } },
        ],
      },
      {
        q: "Как вы чувствуете себя утром?",
        options: [
          { text: "Отёкшее лицо, кольца туго", score: { edema: 2 } },
          { text: "Разбитая, будто не спала", score: { stress: 2 } },
          { text: "Нормально, но сразу хочется сладкого к кофе", score: { sweet: 2 } },
          { text: "По-разному, зависит от дня цикла", score: { hormonal: 2 } },
        ],
      },
      {
        q: "Когда чаще всего срываетесь?",
        options: [
          { text: "Вечером, после тяжёлого дня", score: { stress: 2, sweet: 1 } },
          { text: "Когда долго не ела — «съедаю всё»", score: { sweet: 2 } },
          { text: "Перед месячными", score: { hormonal: 2 } },
          { text: "На солёное — чипсы, сыр, колбаса", score: { edema: 2 } },
        ],
      },
      {
        q: "Сколько вы спите?",
        options: [
          { text: "Меньше 6 часов", score: { stress: 2 } },
          { text: "6–7 часов, часто просыпаюсь", score: { stress: 1, hormonal: 1 } },
          { text: "7–8 часов", score: { sweet: 1, edema: 1 } },
        ],
      },
      {
        q: "Сколько воды вы пьёте?",
        options: [
          { text: "Почти не пью, в основном чай и кофе", score: { edema: 2 } },
          { text: "Около литра", score: { edema: 1, sweet: 1 } },
          { text: "1,5–2 литра", score: { hormonal: 1, stress: 1 } },
        ],
      },
    ],
    results: [
      {
        id: "stress",
        title: "Стрессовый тип",
        emoji: "🌙",
        text: "Ваш вес держит кортизол: недосып, напряжение и, возможно, слишком жёсткие ограничения. Тело в режиме «осада» — копит жир на животе и воду.",
        tips: ["Сон 7+ часов — важнее любой диеты для вас", "Завтрак с белком в течение часа после пробуждения", "Прогулки вместо изнуряющего кардио"],
        recommend: [{ guideOrProduct: "guide-cortisol", label: "Гайд «Кортизол под контролем»" }],
      },
      {
        id: "edema",
        title: "Отёчный тип",
        emoji: "💧",
        text: "Часть вашего «веса» — вода. Соль, мало воды и движения — и жир прячется под отёками. Хорошая новость: первые −1,5–2 кг уходят уже за неделю.",
        tips: ["1,5–2 л воды в день, по стакану каждые 2 часа", "Меньше колбас, соусов и снеков", "«Ноги на стену» 5 минут вечером"],
        recommend: [
          { guideOrProduct: "free-edema", label: "Чек-лист «Минус отёки»" },
          { guideOrProduct: "marathon-edema", label: "Марафон «Минус отёки за 7 дней»" },
        ],
      },
      {
        id: "sweet",
        title: "Сладкий тип",
        emoji: "🍓",
        text: "Вашим весом управляют сахарные качели: днём мало еды — вечером непреодолимая тяга. Это не слабость воли, а физиология.",
        tips: ["Белок в каждом приёме пищи", "Сладкое — только после еды", "Не пропускайте завтрак и обед"],
        recommend: [
          { guideOrProduct: "free-plate", label: "Гайд «Тарелка»" },
          { guideOrProduct: "guide-desserts", label: "Гайд «ПП-десерты»" },
        ],
      },
      {
        id: "hormonal",
        title: "Гормональный тип",
        emoji: "🌸",
        text: "Вес меняется вместе с гормонами: цикл, роды, ГВ или 40+. Обычные диеты здесь не работают — нужен план, который учитывает ваше состояние.",
        tips: ["Больше белка и клетчатки, жиры не урезайте", "Силовые 2–3 раза в неделю", "Анализы — вместе с врачом"],
        recommend: [
          { guideOrProduct: "bonus-hormones", label: "Эфир «Питание при гормональных сбоях»" },
          { guideOrProduct: "system", label: "Программа «СИСТЕМА»" },
        ],
      },
    ],
  },
  {
    id: "format",
    title: "Какой формат мне подходит",
    intro: "6 вопросов — и Алёна подскажет, в каком формате вы быстрее придёте к результату.",
    task: "quiz-format",
    questions: [
      {
        q: "Какая у вас цель?",
        options: [
          { text: "Минус 3–5 кг и привести себя в тонус", score: { group: 2 } },
          { text: "Минус 5–10 кг и больше", score: { personal: 2, system: 1 } },
          { text: "Вес стоит, хотя пробовала всё", score: { system: 3 } },
          { text: "Восстановиться после родов", score: { personal: 2, system: 1 } },
        ],
      },
      {
        q: "Сколько вам лет?",
        options: [
          { text: "До 30", score: { group: 1 } },
          { text: "30–40", score: { personal: 1, group: 1 } },
          { text: "40+", score: { system: 2 } },
        ],
      },
      {
        q: "Есть ли особенности здоровья?",
        options: [
          { text: "Нет, всё в порядке", score: { group: 2 } },
          { text: "Роды или КС в последние 2 года, ГВ", score: { personal: 2 } },
          { text: "Гормональный сбой, щитовидка, высокий кортизол", score: { system: 3 } },
          { text: "Сильные отёки или целлюлит", score: { system: 2 } },
        ],
      },
      {
        q: "Сколько времени в день готовы уделять?",
        options: [
          { text: "20–30 минут", score: { group: 1, personal: 1 } },
          { text: "Очень мало, график непредсказуемый", score: { personal: 2 } },
          { text: "Сколько нужно — хочу наконец результат", score: { system: 2 } },
        ],
      },
      {
        q: "Как вам комфортнее?",
        options: [
          { text: "В компании — люблю чат и поддержку девочек", score: { group: 3 } },
          { text: "Лично, без публичности и чужих историй", score: { personal: 3 } },
          { text: "Чтобы эксперт сам всё продумал под меня", score: { system: 3 } },
        ],
      },
      {
        q: "Какой бюджет комфортен на старт?",
        options: [
          { text: "До 2 000 ₽ в месяц", score: { group: 3 } },
          { text: "До 4 000 ₽ в месяц", score: { personal: 2 } },
          { text: "Готова вложиться в точечный план", score: { system: 2 } },
        ],
      },
    ],
    results: [
      {
        id: "group",
        title: "Групповая программа",
        emoji: "👯‍♀️",
        text: "Вам важны поддержка и компания. В группе вы получите готовый план, эфиры и чат, где никто не даст «слиться» на третий день.",
        tips: ["Старт потока — раз в месяц", "Оплата за группу засчитывается при переходе в 1:1 или «СИСТЕМУ»"],
        recommend: [{ guideOrProduct: "group", label: "Групповая программа" }],
      },
      {
        id: "personal",
        title: "Личное сопровождение 1:1",
        emoji: "🤝",
        text: "Вам подойдёт личная работа: без марафонов и чужих историй, только вы и Алёна. План подстраивается под ваш график, детей и самочувствие.",
        tips: ["Ответы без ограничений по времени", "Подходит мамам после родов и КС"],
        recommend: [{ guideOrProduct: "personal", label: "Личное сопровождение 1:1" }],
      },
      {
        id: "system",
        title: "Программа «СИСТЕМА»",
        emoji: "💎",
        text: "Если сотни диет не помогали, дело в деталях: гормоны, кортизол, отёки. «СИСТЕМА» — точечный план под вас на 31 день с ежедневной проверкой.",
        tips: ["Учитываем возраст, здоровье, гормоны, ритм жизни", "5 гайдов в подарок внутри программы"],
        recommend: [{ guideOrProduct: "system", label: "Программа «СИСТЕМА»" }],
      },
    ],
  },
];

export const quizById = (id: string) => QUIZZES.find((q) => q.id === id);

export function scoreQuiz(quiz: Quiz, answers: number[]): QuizResult {
  const totals: Record<string, number> = {};
  answers.forEach((a, i) => {
    const opt = quiz.questions[i]?.options[a];
    if (!opt) return;
    for (const [k, v] of Object.entries(opt.score)) totals[k] = (totals[k] ?? 0) + v;
  });
  // При равенстве побеждает результат, который стоит раньше в списке
  return quiz.results.reduce((best, r) => ((totals[r.id] ?? 0) > (totals[best.id] ?? 0) ? r : best), quiz.results[0]!);
}
