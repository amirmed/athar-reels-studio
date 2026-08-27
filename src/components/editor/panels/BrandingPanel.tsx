import React from 'react';
import { TextSettings, Project } from '../../../types';
import { AyahData, TranslationData } from '../../../services/quranApi';
import { ViralCaptionGenerator } from '../../ui/ViralCaptionGenerator';
import { Sparkles } from 'lucide-react';
import { Slider } from '../../ui/Slider';

interface BrandingPanelProps {
  currentProject: Project | null;
  textSettings: TextSettings;
  setTextSettings: React.Dispatch<React.SetStateAction<TextSettings>>;
  watermark: string;
  setWatermark: (val: string) => void;
  selectedSurahName?: string;
  fromAyah: number;
  toAyah: number;
  currentAyahIndex: number;
  ayahs: AyahData[];
  translations: TranslationData[];
}

export const BrandingPanel: React.FC<BrandingPanelProps> = ({
  currentProject,
  textSettings,
  setTextSettings,
  watermark,
  setWatermark,
  selectedSurahName,
  fromAyah,
  toAyah,
  currentAyahIndex,
  ayahs,
  translations,
}) => {
  return (
    <div className="space-y-4 animate-in">
      {/* Watermark Main Card */}
      <div className="p-4 rounded-2xl bg-surface-800/60 border border-white/[0.06] space-y-3.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-white flex items-center gap-1.5">
            <Sparkles size={14} className="text-gold-400" />
            <span>العلامة المائية والتوقيع (Watermark)</span>
          </label>
          <button
            type="button"
            onClick={() =>
              setTextSettings((s) => ({
                ...s,
                showWatermark: s.showWatermark === false ? true : false,
              }))
            }
            className={`px-2 py-0.5 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${
              textSettings.showWatermark !== false
                ? 'bg-gold-400/20 border-gold-400 text-gold-300'
                : 'bg-surface-900 border-white/10 text-white/40'
            }`}
          >
            {textSettings.showWatermark !== false ? 'مفعلة ✓' : 'مخفية'}
          </button>
        </div>

        {textSettings.showWatermark !== false && (
          <>
            <div>
              <input
                type="text"
                value={watermark}
                onChange={(e) => setWatermark(e.target.value)}
                placeholder="مثال: @athar_studio أو اسم القناة"
                className="glass-input w-full p-2.5 rounded-xl text-xs font-medium"
              />
            </div>

            {/* 6/7-Direction Position Grid */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-white/60">
                  موضع العلامة المائية (أو اسحبها باليد في الشاشة ✋):
                </label>
                {(textSettings.watermarkX || textSettings.watermarkY) && (
                  <button
                    type="button"
                    onClick={() =>
                      setTextSettings((s) => ({
                        ...s,
                        watermarkX: 0,
                        watermarkY: 0,
                      }))
                    }
                    className="text-[11px] text-gold-400 hover:text-gold-300 font-bold underline cursor-pointer"
                  >
                    إعادة للزاوية 🔄
                  </button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-1.5 max-w-xs mx-auto p-1.5 rounded-xl bg-surface-900/80 border border-white/[0.06]">
                {[
                  { id: 'topLeft', label: '↖️ أعلى اليسار' },
                  { id: 'top', label: '⬆️ أعلى الوسط' },
                  { id: 'topRight', label: '↗️ أعلى اليمين' },
                  { id: 'bottomLeft', label: '↙️ أسفل اليسار' },
                  { id: 'bottom', label: '⬇️ أسفل الوسط' },
                  { id: 'bottomRight', label: '↘️ أسفل اليمين' },
                  { id: 'center', label: '🎯 في المنتصف' },
                ].map((pos) => (
                  <button
                    key={pos.id}
                    type="button"
                    onClick={() =>
                      setTextSettings((s) => ({
                        ...s,
                        watermarkPosition: pos.id as TextSettings['watermarkPosition'],
                        watermarkX: 0,
                        watermarkY: 0,
                      }))
                    }
                    className={`p-1.5 rounded-lg text-[11px] font-bold transition-all text-center cursor-pointer ${
                      (textSettings.watermarkPosition || 'bottom') === pos.id &&
                      !textSettings.watermarkX &&
                      !textSettings.watermarkY
                        ? 'bg-gradient-to-r from-gold-400 to-amber-500 text-surface-950 font-black shadow-md'
                        : 'bg-surface-800/80 text-white/60 hover:text-white hover:bg-surface-700'
                    } ${pos.id === 'center' ? 'col-span-3' : ''}`}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Opacity & Size Sliders */}
            <div className="space-y-2.5 pt-1 border-t border-white/[0.04]">
              <Slider
                label="شفافية العلامة المائية"
                min={10}
                max={100}
                value={Math.round((textSettings.watermarkOpacity ?? 0.55) * 100)}
                accentColor="gold"
                unit="%"
                onChange={(val) =>
                  setTextSettings((s) => ({
                    ...s,
                    watermarkOpacity: val / 100,
                  }))
                }
              />

              <Slider
                label="حجم خط العلامة المائية"
                min={8}
                max={24}
                value={textSettings.watermarkFontSize || 11}
                accentColor="gold"
                unit="px"
                onChange={(val) =>
                  setTextSettings((s) => ({
                    ...s,
                    watermarkFontSize: val,
                  }))
                }
              />
            </div>

            {/* Watermark Color Preset */}
            <div className="pt-1 border-t border-white/[0.04]">
              <label className="block text-xs font-bold text-white/60 mb-1.5">
                لون العلامة المائية:
              </label>
              <div className="flex items-center gap-2">
                {[
                  { color: '#ffffff', name: 'أبيض' },
                  { color: '#fbbf24', name: 'ذهبي' },
                  { color: '#34d399', name: 'زمردي' },
                  { color: '#38bdf8', name: 'سماوي' },
                  { color: '#e2e8f0', name: 'فضي' },
                ].map((c) => (
                  <button
                    key={c.color}
                    type="button"
                    onClick={() =>
                      setTextSettings((s) => ({
                        ...s,
                        watermarkColor: c.color,
                      }))
                    }
                    className={`w-6 h-6 rounded-full border-2 transition-all cursor-pointer ${
                      (textSettings.watermarkColor || '#ffffff') === c.color
                        ? 'border-gold-400 scale-110 shadow-md'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c.color }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Viral Caption Engine */}
      <div className="pt-2 border-t border-white/[0.06]">
        <ViralCaptionGenerator
          surahName={selectedSurahName || currentProject?.customTitle}
          ayahRange={`${fromAyah} - ${toAyah}`}
          ayahText={ayahs[currentAyahIndex]?.text || currentProject?.customText}
          translationText={translations[currentAyahIndex]?.text}
          customTitle={currentProject?.customTitle}
        />
      </div>
    </div>
  );
};
