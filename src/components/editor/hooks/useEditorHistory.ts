import { useState, useRef, useCallback, useEffect } from 'react';
import { TextSettings, AudioSettings } from '../../../types';

export interface EditorSnapshot {
  textSettings: TextSettings;
  audioSettings: AudioSettings;
  backgroundFile?: string;
  backgroundOpacity: number;
  watermark: string;
  reciterId: string;
  surahNumber: number;
  fromAyah: number;
  toAyah: number;
  transition: string;
  videoEffect: string;
  showTranslation: boolean;
  showTafsir: boolean;
  aspectRatio: '9:16' | '1:1' | '16:9';
  activeTemplateId?: string;
}

interface UseEditorHistoryProps {
  onApplySnapshot: (snapshot: EditorSnapshot) => void;
  enabled?: boolean;
  maxHistory?: number;
}

export function useEditorHistory({ onApplySnapshot, enabled = true }: UseEditorHistoryProps) {
  const historyRef = useRef<EditorSnapshot[]>([]);
  const currentIndexRef = useRef<number>(-1);
  const debounceTimerRef = useRef<any>(null);
  const isUndoingRedoingRef = useRef<boolean>(false);

  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [historyCount, setHistoryCount] = useState(0);

  const updateFlags = useCallback(() => {
    setCanUndo(currentIndexRef.current > 0);
    setCanRedo(currentIndexRef.current < historyRef.current.length - 1);
    setHistoryCount(historyRef.current.length);
  }, []);

  /**
   * Record a new state into the history stack
   */
  const pushState = useCallback(
    (snapshot: EditorSnapshot, immediate = false) => {
      if (isUndoingRedoingRef.current) return;

      const commit = () => {
        const history = historyRef.current;
        const curIdx = currentIndexRef.current;

        // Deep clone snapshot
        const clone = JSON.parse(JSON.stringify(snapshot));

        // Don't push identical snapshot
        if (curIdx >= 0 && JSON.stringify(history[curIdx]) === JSON.stringify(clone)) {
          return;
        }

        // Truncate future history if we were in the middle of stack
        const newHistory = history.slice(0, curIdx + 1);
        newHistory.push(clone);

        // Limit max 50 snapshots
        if (newHistory.length > 50) {
          newHistory.shift();
        }

        historyRef.current = newHistory;
        currentIndexRef.current = newHistory.length - 1;
        updateFlags();
      };

      if (immediate) {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        commit();
      } else {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(commit, 350);
      }
    },
    [updateFlags]
  );

  /**
   * Undo to previous state
   */
  const undo = useCallback(() => {
    if (currentIndexRef.current > 0) {
      isUndoingRedoingRef.current = true;
      currentIndexRef.current -= 1;
      const targetState = historyRef.current[currentIndexRef.current];
      onApplySnapshot(JSON.parse(JSON.stringify(targetState)));
      updateFlags();
      setTimeout(() => {
        isUndoingRedoingRef.current = false;
      }, 50);
      return true;
    }
    return false;
  }, [onApplySnapshot, updateFlags]);

  /**
   * Redo to next state
   */
  const redo = useCallback(() => {
    if (currentIndexRef.current < historyRef.current.length - 1) {
      isUndoingRedoingRef.current = true;
      currentIndexRef.current += 1;
      const targetState = historyRef.current[currentIndexRef.current];
      onApplySnapshot(JSON.parse(JSON.stringify(targetState)));
      updateFlags();
      setTimeout(() => {
        isUndoingRedoingRef.current = false;
      }, 50);
      return true;
    }
    return false;
  }, [onApplySnapshot, updateFlags]);

  // Keyboard shortcuts (Ctrl+Z, Ctrl+Y, Ctrl+Shift+Z)
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when focused in text inputs or textareas
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      ) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (modifier && !e.altKey) {
        if (e.key === 'z' || e.key === 'Z') {
          if (e.shiftKey) {
            // Ctrl+Shift+Z -> Redo
            e.preventDefault();
            redo();
          } else {
            // Ctrl+Z -> Undo
            e.preventDefault();
            undo();
          }
        } else if (e.key === 'y' || e.key === 'Y') {
          // Ctrl+Y -> Redo
          e.preventDefault();
          redo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [enabled, undo, redo]);

  const clearHistory = useCallback(() => {
    historyRef.current = [];
    currentIndexRef.current = -1;
    updateFlags();
  }, [updateFlags]);

  return {
    pushState,
    undo,
    redo,
    canUndo,
    canRedo,
    historyCount,
    clearHistory,
  };
}
