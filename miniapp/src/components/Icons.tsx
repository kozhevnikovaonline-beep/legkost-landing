import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const base = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", viewBox: "0 0 24 24" } as const;

/** Лепесток — фирменный знак (как на логотипе сайта) */
export const FeatherGlyph = (p: P) => (
  <svg viewBox="0 0 64 64" fill="none" stroke="#fff" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...p}>
    <path d="M17 47c0-15 9-25 29-27-2 17-12 26-29 27zM17 47l12-12" />
  </svg>
);

export const IconHome = (p: P) => (
  <svg {...base} {...p} aria-hidden>
    <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />
  </svg>
);
export const IconPlay = (p: P) => (
  <svg {...base} {...p} aria-hidden>
    <rect x="3" y="4" width="18" height="16" rx="4" />
    <path d="m10 9 5 3-5 3z" fill="currentColor" />
  </svg>
);
export const IconBag = (p: P) => (
  <svg {...base} {...p} aria-hidden>
    <path d="M5 8h14l-1 12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1z" />
    <path d="M9 8V6a3 3 0 0 1 6 0v2" />
  </svg>
);
export const IconUser = (p: P) => (
  <svg {...base} {...p} aria-hidden>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
  </svg>
);
export const IconBack = (p: P) => (
  <svg {...base} {...p} aria-hidden>
    <path d="M15 18 9 12l6-6" />
  </svg>
);
export const IconChevron = (p: P) => (
  <svg {...base} {...p} aria-hidden>
    <path d="m9 18 6-6-6-6" />
  </svg>
);
export const IconCheck = (p: P) => (
  <svg {...base} strokeWidth={3} {...p} aria-hidden>
    <path d="m5 12 5 5 9-10" />
  </svg>
);
export const IconLock = (p: P) => (
  <svg {...base} {...p} aria-hidden>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);
export const IconPlayFill = (p: P) => (
  <svg viewBox="0 0 24 24" fill="#fff" {...p} aria-hidden>
    <path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5z" />
  </svg>
);
export const IconShare = (p: P) => (
  <svg {...base} {...p} aria-hidden>
    <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v14" />
  </svg>
);
