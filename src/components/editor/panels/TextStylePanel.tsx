import React, { useState } from 'react';
import { TextSettings } from '../../../types';
import {
  ARABIC_FONTS,
  TYPOGRAPHY_PRESETS,
  ArabicFontInfo,
  TypographyPreset,
} from '../../../data/arabicFontsData';
import {
  Sparkles,
  Type,
  Maximize2,
  Sliders,
  Flame,
  Palette,
  AlignRight,
  AlignCenter,
  AlignLeft,
  MoveHorizontal,
  MoveVertical,
  Layers,
  Wand2,
  Play,
  RotateCcw,
  Check,
} from 'lucide-react';
import { Slider } from '../../ui/Slider';

interface TextStylePanelProps {
  textSettings: TextSettings;
  setTextSettings: React.Dispatch<React.SetStateAction<TextSettings>>;
  showTranslation: boolean;
  setShowTranslation: (val: boolean) => void;
  currentAyahText?: string;
  addToast: (
    toast: { message: string; type?: 'success' | 'error' | 'info' | 'warning' } | any
  ) => void;
}

export const TextStylePanel: React.FC<TextStylePanelProps> = ({
  textSettings,
  setTextSettings,
  showTranslation,
  setShowTranslation,
  currentAyahText,
  addToast,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'font' | 'spacing' | 'fx' | 'motion' | 'translation'
  >('font');
  const [fontCategoryFilter, setFontCategoryFilter] = useState<string>('all');

  const sampleSnippet = currentAyahText
    ? currentAyahText.length > 55
      ? currentAyahText.slice(0, 52) + '...'
      : currentAyahText
    : 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ';

  const filteredFonts =
    fontCategoryFilter === 'all'
      ? ARABIC_FONTS
      : ARABIC_FONTS.filter((f) => f.category === fontCategoryFilter);

  const applyPreset = (preset: TypographyPreset) => {
    setTextSettings((s) => ({
      ...s,
      fontFamily: preset.fontFamily,
      fontSize: preset.fontSize,
      lineHeight: preset.lineHeight,
      wordSpacing: preset.wordSpacing,
      letterSpacing: preset.letterSpacing,
      enableShadow: preset.enableShadow,
      shadowBlur: preset.shadowBlur,
      shadowColor: preset.shadowColor,
      shadowOffsetY: preset.shadowOffsetY,
      enableGlow: preset.enableGlow,
      glowColor: preset.glowColor,
      glowIntensity: preset.glowIntensity,
      enableStroke: preset.enableStroke,
      strokeColor: preset.strokeColor,
      strokeWidth: preset.strokeWidth,
      textGradient: preset.textGradient || 'none',
      textAnimation: preset.textAnimation || 'wordByWord',
      wordHighlightColor: preset.wordHighlightColor || s.wordHighlightColor,
    }));
    addToast({ message: `تم تطبيق نمط «${preset.name}» بنجاح ✨`, type: 'success' });
  };

  const handleResetSpacing = () => {
    setTextSettings((s) => ({
      ...s,
      lineHeight: 2.2,
      wordSpacing: 0,
      letterSpacing: 0,
    }));
    addToast({ message: 'تمت استعادة المسافات الافتراضية 🔄', type: 'info' });
  };

  return (
    <div className="space-y-4 animate-in">
      {/* Sub-Navigation Tabs */}
      <div className="grid grid-cols-5 gap-1 p-1 bg-surface-900/90 rounded-2xl border border-white/[0.06] text-xs font-bold">
        {[
          { id: 'font', label: 'الخطوط', icon: '🔤' },
          { id: 'spacing', label: 'المسافات', icon: '📐' },
          { id: 'fx', label: 'المؤثرات', icon: '✨' },
          { id: 'motion', label: 'الحركة', icon: '🎬' },
          { id: 'translation', label: 'الترجمة', icon: '🌐' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`py-2 rounded-xl transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
              activeSubTab === tab.id
                ? 'bg-gradient-to-b from-gold-500 to-amber-500 text-surface-950 font-black shadow-sm'
                : 'text-white/50 hover:text-white hover:bg-surface-800/60'
            }`}
          >
            <span className="text-xs">{tab.icon}</span>
            <span className="text-[11px] truncate">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ===================== TAB 1: FONTS & LIVE PREVIEW ===================== */}
      {activeSubTab === 'font' && (
        <div className="space-y-4">
          {/* Display Mode (Chunked vs Single Ayah) */}
          <div className="p-3 rounded-2xl bg-surface-900/90 border border-gold-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-white font-bold text-xs">نمط تقسيم الآيات 🎬</label>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-gold-500/15 text-gold-300 font-bold border border-gold-400/20">
                {textSettings.displayMode === 'single_ayah' ? 'الآية كاملة 📜' : 'تقسيم ذكي ⚡'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'chunked', label: 'تقسيم ذكي (سريع للريلز)', icon: '✂️' },
                { id: 'single_ayah', label: 'الآية كاملة (متصلة)', icon: '📜' },
              ].map((m) => {
                const isSelected = (textSettings.displayMode || 'chunked') === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setTextSettings((s) => ({ ...s, displayMode: m.id as any }))}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      isSelected
                        ? 'bg-gold-500/20 border-gold-400 text-white font-bold shadow-sm'
                        : 'bg-surface-800/60 border-white/[0.04] text-white/50 hover:text-white'
                    }`}
                  >
                    <span>{m.icon}</span>
                    <span className="text-xs">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Font Category Filter Chips */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 custom-scrollbar">
            {[
              { id: 'all', label: 'الكل (11 خط)' },
              { id: 'quranic', label: '🕌 خطوط قرآنية' },
              { id: 'modern', label: '⚡ خطوط ريلز' },
              { id: 'kufi', label: '🏛️ كوفي' },
              { id: 'artistic', label: '🎨 فني' },
              { id: 'ruqaa', label: '✍️ رقعة' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setFontCategoryFilter(cat.id)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold shrink-0 transition-all cursor-pointer ${
                  fontCategoryFilter === cat.id
                    ? 'bg-gold-500 text-surface-950 shadow-sm'
                    : 'bg-surface-900 border border-white/[0.06] text-white/60 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Live Font Cards Grid */}
          <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1 custom-scrollbar">
            {filteredFonts.map((font) => {
              const isSelected = (textSettings.fontFamily || 'Amiri') === font.id;
              return (
                <div
                  key={font.id}
                  onClick={() => {
                    setTextSettings((s) => ({ ...s, fontFamily: font.id }));
                    addToast({ message: `تم اختيار خط «${font.name}» ✨`, type: 'info' });
                  }}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer group ${
                    isSelected
                      ? 'bg-gold-500/15 border-gold-400 shadow-md shadow-gold-500/10 ring-1 ring-gold-400/40'
                      : 'bg-surface-900/80 hover:bg-surface-800/90 border-white/[0.06] hover:border-gold-400/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white group-hover:text-gold-300 transition-colors">
                        {font.name}
                      </span>
                      <span className="text-[10px] px-2 py-0.2 rounded-full bg-white/[0.06] text-white/60 font-mono">
                        {font.categoryLabel}
                      </span>
                    </div>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-gold-500 text-surface-950 flex items-center justify-center text-xs font-bold shadow-sm">
                        ✓
                      </span>
                    )}
                  </div>

                  {/* Live Quranic Snippet in Exact Font */}
                  <div
                    className="p-2.5 rounded-xl bg-surface-950/80 border border-white/[0.04] text-center my-1.5 text-sm transition-all"
                    style={{
                      fontFamily: font.googleFontFamily,
                      direction: 'rtl',
                      color: isSelected ? '#fbbf24' : '#e2e8f0',
                      lineHeight: 1.8,
                    }}
                  >
                    {sampleSnippet}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-white/40 pt-1">
                    <span className="truncate max-w-[200px]">{font.description}</span>
                    <span className="text-gold-400/80 font-bold shrink-0">{font.tag}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Font Basic Controls: Size, Weight, Alignment */}
          <div className="p-3.5 rounded-2xl bg-surface-900/90 border border-white/[0.06] space-y-3">
            <Slider
              label="حجم خط الآيات"
              min={16}
              max={56}
              value={textSettings.fontSize}
              accentColor="gold"
              unit="px"
              onChange={(val) => setTextSettings((s) => ({ ...s, fontSize: val }))}
            />

            {/* Font Weight & Alignment */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/[0.06]">
              <div>
                <label className="block text-xs font-bold text-white/70 mb-1.5">
                  وزن وسُمك الخط
                </label>
                <div className="grid grid-cols-3 gap-1 bg-surface-950 p-1 rounded-xl border border-white/[0.04]">
                  {[
                    { id: 'light', label: 'خفيف' },
                    { id: 'normal', label: 'عادي' },
                    { id: 'bold', label: 'عريض' },
                  ].map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => setTextSettings((s) => ({ ...s, fontWeight: w.id as any }))}
                      title={`سُمك الخط: ${w.label}`}
                      aria-label={`سُمك الخط: ${w.label}`}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        textSettings.fontWeight === w.id
                          ? 'bg-gold-500 text-surface-950 font-black shadow-sm'
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-white/70 mb-1.5">محاذاة النص</label>
                <div className="grid grid-cols-3 gap-1 bg-surface-950 p-1 rounded-xl border border-white/[0.04]">
                  {[
                    { id: 'right', icon: AlignRight, name: 'محاذاة لليمين' },
                    { id: 'center', icon: AlignCenter, name: 'توسيط النص' },
                    { id: 'left', icon: AlignLeft, name: 'محاذاة لليسار' },
                  ].map((a) => {
                    const Icon = a.icon;
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => setTextSettings((s) => ({ ...s, textAlign: a.id as any }))}
                        title={a.name}
                        aria-label={a.name}
                        className={`py-1.5 rounded-lg text-xs flex items-center justify-center transition-all cursor-pointer ${
                          textSettings.textAlign === a.id
                            ? 'bg-gold-500 text-surface-950 shadow-sm font-bold'
                            : 'text-white/60 hover:text-white'
                        }`}
                      >
                        <Icon size={14} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Text Color Palettes */}
            <div className="pt-2 border-t border-white/[0.06]">
              <label className="block text-xs font-bold text-white/70 mb-1.5">
                لون النص الأساسي
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { color: '#ffffff', name: 'أبيض ناصع' },
                  { color: '#fef08a', name: 'أصفر ذهبي' },
                  { color: '#fbbf24', name: 'ذهب ملكي' },
                  { color: '#a7f3d0', name: 'زمردي فاتح' },
                  { color: '#bae6fd', name: 'سماوي' },
                  { color: '#fed7aa', name: 'عنبر دافئ' },
                  { color: '#fbcfe8', name: 'وردي لطيف' },
                ].map((c) => (
                  <button
                    key={c.color}
                    type="button"
                    onClick={() => setTextSettings((s) => ({ ...s, textColor: c.color }))}
                    title={c.name}
                    aria-label={`اختيار لون ${c.name}`}
                    className={`w-7 h-7 rounded-xl border transition-all cursor-pointer ${
                      textSettings.textColor === c.color
                        ? 'ring-2 ring-gold-400 scale-110 border-white'
                        : 'border-white/20 opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c.color }}
                  />
                ))}
                <input
                  type="color"
                  value={textSettings.textColor || '#ffffff'}
                  onChange={(e) => setTextSettings((s) => ({ ...s, textColor: e.target.value }))}
                  className="w-7 h-7 rounded-xl bg-transparent border border-white/20 cursor-pointer"
                  title="لون مخصص"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 2: TYPOGRAPHY SPACING ===================== */}
      {activeSubTab === 'spacing' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sliders size={14} className="text-gold-400" />
              <span>التحكم الدقيق بالمسافات التايبوغرافية</span>
            </span>
            <button
              type="button"
              onClick={handleResetSpacing}
              className="text-[11px] text-gold-400 hover:text-gold-300 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw size={11} />
              <span>استعادة الافتراضي</span>
            </button>
          </div>

          {/* 1. Word Spacing */}
          <div className="p-3.5 rounded-2xl bg-surface-900/90 border border-white/[0.06]">
            <Slider
              label="المسافة بين الكلمات (Word Spacing)"
              min={-2}
              max={24}
              step={1}
              value={textSettings.wordSpacing ?? 0}
              accentColor="blue"
              unit="px"
              hint="مضغوط (-2px) ← افتراضي (0px) ← متباعد (+24px)"
              onChange={(val) => setTextSettings((s) => ({ ...s, wordSpacing: val }))}
            />
          </div>

          {/* 2. Line Height */}
          <div className="p-3.5 rounded-2xl bg-surface-900/90 border border-white/[0.06]">
            <Slider
              label="ارتفاع وتباعد الأسطر (Line Height)"
              min={1.2}
              max={2.8}
              step={0.1}
              value={textSettings.lineHeight ?? 2.2}
              accentColor="emerald"
              formatValue={(v) => v.toFixed(1)}
              hint="ضيق (1.2) ← مثالي (2.2) ← واسع ومريح (2.8)"
              onChange={(val) => setTextSettings((s) => ({ ...s, lineHeight: val }))}
            />
          </div>

          {/* 3. Letter Spacing */}
          <div className="p-3.5 rounded-2xl bg-surface-900/90 border border-white/[0.06]">
            <Slider
              label="المسافة بين الحروف (Letter Spacing)"
              min={-2}
              max={10}
              step={0.5}
              value={textSettings.letterSpacing ?? 0}
              accentColor="amber"
              unit="px"
              hint="متصل طبيعي (0px) ← متباعد (+10px)"
              onChange={(val) => setTextSettings((s) => ({ ...s, letterSpacing: val }))}
            />
          </div>
        </div>
      )}

      {/* ===================== TAB 3: TEXT EFFECTS (SHADOW, GLOW, STROKE, GRADIENT) ===================== */}
      {activeSubTab === 'fx' && (
        <div className="space-y-4">
          {/* Quick 1-Click Typography Presets */}
          <div className="p-3 rounded-2xl bg-surface-900/90 border border-gold-500/20 space-y-2">
            <label className="text-xs font-bold text-white flex items-center gap-1.5">
              <Wand2 size={14} className="text-gold-400" />
              <span>أنماط بصرية جاهزة بضغطة زر (1-Click Styles) 🎨</span>
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {TYPOGRAPHY_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className="p-2 rounded-xl bg-surface-950/80 hover:bg-surface-800 border border-white/[0.06] hover:border-gold-400/40 text-right transition-all cursor-pointer flex items-center gap-2 group"
                >
                  <span className="text-base shrink-0">{p.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-white text-xs group-hover:text-gold-300 transition-colors truncate">
                      {p.name}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 1. Drop Shadow Control */}
          <div className="p-3.5 rounded-2xl bg-surface-900/90 border border-white/[0.06] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-black/60 flex items-center justify-center text-xs">
                  🌑
                </div>
                <div>
                  <span className="font-bold text-white text-xs block">
                    ظل النص السينمائي (Drop Shadow)
                  </span>
                  <span className="text-[11px] text-white/40">يعزل الآية عن الخلفية بوضوح تام</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={textSettings.enableShadow ?? true}
                onChange={(e) => setTextSettings((s) => ({ ...s, enableShadow: e.target.checked }))}
                className="toggle cursor-pointer"
              />
            </div>

            {(textSettings.enableShadow ?? true) && (
              <div className="space-y-3 pt-2 border-t border-white/[0.04]">
                <Slider
                  label="شدة التمويه والانتشار (Shadow Blur)"
                  min={0}
                  max={35}
                  value={textSettings.shadowBlur ?? 14}
                  accentColor="gold"
                  unit="px"
                  onChange={(val) => setTextSettings((s) => ({ ...s, shadowBlur: val }))}
                />

                <Slider
                  label="إزاحة الظل العمودي (Offset Y)"
                  min={-10}
                  max={20}
                  value={textSettings.shadowOffsetY ?? 3}
                  accentColor="gold"
                  unit="px"
                  onChange={(val) => setTextSettings((s) => ({ ...s, shadowOffsetY: val }))}
                />
              </div>
            )}
          </div>

          {/* 2. Glow Effect Control */}
          <div className="p-3.5 rounded-2xl bg-surface-900/90 border border-white/[0.06] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-gold-500/20 text-gold-400 flex items-center justify-center text-xs">
                  ✨
                </div>
                <div>
                  <span className="font-bold text-white text-xs block">
                    التوهج والنور الإلهي (Glow Effect)
                  </span>
                  <span className="text-[11px] text-white/40">
                    هالة روحانية مشعة حول حروف الآية
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={textSettings.enableGlow ?? false}
                onChange={(e) => setTextSettings((s) => ({ ...s, enableGlow: e.target.checked }))}
                className="toggle cursor-pointer"
              />
            </div>

            {(textSettings.enableGlow ?? false) && (
              <div className="space-y-3 pt-2 border-t border-white/[0.04]">
                <div>
                  <label className="block text-xs font-bold text-white/60 mb-1.5">لون التوهج</label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[
                      { color: '#fbbf24', label: 'ذهبي 👑' },
                      { color: '#ffffff', label: 'أبيض ⚪' },
                      { color: '#34d399', label: 'زمردي 🌿' },
                      { color: '#38bdf8', label: 'سماوي 🌌' },
                      { color: '#f472b6', label: 'وردي 🌸' },
                    ].map((g) => (
                      <button
                        key={g.color}
                        type="button"
                        onClick={() => setTextSettings((s) => ({ ...s, glowColor: g.color }))}
                        className={`p-1.5 rounded-xl border text-center text-[11px] font-bold transition-all cursor-pointer ${
                          (textSettings.glowColor || '#fbbf24') === g.color
                            ? 'ring-2 ring-gold-400 border-white text-white shadow-md'
                            : 'border-white/10 text-white/50 hover:text-white'
                        }`}
                        style={{ backgroundColor: `${g.color}22` }}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>

                <Slider
                  label="شدة التوهج والبريق (Glow Intensity)"
                  min={4}
                  max={40}
                  value={textSettings.glowIntensity ?? 16}
                  accentColor="gold"
                  unit="px"
                  onChange={(val) => setTextSettings((s) => ({ ...s, glowIntensity: val }))}
                />
              </div>
            )}
          </div>

          {/* 3. Text Stroke / Outline */}
          <div className="p-3.5 rounded-2xl bg-surface-900/90 border border-white/[0.06] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs">
                  🖋️
                </div>
                <div>
                  <span className="font-bold text-white text-xs block">
                    حدود النص (Text Stroke / Outline)
                  </span>
                  <span className="text-[11px] text-white/40">
                    إطار يحدد الحروف لمنع تشويش الخلفيات الصعبة
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={textSettings.enableStroke ?? false}
                onChange={(e) => setTextSettings((s) => ({ ...s, enableStroke: e.target.checked }))}
                className="toggle cursor-pointer"
              />
            </div>

            {(textSettings.enableStroke ?? false) && (
              <div className="space-y-3 pt-2 border-t border-white/[0.04]">
                <Slider
                  label="سُمك الحد الخارجي (Stroke Width)"
                  min={0.5}
                  max={4.0}
                  step={0.5}
                  value={textSettings.strokeWidth ?? 1}
                  accentColor="amber"
                  unit="px"
                  onChange={(val) => setTextSettings((s) => ({ ...s, strokeWidth: val }))}
                />

                <div>
                  <label className="block text-xs font-bold text-white/60 mb-1.5">لون الحد</label>
                  <div className="flex items-center gap-2">
                    {[
                      { color: '#000000', label: 'أسود كاحل' },
                      { color: '#fbbf24', label: 'ذهبي' },
                      { color: '#ffffff', label: 'أبيض' },
                      { color: '#0f172a', label: 'كحلي داكن' },
                    ].map((st) => (
                      <button
                        key={st.color}
                        type="button"
                        onClick={() => setTextSettings((s) => ({ ...s, strokeColor: st.color }))}
                        className={`px-3 py-1 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                          (textSettings.strokeColor || '#000000') === st.color
                            ? 'bg-purple-500 text-white border-purple-400 shadow-sm'
                            : 'bg-surface-950 border-white/10 text-white/50 hover:text-white'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 4. Text Gradient Fill */}
          <div className="p-3.5 rounded-2xl bg-surface-900/90 border border-white/[0.06] space-y-2.5">
            <label className="text-xs font-bold text-white flex items-center gap-1.5">
              <Palette size={14} className="text-gold-400" />
              <span>التدرج اللوني للنص (Gradient Fill)</span>
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'none', label: 'أحادي اللون ⚪' },
                { id: 'gold', label: 'ذهب ملكي 👑' },
                { id: 'silver', label: 'فضي لامع 🪙' },
                { id: 'emerald', label: 'زمردي نوراني 🌿' },
                { id: 'amber', label: 'عنبر دافئ 🔥' },
                { id: 'celestial', label: 'سماوي كوني 🌌' },
              ].map((grad) => (
                <button
                  key={grad.id}
                  type="button"
                  onClick={() => setTextSettings((s) => ({ ...s, textGradient: grad.id as any }))}
                  className={`p-2 rounded-xl border text-center text-[11px] font-bold transition-all cursor-pointer ${
                    (textSettings.textGradient || 'none') === grad.id
                      ? 'bg-gold-500/20 border-gold-400 text-white shadow-md'
                      : 'bg-surface-950 border-white/[0.06] text-white/50 hover:text-white'
                  }`}
                >
                  {grad.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 4: MOTION & KARAOKE ===================== */}
      {activeSubTab === 'motion' && (
        <div className="space-y-4">
          {/* Text Motion Animation Selector */}
          <div className="p-3.5 rounded-2xl bg-surface-900/90 border border-white/[0.06] space-y-2.5">
            <label className="text-xs font-bold text-white flex items-center gap-1.5">
              <Play size={14} className="text-sky-400" />
              <span>نمط حركة وظهور النص (Text Motion Animation)</span>
            </label>

            <div className="grid grid-cols-2 gap-1.5">
              {[
                {
                  id: 'wordByWord',
                  label: 'كلمة بكلمة (كاريوكي)',
                  sub: 'تزامن دقيق مع التلاوة',
                  icon: '⚡',
                },
                { id: 'fadeIn', label: 'ظهور تدريجي ناعم', sub: 'انتقال سينمائي هادئ', icon: '🕊️' },
                { id: 'lineByLine', label: 'سطر بسطر', sub: 'انزلاق متتابع', icon: '📜' },
                {
                  id: 'typewriter',
                  label: 'كتابة تلقائية (Typewriter)',
                  sub: 'كتابة فورية حرف بحرف',
                  icon: '⌨️',
                },
                {
                  id: 'scaleBounce',
                  label: 'نبض وتكبير (Scale Pop)',
                  sub: 'حركة تفاعلية جذابة',
                  icon: '💫',
                },
                {
                  id: 'glowPulse',
                  label: 'نبض التوهج (Glow Pulse)',
                  sub: 'إشعاع نوراني مستمر',
                  icon: '✨',
                },
              ].map((anim) => (
                <button
                  key={anim.id}
                  type="button"
                  onClick={() => {
                    setTextSettings((s) => ({
                      ...s,
                      textAnimation: anim.id as any,
                      wordHighlightEnabled:
                        anim.id === 'wordByWord' ? true : s.wordHighlightEnabled,
                    }));
                    addToast({ message: `تم تفعيل تأثير «${anim.label}» 🎬`, type: 'info' });
                  }}
                  className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer flex items-start gap-2 ${
                    (textSettings.textAnimation || 'wordByWord') === anim.id
                      ? 'bg-sky-500/20 border-sky-400 text-white font-bold shadow-md'
                      : 'bg-surface-950 border-white/[0.06] text-white/50 hover:text-white'
                  }`}
                >
                  <span className="text-base shrink-0">{anim.icon}</span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">{anim.label}</div>
                    <div className="text-[10px] text-white/40 truncate">{anim.sub}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Word-by-Word Karaoke Highlight Details */}
          <div className="p-3.5 rounded-2xl bg-surface-900/90 border border-gold-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles size={14} className="text-gold-400" />
                <span className="font-bold text-white text-xs">
                  تظليل الكلمات المتزامن (Karaoke Highlight)
                </span>
              </div>
              <input
                type="checkbox"
                checked={textSettings.wordHighlightEnabled ?? true}
                onChange={(e) =>
                  setTextSettings((s) => ({ ...s, wordHighlightEnabled: e.target.checked }))
                }
                className="toggle cursor-pointer"
              />
            </div>

            {(textSettings.wordHighlightEnabled ?? true) && (
              <div className="space-y-3 pt-2 border-t border-white/[0.04]">
                <div>
                  <label className="block text-white/50 text-xs mb-1.5">نمط التوهج والبريق</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: 'goldGlow', name: 'توهج ذهبي 👑', color: '#fbbf24' },
                      { id: 'emeraldGlow', name: 'زمردي 🌿', color: '#10b981' },
                      { id: 'radiantWhite', name: 'أبيض ناصع ⚪', color: '#ffffff' },
                      { id: 'amberEmber', name: 'عنبر دافئ 🔥', color: '#f97316' },
                      { id: 'pillBadge', name: 'كبسولة عائمة 💊', color: '#38bdf8' },
                      { id: 'underlineWave', name: 'تموج تحتي 〰️', color: '#a855f7' },
                    ].map((h) => (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() =>
                          setTextSettings((s) => ({
                            ...s,
                            wordHighlightStyle: h.id as any,
                            wordHighlightColor: h.color,
                          }))
                        }
                        className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          (textSettings.wordHighlightStyle || 'goldGlow') === h.id
                            ? 'bg-gold-500/20 border-gold-400 text-gold-300 shadow-sm'
                            : 'bg-surface-950 border-white/[0.06] text-white/50 hover:text-white'
                        }`}
                      >
                        {h.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.04] items-center">
                  <Slider
                    label="عتامة باقي الكلمات"
                    min={0.2}
                    max={1.0}
                    step={0.05}
                    value={textSettings.inactiveWordOpacity ?? 0.6}
                    accentColor="gold"
                    formatValue={(v) => `${Math.round(v * 100)}%`}
                    onChange={(val) =>
                      setTextSettings((s) => ({
                        ...s,
                        inactiveWordOpacity: val,
                      }))
                    }
                  />

                  <div className="flex flex-col justify-end">
                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-surface-950 border border-white/[0.04]">
                      <input
                        type="checkbox"
                        checked={textSettings.highlightScale ?? true}
                        onChange={(e) =>
                          setTextSettings((s) => ({ ...s, highlightScale: e.target.checked }))
                        }
                        className="rounded border-white/20 text-gold-500 focus:ring-0"
                      />
                      <span className="text-[11px] font-bold text-white">
                        تكبير الكلمة النشطة 🔍
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================== TAB 5: TRANSLATION & TAFSIR ===================== */}
      {activeSubTab === 'translation' && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-2xl bg-surface-900/90 border border-white/[0.06] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">🌐</span>
                <div>
                  <span className="font-bold text-white text-xs block">
                    ترجمة الآيات متعددة اللغات (Subtitles)
                  </span>
                  <span className="text-[11px] text-white/40">
                    تظهر أسفل النص العربي بشكل سينمائي
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={showTranslation}
                onChange={(e) => setShowTranslation(e.target.checked)}
                className="toggle cursor-pointer"
              />
            </div>

            {showTranslation && (
              <div className="space-y-3 pt-2 border-t border-white/[0.04]">
                <div>
                  <label className="block text-xs font-bold text-white/60 mb-1.5">
                    لغة الترجمة
                  </label>
                  <select
                    value={textSettings.translationLanguage || 'en'}
                    onChange={(e) =>
                      setTextSettings((s) => ({ ...s, translationLanguage: e.target.value as any }))
                    }
                    className="glass-input w-full p-2 rounded-xl text-xs bg-surface-950 border border-white/10"
                  >
                    <option value="en">English (الإنجليزية - Saheeh International)</option>
                    <option value="fr">Français (الفرنسية - Muhammad Hamidullah)</option>
                    <option value="ur">اردو (الأردية - Jalandhry)</option>
                    <option value="tr">Türkçe (التركية - Diyanet Isleri)</option>
                    <option value="es">Español (الإسبانية - Cortes)</option>
                    <option value="id">Bahasa Indonesia (الإندونيسية - Kemenag)</option>
                  </select>
                </div>

                <Slider
                  label="حجم خط الترجمة"
                  min={10}
                  max={20}
                  value={textSettings.translationFontSize || 13}
                  accentColor="gold"
                  unit="px"
                  onChange={(val) =>
                    setTextSettings((s) => ({
                      ...s,
                      translationFontSize: val,
                    }))
                  }
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
