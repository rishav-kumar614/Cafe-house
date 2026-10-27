import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api.js';

/** Fetches an admin endpoint, with reload and optional polling. */
export function useAdminData(path, { onAuthError, pollMs } = {}) {
  const [state, setState] = useState({ status: 'loading', data: null, error: null });
  const authRef = useRef(onAuthError);
  authRef.current = onAuthError;

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setState((s) => ({ ...s, status: s.data ? 'refreshing' : 'loading' }));
      try {
        const data = await api(path);
        setState({ status: 'ready', data, error: null });
      } catch (err) {
        authRef.current?.(err);
        setState((s) => ({ ...s, status: 'error', error: err.message }));
      }
    },
    [path]
  );

  useEffect(() => {
    load();
    if (!pollMs) return undefined;
    const t = setInterval(() => document.visibilityState === 'visible' && load(true), pollMs);
    return () => clearInterval(t);
  }, [load, pollMs]);

  return { ...state, reload: load, setData: (fn) => setState((s) => ({ ...s, data: fn(s.data) })) };
}
