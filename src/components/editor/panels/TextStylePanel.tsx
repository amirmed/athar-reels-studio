import React, { useState } from 'react';
import { TextSettings } from '../../../types';
import {
  ARABIC_FONTS,
  TYPOGRAPHY_PRESETS,
  TypographyPreset,
} from '../../../data/arabicFontsData';
import {
  Sparkles,
  Sliders,
  Palette,
  AlignRight,
  AlignCenter,
  AlignLeft,
  Wand2,
  Play,
  RotateCcw,
} from 'lucide-react';
import { Slider } from '../../ui/Slider';
import { SectionAccordion } from '../../ui/SectionAccordion';
import { useTranslation } from '../../../i18n';

interface TextStylePanelProps {
  textSettings: TextSettings;
  setTextSettings: React.Dispatch<React.SetStateAction<TextSettings>>;
  showTranslation: boolean;
  setShowTranslation: (val: boolean) => void;
  currentAyahText?: string;
  addToast: (
    toast: { message: string; type?: 'success' | 'error' | 'info' | 'warning' }
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
  const { t } = useTranslation();
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

  const fontCategories = [
    { id: 'all', label: t('editor.catAllFonts', 'الكل (11 خط)') },
    { id: 'quranic', label: t('editor.catQuranic', '🕌 خطوط قرآنية') },
    { id: 'modern', label: t('editor.catModern', '⚡ خطوط ريلز') },
    { id: 'kufi', label: t('editor.catKufi', '🏛️ كوفي') },
    { id: 'artistic', label: t('editor.catArtistic', '🎨 فني') },
    { id: 'ruqaa', label: t('editor.catRuqaa', '✍️ رقعة') },
  ];

  const fontWeights = [
    { id: 'light', label: t('editor.weightLight', 'خفيف') },
    { id: 'normal', label: t('editor.weightNormal', 'عادي') },
    { id: 'bold', label: t('editor.weightBold', 'عريض') },
  ];

  const textAlignments = [
    { id: 'right', icon: AlignRight, name: t('editor.alignRight', 'محاذاة لليمين') },
    { id: 'center', icon: AlignCenter, name: t('editor.alignCenter', 'توسيط النص') },
    { id: 'left', icon: AlignLeft, name: t('editor.alignLeft', 'محاذاة لليسار') },
  ];

  const textColors = [
    { color: '#ffffff', name: t('editor.colorWhite', 'أبيض') },
    { color: '#fef08a', name: 'أصفر ذهبي' },
    { color: '#fbbf24', name: t('editor.colorGold', 'ذهبي') },
    { color: '#a7f3d0', name: t('editor.colorEmerald', 'زمردي') },
    { color: '#bae6fd', name: t('editor.colorSky', 'سماوي') },
    { color: '#fed7aa', name: 'عنبر دافئ' },
    { color: '#fbcfe8', name: 'وردي لطيف' },
  ];

  const glowColors = [
    { color: '#fbbf24', label: 'ذهبي 👑' },
    { color: '#ffffff', label: 'أبيض ⚪' },
    { color: '#34d399', label: 'زمردي 🌿' },
    { color: '#38bdf8', label: 'سماوي 🌌' },
    { color: '#f472b6', label: 'وردي 🌸' },
  ];

  const strokeColors = [
    { color: '#000000', label: t('editor.strokeBlack', 'أسود كاحل') },
    { color: '#fbbf24', label: t('editor.colorGold', 'ذهبي') },
    { color: '#ffffff', label: t('editor.colorWhite', 'أبيض') },
    { color: '#0f172a', label: t('editor.strokeDarkNavy', 'كحلي داكن') },
  ];

  const textGradients = [
    { id: 'none', label: t('editor.gradNone', 'أحادي اللون ⚪') },
    { id: 'gold', label: t('editor.gradGold', 'ذهب ملكي 👑') },
    { id: 'silver', label: t('editor.gradSilver', 'فضي لامع 🪙') },
    { id: 'emerald', label: t('editor.gradEmerald', 'زمردي نوراني 🌿') },
    { id: 'amber', label: t('editor.gradAmber', 'عنبر دافئ 🔥') },
    { id: 'celestial', label: t('editor.gradCelestial', 'سماوي كوني 🌌') },
  ];

  const textAnimations = [
    {
      id: 'wordByWord',
      label: t('editor.animWordByWord', 'كلمة بكلمة (كاريوكي)'),
      sub: t('editor.animWordByWordSub', 'تزامن دقيق مع التلاوة'),
      icon: '⚡',
    },
    { id: 'fadeIn', label: t('editor.animFadeIn', 'ظهور تدريجي ناعم'), sub: t('editor.animFadeInSub', 'انتقال سينمائي هادئ'), icon: '🕊️' },
    { id: 'lineByLine', label: t('editor.animLineByLine', 'سطر بسطر'), sub: t('editor.animLineByLineSub', 'انزلاق متتابع'), icon: '📜' },
    {
      id: 'typewriter',
      label: t('editor.animTypewriter', 'كتابة تلقائية (Typewriter)'),
      sub: t('editor.animTypewriterSub', 'كتابة فورية حرف بحرف'),
      icon: '⌨️',
    },
    {
      id: 'scaleBounce',
      label: t('editor.animScaleBounce', 'نبض وتكبير (Scale Pop)'),
      sub: t('editor.animScaleBounceSub', 'حركة تفاعلية جذابة'),
      icon: '💫',
    },
    {
      id: 'glowPulse',
      label: t('editor.animGlowPulse', 'نبض التوهج (Glow Pulse)'),
      sub: t('editor.animGlowPulseSub', 'إشعاع نوراني مستمر'),
      icon: '✨',
    },
  ];

  const highlightStyles = [
    { id: 'emeraldGlow', name: t('editor.hlEmeraldGlow', 'زمردي 🌿'), color: '#10b981' },
    { id: 'radiantWhite', name: t('editor.hlRadiantWhite', 'أبيض ناصع ⚪'), color: '#ffffff' },
    { id: 'amberEmber', name: t('editor.hlAmberEmber', 'عنبر دافئ 🔥'), color: '#f97316' },
    { id: 'pillBadge', name: t('editor.hlPillBadge', 'كبسولة عائمة 💊'), color: '#38bdf8' },
    { id: 'underlineWave', name: t('editor.hlUnderlineWave', 'تموج تحتي 〰️'), color: '#a855f7' },
  ];

  return (
    <div className="space-y-4 animate-in">
      {/* Sub-Navigation Tabs */}
      <div className="grid grid-cols-5 gap-1 p-1 bg-surface-900/90 rounded-2xl border border-surface-700/40 text-xs font-bold">
        {[
          { id: 'font', label: t('editor.tabFonts', 'الخطوط'), icon: '🔤' },
          { id: 'spacing', label: t('editor.tabSpacing', 'المسافات'), icon: '📐' },
          { id: 'fx', label: t('editor.tabFx', 'المؤثرات'), icon: '✨' },
          { id: 'motion', label: t('editor.tabMotion', 'الحركة'), icon: '🎬' },
          { id: 'translation', label: t('editor.tabTranslation', 'الترجمة'), icon: '🌐' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveSubTab(tab.id as 'font' | 'spacing' | 'fx' | 'motion' | 'translation')}
            className={`py-2 rounded-xl transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
              activeSubTab === tab.id
                ? 'bg-gradient-to-b from-gold-500 to-amber-500 text-surface-950 font-black shadow-sm'
                : 'text-surface-400 hover:text-surface-50 hover:bg-surface-800/60'
            }`}
          >
            <span className="text-xs">{tab.icon}</span>
            <span className="text-[11px] truncate">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ===================== TAB 1: FONTS & LIVE PREVIEW ===================== */}
      {activeSubTab === 'font' && (
        <div className="space-y-3">
          {/* Display Mode & Font Picker */}
          <SectionAccordion
            title={t('editor.splitAndFontsTitle', 'تقسيم الآيات ومكتبة الخطوط')}
            icon={<Wand2 size={16} className="text-gold-400" />}
            defaultOpen={true}
          >
            {/* Display Mode (Chunked vs Single Ayah) */}
            <div className="p-3 rounded-2xl bg-surface-900 border border-gold-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-surface-50 font-bold text-xs">{t('editor.splitModeLabel', 'نمط تقسيم الآيات 🎬')}</label>
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-gold-500/15 text-gold-700 dark:text-gold-300 font-bold border border-gold-400/20">
                  {textSettings.displayMode === 'single_ayah'
                    ? t('editor.splitModeFullAyah', 'الآية كاملة 📜')
                    : t('editor.splitModeChunked', 'تقسيم ذكي ⚡')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'chunked', label: t('editor.splitChunkedBtn', 'تقسيم ذكي (سريع للريلز)'), icon: '✂️' },
                  { id: 'single_ayah', label: t('editor.splitFullAyahBtn', 'الآية كاملة (متصلة)'), icon: '📜' },
                ].map((m) => {
                  const isSelected = (textSettings.displayMode || 'chunked') === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setTextSettings((s) => ({ ...s, displayMode: m.id as 'chunked' | 'single_ayah' }))}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        isSelected
                          ? 'bg-gold-500/20 border-gold-400 text-surface-50 font-bold shadow-sm'
                          : 'bg-surface-800/60 border-surface-700/40 text-surface-400 hover:text-surface-50'
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
              {fontCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setFontCategoryFilter(cat.id)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold shrink-0 transition-all cursor-pointer ${
                    fontCategoryFilter === cat.id
                      ? 'bg-gold-500 text-surface-950 shadow-sm'
                      : 'bg-surface-900 border border-surface-700/40 text-surface-300 hover:text-surface-50'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Live Font Cards Grid */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto pe-1 custom-scrollbar">
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
                        : 'bg-surface-900/80 hover:bg-surface-800/90 border-surface-700/40 hover:border-gold-400/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-surface-50 group-hover:text-gold-300 transition-colors">
                          {font.name}
                        </span>
                        <span className="text-[10px] text-surface-400 font-mono">({font.id})</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-800 text-surface-300 border border-surface-700/40">
                        {font.categoryLabel}
                      </span>
                    </div>

                    <div
                      className="text-start text-base leading-relaxed py-1 transition-all select-none"
                      style={{
                        fontFamily: font.googleFontFamily,
                        color: isSelected ? '#fbbf24' : '#e2e8f0',
                      }}
                    >
                      {sampleSnippet}
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionAccordion>

          {/* Size, Weight, Alignment, Color */}
          <SectionAccordion
            title={t('editor.sizeWeightColorTitle', 'حجم وسُمك ولون النص')}
            icon={<Sliders size={16} className="text-gold-400" />}
            defaultOpen={true}
          >
            <div className="p-3.5 rounded-2xl bg-surface-900/90 border border-surface-700/40 space-y-3">
              <Slider
                label={t('editor.fontSizeLabel', 'حجم الخط (Font Size)')}
                min={16}
                max={56}
                value={textSettings.fontSize}
                accentColor="gold"
                unit="px"
                onChange={(val) => setTextSettings((s) => ({ ...s, fontSize: val }))}
              />

              {/* Font Weight & Alignment */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-surface-700/40">
                <div>
                  <label className="block text-xs font-bold text-surface-300 mb-1.5">
                    {t('editor.fontWeightLabel', 'وزن وسُمك الخط')}
                  </label>
                  <div className="grid grid-cols-3 gap-1 bg-surface-950 p-1 rounded-xl border border-surface-700/30">
                    {fontWeights.map((w) => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => setTextSettings((s) => ({ ...s, fontWeight: w.id as 'normal' | 'bold' }))}
                        title={`سُمك الخط: ${w.label}`}
                        aria-label={`سُمك الخط: ${w.label}`}
                        className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          textSettings.fontWeight === w.id
                            ? 'bg-gold-500 text-surface-950 font-black shadow-sm'
                            : 'text-surface-400 hover:text-surface-50'
                        }`}
                      >
                        {w.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-surface-300 mb-1.5">{t('editor.textAlignLabel', 'محاذاة النص')}</label>
                  <div className="grid grid-cols-3 gap-1 bg-surface-950 p-1 rounded-xl border border-surface-700/30">
                    {textAlignments.map((a) => {
                      const Icon = a.icon;
                      return (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => setTextSettings((s) => ({ ...s, textAlign: a.id as 'right' | 'center' | 'left' }))}
                          title={a.name}
                          aria-label={a.name}
                          className={`py-1.5 rounded-lg text-xs flex items-center justify-center transition-all cursor-pointer ${
                            textSettings.textAlign === a.id
                              ? 'bg-gold-500 text-surface-950 shadow-sm font-bold'
                              : 'text-surface-400 hover:text-surface-50'
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
              <div className="pt-2 border-t border-surface-700/40">
                <label className="block text-xs font-bold text-surface-300 mb-1.5">
                  {t('editor.textColorLabel', 'لون النص الأساسي')}
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {textColors.map((c) => (
                    <button
                      key={c.color}
                      type="button"
                      onClick={() => setTextSettings((s) => ({ ...s, textColor: c.color }))}
                      title={c.name}
                      aria-label={`اختيار لون ${c.name}`}
                      className={`w-7 h-7 rounded-xl border transition-all cursor-pointer ${
                        textSettings.textColor === c.color
                          ? 'ring-2 ring-gold-400 scale-110 border-white'
                          : 'border-surface-700/40 opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c.color }}
                    />
                  ))}
                  <input
                    type="color"
                    value={textSettings.textColor || '#ffffff'}
                    onChange={(e) => setTextSettings((s) => ({ ...s, textColor: e.target.value }))}
                    className="w-7 h-7 rounded-xl bg-transparent border border-surface-700/40 cursor-pointer"
                    title="لون مخصص"
                  />
                </div>
              </div>
            </div>
          </SectionAccordion>
        </div>
      )}

      {/* ===================== TAB 2: TYPOGRAPHY SPACING ===================== */}
      {activeSubTab === 'spacing' && (
        <div className="space-y-3">
          <SectionAccordion
            title={t('editor.spacingControlTitle', 'التحكم الدقيق بالمسافات التايبوغرافية')}
            icon={<Sliders size={16} className="text-gold-400" />}
            defaultOpen={true}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-surface-400">{t('editor.spacingSubtitle', 'ضبط المسافات والارتفاع بالبكسل')}</span>
              <button
                type="button"
                onClick={handleResetSpacing}
                className="text-[11px] text-gold-400 hover:text-gold-300 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw size={11} />
                <span>{t('editor.resetDefaultBtn', 'استعادة الافتراضي')}</span>
              </button>
            </div>

            {/* 1. Word Spacing */}
            <div className="p-3.5 rounded-2xl bg-surface-900/90 border border-surface-700/40">
              <Slider
                label={t('editor.wordSpacingLabel', 'المسافة بين الكلمات (Word Spacing)')}
                min={-2}
                max={24}
                step={1}
                value={textSettings.wordSpacing ?? 0}
                accentColor="blue"
                unit="px"
                hint={t('editor.wordSpacingHint', 'مضغوط (-2px) ← افتراضي (0px) ← متباعد (+24px)')}
                onChange={(val) => setTextSettings((s) => ({ ...s, wordSpacing: val }))}
              />
            </div>

            {/* 2. Line Height */}
            <div className="p-3.5 rounded-2xl bg-surface-900/90 border border-surface-700/40">
              <Slider
                label={t('editor.lineHeightLabel', 'ارتفاع وتباعد الأسطر (Line Height)')}
                min={1.2}
                max={2.8}
                step={0.1}
                value={textSettings.lineHeight ?? 2.2}
                accentColor="emerald"
                formatValue={(v) => v.toFixed(1)}
                hint={t('editor.lineHeightHint', 'ضيق (1.2) ← مثالي (2.2) ← واسع ومريح (2.8)')}
                onChange={(val) => setTextSettings((s) => ({ ...s, lineHeight: val }))}
              />
            </div>

            {/* 3. Letter Spacing */}
            <div className="p-3.5 rounded-2xl bg-surface-900/90 border border-surface-700/40">
              <Slider
                label={t('editor.letterSpacingLabel', 'المسافة بين الحروف (Letter Spacing)')}
                min={-2}
                max={10}
                step={0.5}
                value={textSettings.letterSpacing ?? 0}
                accentColor="amber"
                unit="px"
                hint={t('editor.letterSpacingHint', 'متصل طبيعي (0px) ← متباعد (+10px)')}
                onChange={(val) => setTextSettings((s) => ({ ...s, letterSpacing: val }))}
              />
            </div>
          </SectionAccordion>
        </div>
      )}

      {/* ===================== TAB 3: TEXT EFFECTS (SHADOW, GLOW, STROKE, GRADIENT) ===================== */}
      {activeSubTab === 'fx' && (
        <div className="space-y-3">
          {/* Quick 1-Click Typography Presets */}
          <SectionAccordion
            title={t('editor.visualPresetsTitle', 'أنماط بصرية جاهزة (1-Click Presets)')}
            icon={<Wand2 size={16} className="text-gold-400" />}
            defaultOpen={true}
          >
            <div className="grid grid-cols-2 gap-1.5">
              {TYPOGRAPHY_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className="p-2 rounded-xl bg-surface-950/80 hover:bg-surface-800 border border-surface-700/40 hover:border-gold-400/40 text-start transition-all cursor-pointer flex items-center gap-2 group"
                >
                  <span className="text-base shrink-0">{p.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-surface-50 text-xs group-hover:text-gold-300 transition-colors truncate">
                      {p.name}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </SectionAccordion>

          {/* 1. Drop Shadow Control */}
          <SectionAccordion
            title={t('editor.dropShadowTitle', 'ظل النص السينمائي (Drop Shadow)')}
            icon={<Sparkles size={16} className="text-gold-400" />}
            defaultOpen={true}
          >
            <div className="p-3.5 rounded-2xl bg-surface-900/90 border border-surface-700/40 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-surface-50 text-xs block">
                    {t('editor.toggleShadow', 'تفعيل ظل النص')}
                  </span>
                  <span className="text-[11px] text-surface-400">{t('editor.shadowDesc', 'يعزل الآية عن الخلفية بوضوح تام')}</span>
                </div>
                <input
                  type="checkbox"
                  checked={textSettings.enableShadow ?? true}
                  onChange={(e) => setTextSettings((s) => ({ ...s, enableShadow: e.target.checked }))}
                  className="toggle cursor-pointer"
                />
              </div>

              {(textSettings.enableShadow ?? true) && (
                <div className="space-y-3 pt-2 border-t border-surface-700/30">
                  <Slider
                    label={t('editor.shadowBlurLabel', 'شدة التمويه والانتشار (Shadow Blur)')}
                    min={0}
                    max={35}
                    value={textSettings.shadowBlur ?? 14}
                    accentColor="gold"
                    unit="px"
                    onChange={(val) => setTextSettings((s) => ({ ...s, shadowBlur: val }))}
                  />

                  <Slider
                    label={t('editor.shadowOffsetYLabel', 'إزاحة الظل العمودي (Offset Y)')}
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
          </SectionAccordion>

          {/* 2. Glow Effect Control */}
          <SectionAccordion
            title={t('editor.glowEffectTitle', 'التوهج والنور الإلهي (Glow Effect)')}
            icon={<Sparkles size={16} className="text-gold-400" />}
            defaultOpen={true}
          >
            <div className="p-3.5 rounded-2xl bg-surface-900/90 border border-surface-700/40 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-surface-50 text-xs block">
                    {t('editor.toggleGlow', 'تفعيل التوهج')}
                  </span>
                  <span className="text-[11px] text-surface-400">
                    {t('editor.glowDesc', 'هالة روحانية مشعة حول حروف الآية')}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={textSettings.enableGlow ?? false}
                  onChange={(e) => setTextSettings((s) => ({ ...s, enableGlow: e.target.checked }))}
                  className="toggle cursor-pointer"
                />
              </div>

              {(textSettings.enableGlow ?? false) && (
                <div className="space-y-3 pt-2 border-t border-surface-700/30">
                  <div>
                    <label className="block text-xs font-bold text-surface-400 mb-1.5">{t('editor.glowColorLabel', 'لون التوهج')}</label>
                    <div className="grid grid-cols-5 gap-1.5">
                      {glowColors.map((g) => (
                        <button
                          key={g.color}
                          type="button"
                          onClick={() => setTextSettings((s) => ({ ...s, glowColor: g.color }))}
                          className={`p-1.5 rounded-xl border text-center text-[11px] font-bold transition-all cursor-pointer ${
                            (textSettings.glowColor || '#fbbf24') === g.color
                              ? 'ring-2 ring-gold-400 border-gold-500 text-surface-50 shadow-md font-black'
                              : 'border-surface-700/40 text-surface-400 hover:text-surface-50'
                          }`}
                          style={{ backgroundColor: `${g.color}22` }}
                        >
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Slider
                    label={t('editor.glowIntensityLabel', 'شدة التوهج والبريق (Glow Intensity)')}
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
          </SectionAccordion>

          {/* 3. Text Stroke / Outline */}
          <SectionAccordion
            title={t('editor.textStrokeTitle', 'حدود النص (Text Stroke / Outline)')}
            icon={<Sliders size={16} className="text-gold-400" />}
            defaultOpen={false}
          >
            <div className="p-3.5 rounded-2xl bg-surface-900/90 border border-surface-700/40 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-surface-50 text-xs block">
                    {t('editor.toggleStroke', 'حدود النص (Stroke)')}
                  </span>
                  <span className="text-[11px] text-surface-400">
                    {t('editor.strokeDesc', 'إطار يحدد الحروف لمنع تشويش الخلفيات الصعبة')}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={textSettings.enableStroke ?? false}
                  onChange={(e) => setTextSettings((s) => ({ ...s, enableStroke: e.target.checked }))}
                  className="toggle cursor-pointer"
                />
              </div>

              {(textSettings.enableStroke ?? false) && (
                <div className="space-y-3 pt-2 border-t border-surface-700/30">
                  <Slider
                    label={t('editor.strokeWidthLabel', 'سُمك الحد الخارجي (Stroke Width)')}
                    min={0.5}
                    max={4.0}
                    step={0.5}
                    value={textSettings.strokeWidth ?? 1}
                    accentColor="amber"
                    unit="px"
                    onChange={(val) => setTextSettings((s) => ({ ...s, strokeWidth: val }))}
                  />

                  <div>
                    <label className="block text-xs font-bold text-surface-400 mb-1.5">{t('editor.strokeColorLabel', 'لون الحد')}</label>
                    <div className="flex items-center gap-2">
                      {strokeColors.map((st) => (
                        <button
                          key={st.color}
                          type="button"
                          onClick={() => setTextSettings((s) => ({ ...s, strokeColor: st.color }))}
                          className={`px-3 py-1 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                            (textSettings.strokeColor || '#000000') === st.color
                              ? 'bg-purple-500 text-white border-purple-400 shadow-sm'
                              : 'bg-surface-950 border-surface-700/40 text-surface-400 hover:text-surface-50'
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
          </SectionAccordion>

          {/* 4. Text Gradient Fill */}
          <SectionAccordion
            title={t('editor.textGradientTitle', 'التدرج اللوني للنص (Gradient Fill)')}
            icon={<Palette size={16} className="text-gold-400" />}
            defaultOpen={false}
          >
            <div className="p-3.5 rounded-2xl bg-surface-900/90 border border-surface-700/40 space-y-2.5">
              <div className="grid grid-cols-3 gap-1.5">
                {textGradients.map((grad) => (
                  <button
                    key={grad.id}
                    type="button"
                    onClick={() => setTextSettings((s) => ({ ...s, textGradient: grad.id as 'none' | 'gold' | 'emerald' | 'sunset' | 'royal' | 'amber' | 'celestial' }))}
                    className={`p-2 rounded-xl border text-center text-[11px] font-bold transition-all cursor-pointer ${
                      (textSettings.textGradient || 'none') === grad.id
                        ? 'bg-gold-500/20 border-gold-400 text-surface-50 shadow-md'
                        : 'bg-surface-950 border-surface-700/40 text-surface-400 hover:text-surface-50'
                    }`}
                  >
                    {grad.label}
                  </button>
                ))}
              </div>
            </div>
          </SectionAccordion>
        </div>
      )}

      {/* ===================== TAB 4: MOTION & KARAOKE ===================== */}
      {activeSubTab === 'motion' && (
        <div className="space-y-3">
          {/* Text Motion Animation Selector */}
          <SectionAccordion
            title={t('editor.motionAnimTitle', 'نمط حركة وظهور النص (Text Motion Animation)')}
            icon={<Play size={16} className="text-gold-400" />}
            defaultOpen={true}
          >
            <div className="grid grid-cols-2 gap-1.5">
              {textAnimations.map((anim) => (
                <button
                  key={anim.id}
                  type="button"
                  onClick={() => {
                    setTextSettings((s) => ({
                      ...s,
                      textAnimation: anim.id as TextSettings['textAnimation'],
                      wordHighlightEnabled:
                        anim.id === 'wordByWord' ? true : s.wordHighlightEnabled,
                    }));
                    addToast({ message: `تم تفعيل تأثير «${anim.label}» 🎬`, type: 'info' });
                  }}
                  className={`p-2.5 rounded-xl border text-start transition-all cursor-pointer flex items-start gap-2 ${
                    (textSettings.textAnimation || 'wordByWord') === anim.id
                      ? 'bg-sky-500/20 border-sky-400 text-surface-50 font-bold shadow-md'
                      : 'bg-surface-950 border-surface-700/40 text-surface-400 hover:text-surface-50'
                  }`}
                >
                  <span className="text-base shrink-0">{anim.icon}</span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-surface-50 truncate">{anim.label}</div>
                    <div className="text-[10px] text-surface-400 truncate">{anim.sub}</div>
                  </div>
                </button>
              ))}
            </div>
          </SectionAccordion>

          {/* Karaoke Word Highlight Settings */}
          <SectionAccordion
            title={t('editor.karaokeTitle', 'إبراز الكلمة المتلوّة (كاريوكي ذكي)')}
            icon={<Sparkles size={16} className="text-gold-400" />}
            defaultOpen={true}
          >
            <div className="p-3.5 rounded-2xl bg-surface-900/90 border border-gold-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-surface-50 text-xs block">
                    {t('editor.toggleKaraoke', 'تفعيل كاريوكي الكلمات')}
                  </span>
                  <span className="text-[11px] text-surface-400">
                    {t('editor.karaokeDesc', 'تلوين وتكبير الكلمة لحظة نطقها من القارئ')}
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

              {textSettings.wordHighlightEnabled && (
                <div className="space-y-3 pt-2 border-t border-surface-700/30">
                  <div>
                    <label className="block text-xs font-bold text-surface-400 mb-1.5">
                      {t('editor.highlightEffectLabel', 'تأثير إبراز الكلمة')}
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {highlightStyles.map((h) => (
                        <button
                          key={h.id}
                          type="button"
                          onClick={() =>
                            setTextSettings((s) => ({
                              ...s,
                              wordHighlightStyle: h.id as TextSettings['wordHighlightStyle'],
                              wordHighlightColor: h.color,
                            }))
                          }
                          className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            (textSettings.wordHighlightStyle || 'goldGlow') === h.id
                              ? 'bg-gold-500/20 border-gold-400 text-gold-300 shadow-sm'
                              : 'bg-surface-950 border-surface-700/40 text-surface-400 hover:text-surface-50'
                          }`}
                        >
                          {h.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-surface-700/30 items-center">
                    <Slider
                      label={t('editor.inactiveWordOpacityLabel', 'عتامة باقي الكلمات')}
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
                      <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-surface-950 border border-surface-700/30">
                        <input
                          type="checkbox"
                          checked={textSettings.highlightScale ?? true}
                          onChange={(e) =>
                            setTextSettings((s) => ({ ...s, highlightScale: e.target.checked }))
                          }
                          className="rounded border-surface-700/40 text-gold-500 focus:ring-0"
                        />
                        <span className="text-[11px] font-bold text-surface-50">
                          {t('editor.highlightScaleToggle', 'تكبير الكلمة النشطة 🔍')}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </SectionAccordion>
        </div>
      )}

      {/* ===================== TAB 5: TRANSLATION & TAFSIR ===================== */}
      {activeSubTab === 'translation' && (
        <div className="space-y-3">
          <SectionAccordion
            title={t('editor.translationSubtitlesTitle', 'ترجمة الآيات متعددة اللغات (Subtitles)')}
            icon={<Sparkles size={16} className="text-gold-400" />}
            defaultOpen={true}
          >
            <div className="p-3.5 rounded-2xl bg-surface-900/90 border border-surface-700/40 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-surface-50 text-xs block">
                    {t('editor.toggleTranslationSubtitles', 'عرض الترجمة الإنجليزية / العالمية')}
                  </span>
                  <span className="text-[11px] text-surface-400">
                    {t('editor.translationSubtitlesDesc', 'تظهر أسفل النص العربي بشكل سينمائي')}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={showTranslation}
                  onChange={(e) => setShowTranslation(e.target.checked)}
                  className="toggle cursor-pointer"
                />
              </div>

              {showTranslation && (
                <div className="space-y-3 pt-2 border-t border-surface-700/30">
                  <div>
                    <label className="block text-xs font-bold text-surface-400 mb-1.5">
                      {t('editor.translationLangLabel', 'لغة الترجمة')}
                    </label>
                    <select
                      value={textSettings.translationLanguage || 'en'}
                      onChange={(e) =>
                        setTextSettings((s) => ({ ...s, translationLanguage: e.target.value as 'en' | 'fr' | 'ur' | 'tr' | 'es' | 'id' }))
                      }
                      className="glass-input w-full p-2 rounded-xl text-xs bg-surface-950 border border-surface-700/40"
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
                    label={t('editor.translationFontSizeLabel', 'حجم خط الترجمة')}
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
          </SectionAccordion>
        </div>
      )}
    </div>
  );
};
