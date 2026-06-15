import { useState, useCallback } from 'react';

const STORAGE_KEY = 'videohub_proxy';

export default function useProxy() {
  const [enabled, setEnabled] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'on';
    } catch {
      return false;
    }
  });

  const toggle = useCallback(() => {
    setEnabled(prev => {
      const next = !prev;
      try { localStorage.setItem(STORAGE_KEY, next ? 'on' : 'off'); } catch {}
      return next;
    });
  }, []);

  return { proxy: enabled, toggle };
}
