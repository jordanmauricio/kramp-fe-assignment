import { useEffect, useRef, useState } from 'react';

// T5: Custom debounce implementation — yet lodash is already in package.json.
// Either use lodash.debounce (the dep is already paid for) or remove lodash and keep this hook.
// Having both is the worst outcome: extra bundle weight AND custom code to maintain.
//
// Additionally, this hook is imported in Header.tsx but never actually called there —
// the search fires on every keystroke with no debounce at all (P2).

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timerRef.current);
    };
  }, [value, delay]);

  return debouncedValue;
}
