import { createContext, type ReactNode, useContext } from "react";
import type { FieldsApi } from "./FieldsApi";
import { HttpFieldsApi } from "./http/HttpFieldsApi";

const ApiContext = createContext<FieldsApi>(new HttpFieldsApi());

/** Gives the components below another implementation (a mock, a test double); without it they use HTTP. */
export function ApiProvider({ api, children }: { api: FieldsApi; children: ReactNode }) {
  return <ApiContext.Provider value={api}>{children}</ApiContext.Provider>;
}

/** The backend, for components. Stable for the provider's lifetime. */
export const useApi = (): FieldsApi => useContext(ApiContext);
