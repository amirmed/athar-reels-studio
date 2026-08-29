import React, { useState } from 'react';
import { TextSettings } from '../../../types';
import { AyahData } from '../../../services/quranApi';
import { matchAyahTheme } from '../../../services/ayahThemeMatcher';
import { IslamicPexelsBrowser } from '../../ui/IslamicPexelsBrowser';
import { AiBackgroundGenerator } from '../../ui/AiBackgroundGenerator';
import { MediaUploader } from '../../ui/MediaUploader';
import { isVideoMedia } from '../../../utils/imageUtils';
import { Slider } from '../../ui/Slider';
import { Layers, Sparkles, Film, Wand2 } from 'lucide-react';

interface BackgroundPanelProps {
  ayahs: AyahData[];
  currentAyahIndex: number;
  setCurrentAyahIndex: (idx: number) => void;
  backgroundFile?: string;
  setBackgroundFile: (url: string | undefined) => void;
  backgroundOpacity: number;
  setBackgroundOpacity: (opacity: number) => void;
  textSettings: TextSettings;
  setTextSettings: React.Dispatch<React.SetStateAction<TextSettings>>;
  aspectRatio: string;
  addToast: (
    toast: { message: string; type?: 'success' | 'error' | 'info' | 'warning' }
  ) => void;
}

