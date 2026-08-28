import React from 'react';
import { TextSettings } from '../../../types';
import { Frame } from 'lucide-react';
import { Slider } from '../../ui/Slider';

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
      <div className="flex items-center justify-between p-3 rounded-xl bg-surface-900/90 border border-surface-700/40">
        <div className="flex items-center gap-1.5">
          <Frame size={14} className="text-emerald-400" />
          <span className="font-bold text-surface-50 text-xs">تفعيل الإطارات الملكية</span>
        </div>
        <input
          type="checkbox"
          checked={textSettings.showIslamicOrnaments}
          onChange={(e) =>
            setTextSettings((s) => ({ ...s, showIslamicOrnaments: e.target.checked }))
          }
          className="accent-emerald-500 rounded cursor-pointer"
        />
      </div>

      {textSettings.showIslamicOrnaments && (
        <>
          <div>
            <label className="text-xs font-bold text-surface-400 mb-2 block">نوع الإطار الملكي</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'royalFrame', name: 'إطار ملكي ذهبي' },
                { id: 'geometricArabesque', name: 'زخرفة هندسية' },
                { id: 'floralCorners', name: 'أركان زهرية' },
                { id: 'domeCrescent', name: 'قبة وهلال' },
              ].map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setTextSettings((s) => ({ ...s, ornamentStyle: o.id as TextSettings['ornamentStyle'] }))}
                  className={`p-2 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                    textSettings.ornamentStyle === o.id
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                      : 'bg-surface-800/60 text-surface-400 hover:bg-surface-800 hover:text-surface-50 border border-surface-700/40'
                  }`}
                >
                  {o.name}
                </button>
              ))}
            </div>
          </div>

          <Slider
            label="شفافية الإطار"
            min={0.2}
            max={1.0}
            step={0.05}
            value={textSettings.ornamentOpacity ?? 0.85}
            accentColor="emerald"
            formatValue={(v) => `${Math.round(v * 100)}%`}
            onChange={(val) => setTextSettings((s) => ({ ...s, ornamentOpacity: val }))}
          />
        </>
      )}
    </div>
  );
};
