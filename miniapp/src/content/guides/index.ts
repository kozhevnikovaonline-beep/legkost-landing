import type { Guide } from "../types";
import { CELLULITE, DRY, PELVIC, POSTURE } from "./body";
import { FREE_GUIDES } from "./free";
import { CORTISOL, DESSERTS, SYSTEM_GUIDE } from "./life";
import { MENU14 } from "./menu14";

export const GUIDES: Guide[] = [...FREE_GUIDES, DESSERTS, PELVIC, POSTURE, CELLULITE, CORTISOL, DRY, MENU14, SYSTEM_GUIDE];

export const guideById = (id: string) => GUIDES.find((g) => g.id === id);
