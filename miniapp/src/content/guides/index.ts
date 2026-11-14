import type { Guide } from "../types";
import { CELLULITE, PELVIC, POSTURE } from "./body";
import { FREE_GUIDES } from "./free";
import { CORTISOL, DESSERTS } from "./life";
import { MENU14 } from "./menu14";

export const GUIDES: Guide[] = [...FREE_GUIDES, DESSERTS, PELVIC, POSTURE, CELLULITE, CORTISOL, MENU14];

export const guideById = (id: string) => GUIDES.find((g) => g.id === id);
