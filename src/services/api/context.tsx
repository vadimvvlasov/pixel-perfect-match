import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { FieldsApi } from './FieldsApi';
import { API_MODE } from '@/config';
import { ru } from '@/i18n/ru';
const Context = createContext<FieldsApi | null>(null);
export function ApiProvider({ children, api }: { children: ReactNode; api: FieldsApi }) { return <Context.Provider value={api}>{children}</Context.Provider>; }
export function useApi() { const api = useContext(Context); if (!api) throw new Error('ApiProvider required'); return api; }
export function ApiRuntime({ children }: { children: ReactNode }) {
  const [api, setApi] = useState<FieldsApi | null>(null);
  useEffect(() => { let active = true; const load = async () => { const instance = API_MODE === 'mock' ? new (await import('./mock/MockFieldsApi')).MockFieldsApi(Date.now, new URLSearchParams(window.location.search).get('scenario') ?? 'default') : new (await import('./http/HttpFieldsApi')).HttpFieldsApi(); if (active) setApi(instance); }; void load(); return () => { active = false; }; }, []);
  return api ? <ApiProvider api={api}>{children}</ApiProvider> : <div className="app-loading">{ru.loading}</div>;
}
