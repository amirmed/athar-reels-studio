import React from 'react';
import { AudioSettings, TextSettings } from '../../../types';
import { ambientSounds, proceduralAmbientEngine } from '../../../data/ambientSounds';
import { Spatial8DRadar } from '../../ui/Spatial8DRadar';
import { Sparkles, Mic, Sliders, Headphones, Activity, Volume2, Square, Play } from 'lucide-react';
import { useTranslation } from '../../../i18n';

interface AmbientAudioPanelProps {
  audioSettings: AudioSettings;
  setAudioSettings: React.Dispatch<React.SetStateAction<AudioSettings>>;
  textSettings: TextSettings;
  setTextSettings: React.Dispatch<React.SetStateAction<TextSettings>>;
  isTestingAmbient: boolean;
  setIsTestingAmbient: (val: boolean) => void;
  onOpenVoiceRecorder: () => void;
}

export const AmbientAudioPanel: React.FC<AmbientAudioPanelProps> = ({
  audioSettings,
  setAudioSettings,
  textSettings,
  setTextSettings,
  isTestingAmbient,
  setIsTestingAmbient,
  onOpenVoiceRecorder,
}) => {
  const { t } = useTranslation();

  const atmospherePresets = [
    {
      id: 'makkah_haram',
      name: t('editor.presetMakkahHaramName', '🕋 الحرم المكي الشريف'),
      desc: t('editor.presetMakkahHaramDesc', 'صدى الحرم + دوران 8D بطيء'),
    },
    {
      id: 'madinah_peace',
      name: t('editor.presetMadinahPeaceName', '🕌 المسجد النبوي'),
      desc: t('editor.presetMadinahPeaceDesc', 'سكينة المسجد + دفء الصوت'),
    },
    {
      id: 'rain_serenity',
      name: t('editor.presetRainSerenityName', '🌧️ السكينة والمطر'),
      desc: t('editor.presetRainSerenityDesc', 'مطر خفيف + بندول مكاني'),
    },
    {
      id: 'studio_clean',
      name: t('editor.presetStudioCleanName', '🎬 استوديو نقي بدون صدى'),
      desc: t('editor.presetStudioCleanDesc', 'وضوح فائق + مانع التشويش'),
    },
    {
      id: 'viral_8d',
      name: t('editor.presetViral8dName', '⚡ ريلز تيك توك 8D'),
      desc: t('editor.presetViral8dDesc', 'دوران سريع ملفت للسماعات'),
    },
  ];

  const mosqueReverbs = [
    { id: 'none' as const, name: t('editor.reverbNone', 'بدون صدى'), icon: '🎙️' },
    { id: 'smallRoom' as const, name: t('editor.reverbSmallRoom', 'غرفة هادئة'), icon: '🏠' },
    { id: 'grandMosque' as const, name: t('editor.reverbGrandMosque', 'المسجد الكبير'), icon: '🕌' },
    { id: 'makkahHaram' as const, name: t('editor.reverbMakkahHaram', 'الحرم المكي'), icon: '🕋' },
    { id: 'celestialEcho' as const, name: t('editor.reverbCelestialEcho', 'صدى واسع'), icon: '✨' },
  ];

  const spatialPaths = [
    { id: 'orbit360' as const, name: t('editor.pathOrbit360', '🕋 طواف الكعبة 360°') },
    { id: 'makkahDome' as const, name: t('editor.pathMakkahDome', '🕌 قبة الحرم العلوية') },
    { id: 'pendulum' as const, name: t('editor.pathPendulum', '🕊️ بندول السكينة') },
    { id: 'floatingClouds' as const, name: t('editor.pathFloatingClouds', '☁️ سحب النور') },
  ];

  const waveformStyles = [
    { id: 'bars' as const, name: t('editor.wfBars', '📊 أعمدة نيون (Bars)') },
    { id: 'wave' as const, name: t('editor.wfWave', '〰️ موجة انسيابية (Wave)') },
    { id: 'dots' as const, name: t('editor.wfDots', '🎚️ نقاط ترددية (Dots)') },
    { id: 'pulse' as const, name: t('editor.wfPulse', '💫 نبضات قلب (Pulse)') },
  ];

  const waveformGlowColors = [
    { id: '#fbbf24', name: t('editor.colorGold', 'ذهبي') },
    { id: '#10b981', name: t('editor.colorEmerald', 'زمردي') },
    { id: '#38bdf8', name: t('editor.colorSky', 'سماوي') },
    { id: '#ffffff', name: t('editor.colorWhite', 'أبيض') },
    { id: '#a855f7', name: 'بنفسجي' },
  ];

  const applyAudioPreset = (presetKey: string) => {
    switch (presetKey) {
      case 'makkah_haram':
        setAudioSettings((s) => ({
          ...s,
          reverbPreset: 'makkahHaram',
          reverbLevel: 45,
          enable8DAudio: true,
          eightDSpeed: 0.08,
          eightDDepth: 85,
          eightDStyle: 'orbit360',
          enableStudioClarity: true,
          enableVoiceWarmth: true,
          ambientSoundId: 'none',
        }));
        setTextSettings((s) => ({ ...s, show8DBadge: true }));
        break;
      case 'madinah_peace':
        setAudioSettings((s) => ({
          ...s,
          reverbPreset: 'grandMosque',
          reverbLevel: 35,
          enable8DAudio: true,
          eightDSpeed: 0.1,
          eightDDepth: 75,
          eightDStyle: 'makkahDome',
          enableStudioClarity: true,
          enableVoiceWarmth: true,
          ambientSoundId: 'none',
        }));
        setTextSettings((s) => ({ ...s, show8DBadge: true }));
        break;
      case 'rain_serenity':
        setAudioSettings((s) => ({
          ...s,
          reverbPreset: 'smallRoom',
          reverbLevel: 25,
          enable8DAudio: true,
          eightDSpeed: 0.12,
          eightDDepth: 80,
          eightDStyle: 'pendulum',
          enableStudioClarity: true,
          ambientSoundId: 'gentle_rain',
          ambientSoundVolume: 25,
        }));
        setTextSettings((s) => ({ ...s, show8DBadge: true }));
        break;
      case 'studio_clean':
        setAudioSettings((s) => ({
          ...s,
          reverbPreset: 'none',
          reverbLevel: 0,
          enable8DAudio: false,
          enableStudioClarity: true,
          enableVoiceWarmth: true,
          enableNoiseGate: true,
          ambientSoundId: 'none',
        }));
        setTextSettings((s) => ({ ...s, show8DBadge: false }));
        break;
      case 'viral_8d':
        setAudioSettings((s) => ({
          ...s,
          reverbPreset: 'smallRoom',
          reverbLevel: 28,
          enable8DAudio: true,
          eightDSpeed: 0.18,
          eightDDepth: 95,
          eightDStyle: 'orbit360',
          enableStudioClarity: true,
          enableVoiceWarmth: true,
          ambientSoundId: 'none',
        }));
        setTextSettings((s) => ({ ...s, show8DBadge: true }));
        break;
    }
  };

  return (
    <div className="space-y-4 animate-in">
      {/* 🪄 1-Click Audio Atmosphere Presets */}
      <div className="p-3 rounded-2xl bg-surface-900/90 border border-gold-500/30 space-y-2 shadow-lg">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-surface-50 flex items-center gap-1.5">
            <Sparkles size={14} className="text-gold-400" />
            <span>{t('editor.ambientPresetsTitle', 'أجواء صوتية متكاملة بضغطة زر 🪄')}</span>
          </label>
          <span className="text-[11px] text-gold-400/80 font-medium">
            {t('editor.ambientPresetsSubtitle', 'جاهزة وموزونة 100%')}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {atmospherePresets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyAudioPreset(preset.id)}
              className="p-2 rounded-xl text-start border border-surface-700/40 bg-surface-950/60 hover:bg-gold-500/10 hover:border-gold-500/30 transition-all cursor-pointer group"
            >
              <div className="text-xs font-bold text-surface-50 group-hover:text-gold-300">
                {preset.name}
              </div>
              <div className="text-[10px] text-surface-400 group-hover:text-surface-300">
                {preset.desc}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 🌿 Procedural Layer 1: Ambient Islamic Nature & Masjid Atmosphere */}
      <div className="p-3.5 rounded-2xl bg-surface-900/90 border border-purple-500/20 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-surface-50 flex items-center gap-1.5">
            <Volume2 size={14} className="text-purple-400" />
            <span>{t('editor.ambientNatureTitle', 'أجواء الطبيعة والسكينة (Ambient Atmosphere) 🌿')}</span>
          </label>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                if (isTestingAmbient) {
                  proceduralAmbientEngine.stop();
                  setIsTestingAmbient(false);
                } else if (audioSettings.ambientSoundId && audioSettings.ambientSoundId !== 'none') {
                  proceduralAmbientEngine.play(
                    audioSettings.ambientSoundId,
                    audioSettings.ambientSoundVolume ?? 28
                  );
                  setIsTestingAmbient(true);
                }
              }}
              className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-400/30 hover:bg-purple-500/30 transition-all flex items-center gap-1 cursor-pointer"
            >
              {isTestingAmbient ? (
                <>
                  <Square size={9} /> {t('editor.ambientStop', 'إيقاف')}
                </>
              ) : (
                <>
                  <Play size={9} /> {t('editor.ambientListen', 'استماع')}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Ambient Nature Sound Grid */}
        <div className="grid grid-cols-2 gap-1.5">
          {ambientSounds.map((sound) => {
            const isSelected = (audioSettings.ambientSoundId || 'none') === sound.id;
            return (
              <button
                key={sound.id}
                type="button"
                onClick={() => {
                  setAudioSettings((s) => ({ ...s, ambientSoundId: sound.id }));
                  if (isTestingAmbient && sound.id !== 'none') {
                    proceduralAmbientEngine.play(sound.id, audioSettings.ambientSoundVolume ?? 28);
                  } else if (sound.id === 'none') {
                    proceduralAmbientEngine.stop();
                    setIsTestingAmbient(false);
                  }
                }}
                className={`p-2.5 rounded-xl text-start text-xs font-bold border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-purple-500/25 border-purple-400 text-surface-50 shadow-md shadow-purple-500/10 ring-1 ring-purple-400/30'
                    : 'bg-surface-800/60 border-surface-700/40 text-surface-400 hover:text-surface-50 hover:bg-surface-800'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span>{sound.icon}</span>
                  <span>{sound.name}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between text-xs font-bold text-surface-400 mb-1">
          <span>{t('editor.ambientVolumeLabel', 'مستوى صوت الطبيعة')}</span>
          <span className="font-mono text-purple-400">
            {audioSettings.ambientSoundVolume ?? 22}%
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={audioSettings.ambientSoundVolume ?? 22}
          onChange={(e) =>
            setAudioSettings((s) => ({ ...s, ambientSoundVolume: Number(e.target.value) }))
          }
          className="w-full accent-purple-500 cursor-pointer"
        />
      </div>

      {/* 🎙️ Live Voice Recording Studio Button */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-gold-900/40 via-surface-900 to-amber-900/30 border border-gold-500/30 space-y-2.5 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gold-400/20 text-gold-600 dark:text-gold-300 flex items-center justify-center font-bold">
              <Mic size={16} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-surface-50">{t('editor.recordVoiceCustomTitle', 'تسجيل تلاوتك الخاصة أو رفع MP3 🎙️')}</h4>
              <p className="text-[11px] text-surface-400">{t('editor.recordVoiceCustomSubtitle', 'مع محاكاة صدى الحرم المكي الشريف')}</p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenVoiceRecorder}
          className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-gold-400 to-amber-500 hover:from-gold-300 hover:to-amber-400 text-surface-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
        >
          <Mic size={14} />
          <span>{t('editor.openVoiceRecorderBtn', 'فتح استوديو التسجيل والمايكروفون 🎙️')}</span>
        </button>

        {audioSettings.customRecordedAudioUrl && (
          <div className="flex items-center justify-between p-2 rounded-xl bg-surface-950 border border-emerald-500/30 text-xs text-emerald-700 dark:text-emerald-300">
            <span className="flex items-center gap-1 font-bold">
              <span>✓</span>
              <span>{t('editor.customVoiceProjectActive', 'تلاوتك المخصصة مفعلة في المشروع')}</span>
            </span>
            <span className="font-mono text-[11px] text-surface-400">
              {Math.round(audioSettings.customAudioDuration || 0)}ث
            </span>
          </div>
        )}
      </div>

      {/* 🕌 Mosque Spatial Reverb Section */}
      <div className="p-3.5 rounded-2xl bg-surface-900 border border-purple-500/20 space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-surface-50 flex items-center gap-1.5">
            <Sparkles size={14} className="text-purple-400" />
            <span>{t('editor.mosqueReverbTitle', 'صدى المسجد الحرام (Mosque Spatial Reverb) 🕌')}</span>
          </label>
          <span className="text-[11px] text-purple-700 dark:text-purple-300 font-bold px-2 py-0.5 rounded-full bg-purple-500/15">
            3D Sound
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {mosqueReverbs.map((rev) => {
            const isSelected = (audioSettings.reverbPreset || 'none') === rev.id;
            return (
              <button
                key={rev.id}
                type="button"
                onClick={() => setAudioSettings((s) => ({ ...s, reverbPreset: rev.id }))}
                className={`p-2 rounded-xl text-start transition-all cursor-pointer border flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-purple-500/20 border-purple-400 text-surface-50 font-bold shadow-sm'
                    : 'bg-surface-950 border-surface-700/40 text-surface-400 hover:text-surface-50'
                }`}
              >
                <span className="text-sm">{rev.icon}</span>
                <span className="text-xs truncate">{rev.name}</span>
              </button>
            );
          })}
        </div>

        {audioSettings.reverbPreset && audioSettings.reverbPreset !== 'none' && (
          <div className="pt-2 border-t border-surface-700/40">
            <div className="flex items-center justify-between text-xs font-bold text-surface-400 mb-1">
              <span>{t('editor.reverbLevelLabel', 'قوة الصدى وعمق الارتداد')}</span>
              <span className="font-mono text-purple-400">{audioSettings.reverbLevel ?? 45}%</span>
            </div>
            <input
              type="range"
              min={10}
              max={90}
              value={audioSettings.reverbLevel ?? 45}
              onChange={(e) =>
                setAudioSettings((s) => ({ ...s, reverbLevel: Number(e.target.value) }))
              }
              className="w-full accent-purple-500 cursor-pointer"
            />
          </div>
        )}
      </div>

      {/* 🎛️ Studio Audio Mastering & Noise Gate */}
      <div className="p-3.5 rounded-2xl bg-surface-900 border border-emerald-500/20 space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-surface-50 flex items-center gap-1.5">
            <Sliders size={14} className="text-emerald-400" />
            <span>{t('editor.studioDspTitle', 'فلاتر الاستوديو ونقاء الصوت 🎛️')}</span>
          </label>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">Studio DSP</span>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => setAudioSettings((s) => ({ ...s, enableNoiseGate: !s.enableNoiseGate }))}
            className={`p-2 rounded-xl text-center text-[11px] font-bold border transition-all cursor-pointer ${
              (audioSettings.enableNoiseGate ?? true)
                ? 'bg-emerald-500/20 border-emerald-400 text-surface-50'
                : 'bg-surface-950 border-surface-700/40 text-surface-400'
            }`}
          >
            <div>{t('editor.noiseGateLabel', '⚡ عزل الضوضاء')}</div>
            <div className="text-[10px] text-surface-400">
              {(audioSettings.enableNoiseGate ?? true) ? t('editor.stateActive', 'مفعل ✓') : t('editor.stateDisabled', 'معطل')}
            </div>
          </button>

          <button
            type="button"
            onClick={() =>
              setAudioSettings((s) => ({ ...s, enableStudioClarity: !s.enableStudioClarity }))
            }
            className={`p-2 rounded-xl text-center text-[11px] font-bold border transition-all cursor-pointer ${
              (audioSettings.enableStudioClarity ?? true)
                ? 'bg-emerald-500/20 border-emerald-400 text-surface-50'
                : 'bg-surface-950 border-surface-700/40 text-surface-400'
            }`}
          >
            <div>{t('editor.studioClarityLabel', '💎 نقاء التجويد')}</div>
            <div className="text-[10px] text-surface-400">
              {(audioSettings.enableStudioClarity ?? true) ? t('editor.stateActive', 'مفعل ✓') : t('editor.stateDisabled', 'معطل')}
            </div>
          </button>

          <button
            type="button"
            onClick={() =>
              setAudioSettings((s) => ({ ...s, enableVoiceWarmth: !s.enableVoiceWarmth }))
            }
            className={`p-2 rounded-xl text-center text-[11px] font-bold border transition-all cursor-pointer ${
              (audioSettings.enableVoiceWarmth ?? true)
                ? 'bg-emerald-500/20 border-emerald-400 text-surface-50'
                : 'bg-surface-950 border-surface-700/40 text-surface-400'
            }`}
          >
            <div>{t('editor.voiceWarmthLabel', '🎙️ دفء الصوت')}</div>
            <div className="text-[10px] text-surface-400">
              {(audioSettings.enableVoiceWarmth ?? true) ? t('editor.stateActive', 'مفعل ✓') : t('editor.stateDisabled', 'معطل')}
            </div>
          </button>
        </div>
      </div>

      {/* 🎧 8D Binaural Spatial Audio Section */}
      <div className="p-3.5 rounded-2xl bg-surface-900 border border-gold-500/30 space-y-3 shadow-lg">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-surface-50 flex items-center gap-1.5">
            <Headphones size={14} className="text-gold-400" />
            <span>{t('editor.spatial8dTitle', 'صوت الحرم المكاني (8D Spatial Audio) 🎧')}</span>
          </label>
          <button
            type="button"
            onClick={() => {
              const nextVal = !audioSettings.enable8DAudio;
              setAudioSettings((s) => ({
                ...s,
                enable8DAudio: nextVal,
                eightDSpeed: s.eightDSpeed ?? 0.12,
                eightDDepth: s.eightDDepth ?? 85,
                eightDStyle: s.eightDStyle ?? 'orbit360',
              }));
              setTextSettings((s) => ({ ...s, show8DBadge: nextVal }));
            }}
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${
              audioSettings.enable8DAudio
                ? 'bg-gold-500/20 border-gold-400 text-gold-700 dark:text-gold-300 shadow-sm font-bold'
                : 'bg-surface-950 border-surface-700/40 text-surface-400'
            }`}
          >
            {audioSettings.enable8DAudio ? t('editor.stateActive', 'مفعل ✓') : t('editor.stateDisabled', 'معطل')}
          </button>
        </div>

        {/* Interactive 3D Spatial Radar Visualizer */}
        <Spatial8DRadar
          isEnabled={audioSettings.enable8DAudio ?? false}
          style={audioSettings.eightDStyle || 'orbit360'}
          speed={(audioSettings.eightDSpeed && audioSettings.eightDSpeed > 1) ? audioSettings.eightDSpeed / 100 : (audioSettings.eightDSpeed ?? 0.12)}
          depth={audioSettings.eightDDepth ?? 85}
        />

        {audioSettings.enable8DAudio && (
          <div className="space-y-2.5 pt-1">
            <div>
              <label className="block text-surface-300 text-xs font-bold mb-1.5">
                {t('editor.spatialPathLabel', 'مسار الطواف المكاني 360°')}
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {spatialPaths.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setAudioSettings((s) => ({ ...s, eightDStyle: st.id }))}
                    className={`p-2 rounded-xl text-xs font-bold border transition-all text-start cursor-pointer ${
                      (audioSettings.eightDStyle || 'orbit360') === st.id
                        ? 'bg-gold-500/20 border-gold-400 text-surface-50 shadow-sm'
                        : 'bg-surface-950 border-surface-700/40 text-surface-400 hover:text-surface-50'
                    }`}
                  >
                    {st.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              {(() => {
                const rawSpeed = audioSettings.eightDSpeed ?? 0.12;
                const safeSpeed = rawSpeed > 1 ? rawSpeed / 100 : rawSpeed;
                const speedPercent = Math.round(safeSpeed * 100);
                return (
                  <>
                    <div className="flex items-center justify-between text-xs font-bold text-surface-400 mb-1">
                      <span>{t('editor.spatialSpeedLabel', 'سرعة دوران الصوت حول الرأس')}</span>
                      <span className="font-mono text-gold-600 dark:text-gold-400 font-bold">
                        {speedPercent}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={4}
                      max={30}
                      value={speedPercent}
                      onChange={(e) =>
                        setAudioSettings((s) => ({
                          ...s,
                          eightDSpeed: Number(e.target.value) / 100,
                        }))
                      }
                      className="w-full accent-gold-400 cursor-pointer"
                    />
                  </>
                );
              })()}
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-surface-700/40">
              <span className="text-xs text-surface-300 font-medium">
                {t('editor.show8dBadgeToggle', 'إظهار شارة السماعات 🎧 على الفيديو')}
              </span>
              <input
                type="checkbox"
                checked={textSettings.show8DBadge ?? true}
                onChange={(e) => setTextSettings((s) => ({ ...s, show8DBadge: e.target.checked }))}
                className="toggle accent-gold-400 cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* Audio Waveform Visualizer Section */}
      <div className="p-3.5 rounded-2xl bg-surface-900/90 border border-gold-500/20 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity size={15} className="text-gold-400" />
            <span className="font-bold text-surface-50 text-xs">{t('editor.waveformTitle', 'شريط الموجات الصوتية التفاعلي 🎵')}</span>
          </div>
          <input
            type="checkbox"
            checked={textSettings.showWaveform ?? true}
            onChange={(e) => setTextSettings((s) => ({ ...s, showWaveform: e.target.checked }))}
            className="toggle cursor-pointer"
          />
        </div>

        {(textSettings.showWaveform ?? true) && (
          <div className="space-y-3 pt-1">
            <div>
              <label className="block text-surface-400 text-xs mb-1.5">{t('editor.waveformStyleLabel', 'شكل وحركة الموجات')}</label>
              <div className="grid grid-cols-2 gap-1.5">
                {waveformStyles.map((wf) => (
                  <button
                    key={wf.id}
                    type="button"
                    onClick={() => setTextSettings((s) => ({ ...s, waveformStyle: wf.id }))}
                    className={`p-2 rounded-xl text-xs font-bold border transition-all text-start cursor-pointer ${
                      (textSettings.waveformStyle || 'bars') === wf.id
                        ? 'bg-gold-500/20 border-gold-400 text-surface-50 shadow-sm'
                        : 'bg-surface-800/60 border-surface-700/40 text-surface-400 hover:text-surface-50'
                    }`}
                  >
                    {wf.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-surface-400 text-xs mb-1.5">{t('editor.waveformGlowColor', 'لون توهج الموجات')}</label>
              <div className="flex items-center gap-2">
                {waveformGlowColors.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setTextSettings((s) => ({ ...s, waveformColor: c.id }))}
                    className={`w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center cursor-pointer ${
                      (textSettings.waveformColor || '#fbbf24') === c.id
                        ? 'scale-110 border-white shadow-lg'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c.id }}
                  />
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-bold text-surface-400 mb-1">
                <span>{t('editor.waveformHeightLabel', 'ارتفاع الموجات')}</span>
                <span className="font-mono text-gold-400">
                  {textSettings.waveformHeight || 24}px
                </span>
              </div>
              <input
                type="range"
                min={16}
                max={44}
                value={textSettings.waveformHeight || 24}
                onChange={(e) =>
                  setTextSettings((s) => ({ ...s, waveformHeight: Number(e.target.value) }))
                }
                className="w-full accent-gold-500 cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
