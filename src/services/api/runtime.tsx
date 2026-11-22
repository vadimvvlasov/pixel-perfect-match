import { useEffect, useState, type ReactNode } from "react";
import { ApiProvider } from "./context";
import type { FieldsApi } from "./FieldsApi";
import { isMock } from "./mode";
import { ru } from "@/i18n/ru";

/** Wraps the app in ApiProvider with the browser mock when the mock is active; otherwise HTTP (the context default). */
export function ApiRuntime({ children }: { children: ReactNode }) {
  const [api, setApi] = useState<FieldsApi | null>(null);
  const [ready, setReady] = useState(!isMock());
  useEffect(() => {
    if (!isMock()) return;
    let active = true;
    void (async () => {
      const { BrowserMockFieldsApi } = await import("./mock/BrowserMockFieldsApi");
      const instance = await BrowserMockFieldsApi.create(
        Date.now,
        new URLSearchParams(window.location.search).get("scenario") ?? "default",
        300,
        window.sessionStorage,
      );
      if (active) {
        setApi(instance);
        setReady(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);
  if (!ready) return <div className="app-loading">{ru.loading}</div>;
  return api ? <ApiProvider api={api}>{children}</ApiProvider> : <>{children}</>;
}
