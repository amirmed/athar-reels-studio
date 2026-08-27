import { describe, it, expect } from 'vitest';
import {
  createDefaultProject,
  createDefaultTextSettings,
  createDefaultAudioSettings,
  DEFAULT_TEXT_SETTINGS,
  DEFAULT_AUDIO_SETTINGS,
} from '../utils/projectDefaults';

describe('projectDefaults Factory Suite', () => {
  it('creates valid default project with standard fallback attributes', () => {
    const project = createDefaultProject();

    expect(project.id).toBeDefined();
    expect(project.name).toBe('ريل قرآني جديد');
    expect(project.surahNumber).toBe(1);
    expect(project.fromAyah).toBe(1);
    expect(project.toAyah).toBe(7);
    expect(project.aspectRatio).toBe('9:16');
    expect(project.textSettings).toEqual(expect.objectContaining(DEFAULT_TEXT_SETTINGS));
    expect(project.audioSettings).toEqual(expect.objectContaining(DEFAULT_AUDIO_SETTINGS));
    expect(project.status).toBe('draft');
  });

  it('allows overriding specific project fields while preserving defaults', () => {
    const project = createDefaultProject({
      name: 'سورة الكهف مخصصة',
      surah: 'الكهف',
      surahNumber: 18,
      fromAyah: 1,
      toAyah: 10,
      textSettings: createDefaultTextSettings({
        fontSize: 36,
        fontFamily: 'Cairo',
      }),
    });

    expect(project.name).toBe('سورة الكهف مخصصة');
    expect(project.surahNumber).toBe(18);
    expect(project.textSettings.fontSize).toBe(36);
    expect(project.textSettings.fontFamily).toBe('Cairo');
    expect(project.textSettings.fontWeight).toBe('bold');
    expect(project.audioSettings.recitationVolume).toBe(100);
  });

  it('creates default text settings with custom overrides', () => {
    const textSettings = createDefaultTextSettings({
      textColor: '#fbbf24',
      textAlign: 'right',
    });

    expect(textSettings.textColor).toBe('#fbbf24');
    expect(textSettings.textAlign).toBe('right');
    expect(textSettings.fontSize).toBe(26);
    expect(textSettings.fontFamily).toBe('Amiri');
  });

  it('creates default audio settings with custom overrides', () => {
    const audioSettings = createDefaultAudioSettings({
      reverbPreset: 'makkahHaram',
      reverbLevel: 60,
    });

    expect(audioSettings.reverbPreset).toBe('makkahHaram');
    expect(audioSettings.reverbLevel).toBe(60);
    expect(audioSettings.recitationVolume).toBe(100);
    expect(audioSettings.fadeIn).toBe(true);
  });
});
