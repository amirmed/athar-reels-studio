import { useEffect, useRef } from 'react';

export type HotkeyCallback = (e: KeyboardEvent) => void;

export interface HotkeyOptions {
  enabled?: boolean;
  enableOnInputs?: boolean;
  preventDefault?: boolean;
}

/**
 * Custom hook to bind single or combo keyboard shortcuts cleanly.
 * Examples:
 *   useHotkeys('Escape', () => onClose(), { enabled: isOpen });
 *   useHotkeys(['ctrl+z', 'meta+z'], () => handleUndo());
 *   useHotkeys('Space', () => togglePlay());
 */
export function useHotkeys(
  keyCombo: string | string[],
  callback: HotkeyCallback,
  options: HotkeyOptions = {}
): void {
  const { enabled = true, enableOnInputs = false, preventDefault = true } = options;
  const callbackRef = useRef<HotkeyCallback>(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!enabled) return;

    const combos = (Array.isArray(keyCombo) ? keyCombo : [keyCombo]).map((k) =>
      k.toLowerCase().trim()
    );

    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in an input/textarea/contenteditable
      if (!enableOnInputs) {
        const target = e.target as HTMLElement | null;
        if (
          target?.tagName === 'INPUT' ||
          target?.tagName === 'TEXTAREA' ||
          target?.isContentEditable
        ) {
          return;
        }
      }

      const isCtrl = e.ctrlKey || e.metaKey;
      const isShift = e.shiftKey;
      const isAlt = e.altKey;
      const pressedKey = e.key.toLowerCase();
      const code = e.code.toLowerCase();

      for (const combo of combos) {
        const parts = combo.split('+').map((p) => p.trim());
        const wantsCtrl = parts.includes('ctrl') || parts.includes('meta') || parts.includes('cmd');
        const wantsShift = parts.includes('shift');
        const wantsAlt = parts.includes('alt');
        const mainKey = parts.find(
          (p) => !['ctrl', 'meta', 'cmd', 'shift', 'alt'].includes(p)
        );

        if (!mainKey) continue;

        const ctrlMatches = wantsCtrl ? isCtrl : !isCtrl;
        const shiftMatches = wantsShift ? isShift : !isShift;
        const altMatches = wantsAlt ? isAlt : !isAlt;

        const keyMatches =
          pressedKey === mainKey ||
          code === mainKey ||
          (mainKey === 'space' && (code === 'space' || pressedKey === ' ')) ||
          (mainKey === 'esc' && (pressedKey === 'escape' || code === 'escape')) ||
          (mainKey === 'escape' && (pressedKey === 'escape' || code === 'escape')) ||
          (mainKey === 'enter' && (pressedKey === 'enter' || code === 'enter'));

        if (ctrlMatches && shiftMatches && altMatches && keyMatches) {
          if (preventDefault) {
            e.preventDefault();
          }
          callbackRef.current(e);
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [keyCombo, enabled, enableOnInputs, preventDefault]);
}
