import { describe, it, expect } from 'vitest';
import { EditorSnapshot } from '../components/editor/hooks/useEditorHistory';

const createDummySnapshot = (version: number): EditorSnapshot => ({
  textSettings: {
    textColor: `#${version}${version}${version}${version}${version}${version}`,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    bgColor: '#000000',
    bgOpacity: 0.5,
    fontFamily: 'Amiri',
    position: 'center',
    translationFontSize: 16,
    translationColor: '#ffffff',
  },
  audioSettings: {
    recitationVolume: 100,
    fadeIn: true,
    fadeOut: true,
    fadeDuration: 0.5,
    backgroundVolume: 20,
    ambientSoundVolume: 20,
    enable8DAudio: false,
    eightDSpeed: 0.1,
    eightDDepth: 80,
    eightDStyle: 'orbit360',
    ambientSoundId: 'none',
  },
  backgroundOpacity: version * 0.1,
  watermark: `test_${version}`,
  reciterId: 'mishari',
  surahNumber: 1,
  fromAyah: 1,
  toAyah: version,
  transition: 'fade',
  videoEffect: 'none',
  showTranslation: true,
  showTafsir: false,
  aspectRatio: '9:16',
});

// Pure model of the history stack logic used in useEditorHistory
class HistoryStackModel {
  private history: EditorSnapshot[] = [];
  private currentIndex: number = -1;

  public pushState(snapshot: EditorSnapshot) {
    const clone = JSON.parse(JSON.stringify(snapshot));
    if (this.currentIndex >= 0 && JSON.stringify(this.history[this.currentIndex]) === JSON.stringify(clone)) {
      return;
    }
    const newHistory = this.history.slice(0, this.currentIndex + 1);
    newHistory.push(clone);
    if (newHistory.length > 50) {
      newHistory.shift();
    }
    this.history = newHistory;
    this.currentIndex = newHistory.length - 1;
  }

  public undo(): EditorSnapshot | null {
    if (this.currentIndex > 0) {
      this.currentIndex -= 1;
      return JSON.parse(JSON.stringify(this.history[this.currentIndex]));
    }
    return null;
  }

  public redo(): EditorSnapshot | null {
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex += 1;
      return JSON.parse(JSON.stringify(this.history[this.currentIndex]));
    }
    return null;
  }

  public get canUndo(): boolean {
    return this.currentIndex > 0;
  }

  public get canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  public get count(): number {
    return this.history.length;
  }

  public get current(): EditorSnapshot | null {
    return this.currentIndex >= 0 ? this.history[this.currentIndex] : null;
  }
}

describe('Editor History Stack Logic', () => {
  it('correctly tracks single-step undo and redo transitions', () => {
    const stack = new HistoryStackModel();

    stack.pushState(createDummySnapshot(1));
    stack.pushState(createDummySnapshot(2));
    stack.pushState(createDummySnapshot(3));

    expect(stack.count).toBe(3);
    expect(stack.canUndo).toBe(true);
    expect(stack.canRedo).toBe(false);
    expect(stack.current?.toAyah).toBe(3);

    // 1st Undo -> returns version 2
    const s2 = stack.undo();
    expect(s2?.toAyah).toBe(2);
    expect(stack.canUndo).toBe(true);
    expect(stack.canRedo).toBe(true);

    // 2nd Undo -> returns version 1
    const s1 = stack.undo();
    expect(s1?.toAyah).toBe(1);
    expect(stack.canUndo).toBe(false);
    expect(stack.canRedo).toBe(true);

    // 3rd Undo -> cannot undo past beginning
    const s0 = stack.undo();
    expect(s0).toBeNull();

    // Redo -> returns version 2
    const r2 = stack.redo();
    expect(r2?.toAyah).toBe(2);
    expect(stack.canUndo).toBe(true);
    expect(stack.canRedo).toBe(true);

    // Redo -> returns version 3
    const r3 = stack.redo();
    expect(r3?.toAyah).toBe(3);
    expect(stack.canUndo).toBe(true);
    expect(stack.canRedo).toBe(false);
  });

  it('truncates future history when pushing a new state after undo', () => {
    const stack = new HistoryStackModel();

    stack.pushState(createDummySnapshot(1));
    stack.pushState(createDummySnapshot(2));
    stack.pushState(createDummySnapshot(3));

    // Undo to version 2
    stack.undo();
    expect(stack.current?.toAyah).toBe(2);

    // Push new branch: version 4
    stack.pushState(createDummySnapshot(4));
    expect(stack.count).toBe(3); // [1, 2, 4]
    expect(stack.current?.toAyah).toBe(4);
    expect(stack.canRedo).toBe(false);

    // Undo should go to version 2, not 3
    const prev = stack.undo();
    expect(prev?.toAyah).toBe(2);
  });
});
