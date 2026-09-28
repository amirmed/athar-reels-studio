import { describe, it, expect } from 'vitest';
import { createDefaultTextSettings } from '../utils/projectDefaults';
import { TextSettings } from '../types';

describe('Quick Text Settings Transformations', () => {
  it('increments and decrements font size within safe visual bounds [14, 56]', () => {
    let settings = createDefaultTextSettings({ fontSize: 26 });

    const changeFontSize = (prev: TextSettings, delta: number): TextSettings => ({
      ...prev,
      fontSize: Math.max(14, Math.min(56, (prev.fontSize || 26) + delta)),
    });

    settings = changeFontSize(settings, 2);
    expect(settings.fontSize).toBe(28);

    settings = changeFontSize(settings, -4);
    expect(settings.fontSize).toBe(24);

    // Test lower clamp bound
    settings = changeFontSize(settings, -50);
    expect(settings.fontSize).toBe(14);

    // Test upper clamp bound
    settings = changeFontSize(settings, 100);
    expect(settings.fontSize).toBe(56);
  });

  it('updates text position accurately for 1-click vertical alignment', () => {
    let settings = createDefaultTextSettings({ position: 'center' });

    const setPosition = (
      prev: TextSettings,
      position: 'top' | 'center' | 'bottom'
    ): TextSettings => ({
      ...prev,
      position,
    });

    settings = setPosition(settings, 'top');
    expect(settings.position).toBe('top');

    settings = setPosition(settings, 'bottom');
    expect(settings.position).toBe('bottom');

    settings = setPosition(settings, 'center');
    expect(settings.position).toBe('center');
  });

  it('toggles ayah number visibility cleanly', () => {
    let settings = createDefaultTextSettings({});
    expect(settings.showAyahNumber).toBeUndefined(); // default is undefined (shown)

    const toggleAyahNumber = (prev: TextSettings): TextSettings => ({
      ...prev,
      showAyahNumber: prev.showAyahNumber === false ? true : false,
    });

    settings = toggleAyahNumber(settings);
    expect(settings.showAyahNumber).toBe(false);

    settings = toggleAyahNumber(settings);
    expect(settings.showAyahNumber).toBe(true);
  });

  it('updates text color to curated quick palette choices', () => {
    let settings = createDefaultTextSettings({ textColor: '#ffffff' });

    const setColor = (prev: TextSettings, textColor: string): TextSettings => ({
      ...prev,
      textColor,
    });

    settings = setColor(settings, '#cbb06b');
    expect(settings.textColor).toBe('#cbb06b');

    settings = setColor(settings, '#6ee7b7');
    expect(settings.textColor).toBe('#6ee7b7');
  });
});
