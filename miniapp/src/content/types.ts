/** Блоки контента: из них собраны уроки и гайды. Рендерит components/Blocks.tsx */

export type Block =
  | { t: "h"; text: string }
  | { t: "p"; text: string }
  | { t: "lead"; text: string }
  | { t: "list"; items: string[]; ordered?: boolean }
  | { t: "callout"; tone?: "pink" | "lime" | "warn"; title?: string; text: string }
  | { t: "quote"; text: string; author?: string }
  | { t: "checklist"; id: string; title?: string; items: string[]; result?: { min: number; text: string }[] }
  | { t: "steps"; items: { title: string; text: string }[] }
  | { t: "table"; head: string[]; rows: string[][] }
  | { t: "meals"; title: string; meals: { time: string; title: string; text?: string; kcal?: number }[]; total?: string }
  | { t: "recipe"; title: string; meta?: string; ingredients: string[]; steps: string[] }
  | { t: "exercises"; title?: string; items: { name: string; dose: string; text: string }[] }
  | { t: "image"; src: string; alt: string }
  | { t: "divider" };

export interface Guide {
  id: string;
  title: string;
  subtitle: string;
  /** Слово-фон в шапке, как на сайте */
  bgWord: string;
  emoji: string;
  readMinutes: number;
  cover: string;
  blocks: Block[];
}

export const unsplash = (id: string, w = 720, h?: number) =>
  `https://images.unsplash.com/photo-${id}?w=${w}${h ? `&h=${h}` : ""}&fit=crop&auto=format&q=70`;
