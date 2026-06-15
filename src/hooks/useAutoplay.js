import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'videohub_autoplay';

export default function useAutoplay() {
  const [enabled, setEnabled] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) !== 'off';
    } catch {
      return true;
    }
  });

  const toggle = useCallback(() => {
    setEnabled(prev => {
      const next = !prev;
      try { localStorage.setItem(STORAGE_KEY, next ? 'on' : 'off'); } catch {}
      return next;
    });
  }, []);

  return { autoplay: enabled, toggle };
}
