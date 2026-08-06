import { useEffect, useRef, useState } from "react";

// Keeps a field feeling instant while typing, even though persisting it is
// an async network round trip. The input shows local state immediately;
// the actual save (onCommit) fires after a short pause in typing rather
// than on every keystroke, which is what caused visible lag on fields
// bound directly to a server-echoed value (patch() -> onChanged() -> new
// prop -> re-render, one full round trip behind on every character typed).
export function useDebouncedField(value, onCommit, delay = 500) {
  const [local, setLocal] = useState(value);
  const timerRef = useRef(null);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  function onChange(v) {
    setLocal(v);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      onCommit(v);
    }, delay);
  }

  function flush() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      onCommit(local);
    }
  }

  return [local, onChange, flush];
}
