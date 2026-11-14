/** Короткие названия продуктов для счетов (сервер не тянет React-контент клиента) */
const TITLES: Record<string, string> = {
  system: "Программа «СИСТЕМА»",
  personal: "Сопровождение 1:1",
  group: "Групповая программа",
  club: "Клуб «ЛЁГКОСТЬ»",
  "marathon-edema": "Марафон «Минус отёки»",
  "course-abs": "Курс «Плоский живот»",
  "course-dry": "Курс «Сушка»",
  "course-postpartum": "Курс «Тело после родов»",
  "course-hormones": "Курс «Гормоны 40+»",
  "guide-desserts": "Гайд «ПП-десерты»",
  "guide-pelvic": "Гайд «Тазовое дно»",
  "guide-posture": "Гайд «Осанка и живот»",
  "guide-cellulite": "Гайд «Гладкая кожа»",
  "guide-cortisol": "Гайд «Кортизол»",
  "guide-dry": "Гайд «Сушка»",
  "guide-menu14": "Меню на 14 дней",
  "guide-system": "Гайд «СИСТЕМА»",
};

export const productTitle = (id: string) => TITLES[id] ?? "ЛЁГКОСТЬ";
