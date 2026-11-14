import { config } from "../config";
import { createHttpApi } from "./httpApi";
import { createMockApi } from "./mockApi";
import type { Api } from "./types";

export const api: Api = config.apiUrl ? createHttpApi(config.apiUrl) : createMockApi();
export * from "./types";
