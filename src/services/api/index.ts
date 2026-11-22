// src/services/api/index.ts
// The UI reaches the backend only through this module (guarded by guard.test.ts).
export { ApiProvider, useApi } from "./context";
export * from "./errors";
export type { FieldsApi } from "./FieldsApi";
export { HttpFieldsApi } from "./http/HttpFieldsApi";
export * from "./types";
