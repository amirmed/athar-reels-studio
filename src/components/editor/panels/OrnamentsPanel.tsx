import React from 'react';
import { TextSettings } from '../../../types';
import { Frame } from 'lucide-react';

interface OrnamentsPanelProps {
  textSettings: TextSettings;
  setTextSettings: React.Dispatch<React.SetStateAction<TextSettings>>;
}

export const OrnamentsPanel: React.FC<OrnamentsPanelProps> = ({
  textSettings,
  setTextSettings,
}) => {
  return (
    <div className="space-y-4 animate-in">
      <div className="flex items-center justify-between p-3 rounded-xl bg-surface-900/90 border border-white/[0.06]">
        <div className="flex items-center gap-1.5">
          <Frame size={14} className="text-emerald-400" />
          <span className="font-bold text-white text-xs">تفعيل الإطارات الملكية</span>
        </div>
        <input
          type="checkbox"
          checked={textSettings.showIslamicOrnaments}
          onChange={(e) =>
            setTextSettings((s) => ({ ...s, showIslamicOrnaments: e.target.checked }))
          }
          className="toggle cursor-pointer"
        />
      </div>

      {textSettings.showIslamicOrnaments && (
        <>
          <div>
            <label className="block text-white/50 mb-1.5 text-xs">شكل الإطار الإسلامي</label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'royalFrame', name: 'الملكي الفاخر 👑' },
                { id: 'geometricArabesque', name: 'أرابيسك هندسي 🕌' },
                { id: 'floralCorners', name: 'أركان زهرية 🌿' },
                { id: 'domeCrescent', name: 'قبة وهلال 🌙' },
              ].map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setTextSettings((s) => ({ ...s, ornamentStyle: o.id as any }))}
                  className={`p-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    textSettings.ornamentStyle === o.id
                      ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-sm'
                      : 'bg-surface-800/60 border-white/[0.04] text-white/60 hover:text-white'
                  }`}
                >
                  {o.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs font-bold text-white/60 mb-1">
              <span>شفافية الإطار</span>
              <span className="font-mono text-emerald-400">
                {Math.round((textSettings.ornamentOpacity ?? 0.85) * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0.2}
              max={1.0}
              step={0.05}
              value={textSettings.ornamentOpacity ?? 0.85}
              onChange={(e) =>
                setTextSettings((s) => ({ ...s, ornamentOpacity: Number(e.target.value) }))
              }
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>
        </>
      )}
    </div>
  );
};