export const BackgroundPanel: React.FC<BackgroundPanelProps> = ({
  ayahs,
  currentAyahIndex,
  setCurrentAyahIndex,
  backgroundFile,
  setBackgroundFile,
  backgroundOpacity,
  setBackgroundOpacity,
  textSettings,
  setTextSettings,
  aspectRatio,
  addToast,
}) => {
  const [bgTab, setBgTab] = useState<'pexels' | 'ai' | 'upload'>('pexels');
  const [applyScope, setApplyScope] = useState<'all' | 'current'>('all');

  const handleApplyBackgroundUrl = (url: string) => {
    const isVideo = isVideoMedia(url);
    const mediaLabel = isVideo ? 'الفيديو الحي 🎬' : 'الخلفية 🌟';

    if (applyScope === 'all') {
      // 1. Apply to ALL Scenes cleanly (Clear any stuck scene overrides)
      setBackgroundFile(url);
      setTextSettings((s) => ({
        ...s,
        sceneBackgrounds: {},
        enableMultiScene: false,
      }));
      addToast({
        message: `تم تطبيق ${mediaLabel} على جميع الآيات والمشاهد بنجاح ✨`,
        type: 'success',
      });
    } else {
      // 2. Apply to current Ayah scene only
      if (!backgroundFile) {
        setBackgroundFile(url);
      }
      setTextSettings((s) => ({
        ...s,
        enableMultiScene: true,
        sceneBackgrounds: {
          ...(s.sceneBackgrounds || {}),
          [currentAyahIndex]: url,
        },
      }));
      addToast({
        message: `تم تطبيق ${mediaLabel} على المشهد ${currentAyahIndex + 1} (الآية ${ayahs[currentAyahIndex]?.numberInSurah || currentAyahIndex + 1})`,
        type: 'success',
      });
    }
  };

  const handleResetAllToMain = () => {
    if (!backgroundFile) return;
    setTextSettings((s) => ({
      ...s,
      sceneBackgrounds: {},
      enableMultiScene: false,
    }));
    addToast({ message: 'تمت إعادة ضبط جميع المشاهد على الصورة الرئيسية 🔄', type: 'success' });
  };

  const handleAutoMatchCurrentAyah = () => {
    const activeText = ayahs[currentAyahIndex]?.text || '';
    const match = matchAyahTheme(activeText);
    handleApplyBackgroundUrl(match.recommendedBackgroundUrl);
    setTextSettings((s) => ({ ...s, colorGrading: match.suggestedColorGrading }));
    addToast({
      message: `✨ ${match.themeIcon} ${match.themeName}: ${match.reason}`,
      type: 'success',
    });
  };

  return (
    <div className="space-y-4 animate-in">
      {/* 🪄 Smart Context-Aware Background Matcher */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-gold-500/15 via-surface-900 to-amber-500/15 border border-gold-500/30 shadow-lg flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleAutoMatchCurrentAyah}
          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-surface-950 font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-gold-500/20 active:scale-95 transition-all cursor-pointer"
        >
          <Wand2 size={15} />
          <span>مطابقة تلقائية لسياق الآية ✨</span>
        </button>

        <div className="text-start">
          <div className="text-xs font-bold text-surface-50 flex items-center justify-start gap-1">
            <span>الذكاء القرآني للسياق</span>
            <Sparkles size={13} className="text-gold-400" />
          </div>
          <div className="text-[11px] text-surface-400">
            يقرأ معاني الآية ويختار الخلفية والتدرج المناسبين
          </div>
        </div>
      </div>

      {/* Target Scope Switcher (All Scenes vs Current Scene) */}
      {ayahs.length > 1 && (
        <div className="p-3 rounded-2xl bg-surface-900 border border-gold-400/30 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-surface-50">
            <span>نطاق تطبيق الصورة المختارة:</span>
            <span className="text-[11px] text-gold-700 dark:text-gold-300 font-mono font-bold">
              {applyScope === 'all' ? '🌟 كامل الريلز' : `🎬 مشهد ${currentAyahIndex + 1}`}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 p-1 bg-surface-950 rounded-xl border border-surface-700/30 text-xs font-bold">
            <button
              type="button"
              onClick={() => setApplyScope('all')}
              className={`py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                applyScope === 'all'
                  ? 'bg-gradient-to-r from-gold-500 to-amber-500 text-surface-950 font-extrabold shadow-sm'
                  : 'text-surface-400 hover:text-surface-50'
              }`}
            >
              <span>🌟 جميع الآيات (الكل)</span>
            </button>

            <button
              type="button"
              onClick={() => setApplyScope('current')}
              className={`py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                applyScope === 'current'
                  ? 'bg-sky-500 text-white font-extrabold shadow-sm'
                  : 'text-surface-400 hover:text-surface-50'
              }`}
            >
              <span>🎬 المشهد الحالي ({currentAyahIndex + 1})</span>
            </button>
          </div>

          {textSettings.sceneBackgrounds &&
            Object.keys(textSettings.sceneBackgrounds).length > 0 && (
              <button
                type="button"
                onClick={handleResetAllToMain}
                className="w-full py-1 text-[11px] text-gold-400 hover:text-gold-300 hover:underline flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>🔄 توحيد وحذف المشاهد المنفصلة وتطبيق الصورة الرئيسية</span>
              </button>
            )}
        </div>
      )}

      {/* Featured: Dynamic Multi-Scene Storytelling Mode */}
      {ayahs.length > 1 && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-sky-500/15 via-surface-900 to-indigo-500/15 border border-sky-400/30 shadow-md shadow-sky-500/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
                <Layers size={16} />
              </div>
              <div>
                <span className="font-bold text-surface-50 text-xs block">
                  تغيير المشاهد مع كل آية (Story Mode) 🎬
                </span>
                <span className="text-[11px] text-sky-300/70">
                  مشاهد سينمائية متتابعة مع كل آية
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={textSettings.enableMultiScene ?? false}
              onChange={(e) => {
                setTextSettings((s) => ({ ...s, enableMultiScene: e.target.checked }));
                if (e.target.checked) {
                  addToast({
                    message: 'تم تفعيل نمط القصة وتغيير المشاهد التلقائي 🎬✨',
                    type: 'success',
                  });
                }
              }}
              className="toggle"
            />
          </div>

          {(textSettings.enableMultiScene ?? false) && (
            <div className="space-y-2 pt-1 border-t border-surface-700/40">
              <p className="text-[11px] text-surface-400 leading-relaxed">
                اضغط على أي مشهد لتخصيص صورته المنفردة أو اختر «جميع الآيات» لتبديل الخلفية للجميع
                دفعة واحدة.
              </p>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                {ayahs.map((_a, aIdx) => {
                  const hasCustomBg = Boolean(textSettings.sceneBackgrounds?.[aIdx]);
                  return (
                    <button
                      key={aIdx}
                      type="button"
                      onClick={() => {
                        setCurrentAyahIndex(aIdx);
                        setApplyScope('current');
                      }}
                      className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold shrink-0 cursor-pointer transition-all flex items-center gap-1.5 ${
                        currentAyahIndex === aIdx
                          ? 'bg-sky-500/30 border-sky-400 text-sky-200 shadow-sm'
                          : 'bg-surface-800/80 border-surface-700/40 text-surface-400 hover:text-surface-50'
                      }`}
                    >
                      <span>مشهد {aIdx + 1}</span>
                      {hasCustomBg && <span className="text-[10px] text-emerald-400">●</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Background source selector */}
      <div className="flex items-center gap-1 p-1 bg-surface-900/90 rounded-xl border border-surface-700/40">
        {[
          { id: 'pexels' as const, label: 'Pexels 4K' },
          { id: 'ai' as const, label: 'توليد AI' },
          { id: 'upload' as const, label: 'رفع ملف' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setBgTab(t.id)}
            className={`flex-1 py-1.5 rounded-lg font-bold text-center transition-all cursor-pointer text-xs ${
              bgTab === t.id ? 'bg-sky-500 text-white shadow-sm' : 'text-surface-400 hover:text-surface-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {bgTab === 'pexels' && (
        <IslamicPexelsBrowser
          selectedUrl={
            applyScope === 'current' && textSettings.sceneBackgrounds?.[currentAyahIndex]
              ? textSettings.sceneBackgrounds[currentAyahIndex]
              : backgroundFile
          }
          onSelectPhoto={handleApplyBackgroundUrl}
        />
      )}

      {bgTab === 'ai' && (
        <AiBackgroundGenerator
          aspectRatio={aspectRatio as '9:16' | '1:1' | '16:9'}
          onSelectBackground={(url) => {
            handleApplyBackgroundUrl(url);
            if (backgroundOpacity < 0.8) {
              setBackgroundOpacity(0.85);
            }
          }}
        />
      )}

      {bgTab === 'upload' && (
        <MediaUploader
          type="both"
          currentFile={
            applyScope === 'current' && textSettings.sceneBackgrounds?.[currentAyahIndex]
              ? textSettings.sceneBackgrounds[currentAyahIndex]
              : backgroundFile
          }
          onUpload={handleApplyBackgroundUrl}
          onRemove={() => {
            if (applyScope === 'all') {
              setBackgroundFile(undefined);
              setTextSettings((s) => ({ ...s, sceneBackgrounds: {} }));
            } else {
              setTextSettings((s) => {
                const next = { ...(s.sceneBackgrounds || {}) };
                delete next[currentAyahIndex];
                return { ...s, sceneBackgrounds: next };
              });
            }
          }}
        />
      )}

      <div className="pt-2 border-t border-surface-700/40">
        <Slider
          label="عتامة وتغميق الخلفية"
          min={0.1}
          max={1.0}
          step={0.05}
          value={backgroundOpacity}
          formatValue={(v) => `${Math.round(v * 100)}%`}
          onChange={(val) => setBackgroundOpacity(val)}
        />
      </div>

      {/* Cinematic Color Grading & Mood Selector */}
      <div className="pt-3 border-t border-surface-700/40 space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-surface-50 flex items-center gap-1.5">
            <Sparkles size={14} className="text-gold-400" />
            <span>فلاتر التدرج والتصحيح اللوني السينمائي 🎨</span>
          </label>
          <span className="text-[11px] text-surface-400">Color Moods</span>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {[
            { id: 'none' as const, label: 'بدون فلتر', icon: '⚪' },
            { id: 'royalGold' as const, label: 'الذهب الملكي', icon: '👑' },
            { id: 'andalusianTwilight' as const, label: 'أندلسي ليلي', icon: '🌌' },
            { id: 'dawnMist' as const, label: 'نسيم الفجر', icon: '🌅' },
            { id: 'matteSilver' as const, label: 'فضي مطفي', icon: '🪙' },
            { id: 'emeraldNoor' as const, label: 'الزمردي النوراني', icon: '🌿' },
          ].map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => {
                setTextSettings((s) => ({ ...s, colorGrading: filter.id }));
                addToast({ message: `تم تطبيق فلتر «${filter.label}» ✨`, type: 'success' });
              }}
              className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                (textSettings.colorGrading ?? 'none') === filter.id
                  ? 'bg-gold-500/20 border-gold-400 shadow-md shadow-gold-500/10 text-surface-50 font-bold'
                  : 'bg-surface-900/80 border-surface-700/40 text-surface-400 hover:text-surface-50 hover:bg-surface-800/60'
              }`}
            >
              <span className="text-base">{filter.icon}</span>
              <span className="text-[11px] truncate w-full">{filter.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3D Slow Camera Motion & Ken Burns Selector */}
      <div className="pt-3 border-t border-surface-700/40 space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-surface-50 flex items-center gap-1.5">
            <Film size={14} className="text-sky-400" />
            <span>حركة الكاميرا السينمائية البطيئة 🎥</span>
          </label>
          <span className="text-[11px] text-surface-400">3D Camera Drift</span>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {[
            { id: 'none' as const, label: 'ثابت', icon: '⏹️' },
            { id: 'slowZoom' as const, label: 'تقريب بطيء (Zoom)', icon: '🔍' },
            { id: 'panRight' as const, label: 'انزلاق لليمين (Drift)', icon: '➡️' },
            { id: 'subtle3D' as const, label: 'حركة 3D بارالاكس', icon: '✨' },
          ].map((motionItem) => (
            <button
              key={motionItem.id}
              type="button"
              onClick={() => {
                setTextSettings((s) => ({ ...s, cameraMotion: motionItem.id as TextSettings['cameraMotion'] }));
                addToast({ message: `تم تفعيل ${motionItem.label} 🎬`, type: 'success' });
              }}
              className={`p-2 rounded-xl border text-start transition-all cursor-pointer flex items-center gap-2 ${
                (textSettings.cameraMotion ?? 'none') === motionItem.id
                  ? 'bg-sky-500/20 border-sky-400 shadow-md shadow-sky-500/10 text-surface-50 font-bold'
                  : 'bg-surface-900/80 border-surface-700/40 text-surface-400 hover:text-surface-50 hover:bg-surface-800/60'
              }`}
            >
              <span className="text-sm">{motionItem.icon}</span>
              <span className="text-[11px] truncate flex-1">{motionItem.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
