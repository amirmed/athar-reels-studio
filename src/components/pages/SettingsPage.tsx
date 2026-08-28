import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from '../../i18n';
import { AppLayout } from '../layout/AppLayout';
import {
  Globe,
  Palette,
  FolderOpen,
  Download,
  Cpu,
  Info,
  Moon,
  Sun,
  Save,
  Shield,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import {
  getAudioStorageStats,
  pruneOrphanAudioRecords,
  StorageStats,
} from '../../services/persistentAudioStorage';

interface SettingGroupProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  delay?: number;
}

const SettingGroup: React.FC<SettingGroupProps> = ({ title, icon, children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="glass-panel p-5 space-y-4"
  >
    <div className="flex items-center gap-3 mb-1">
      <div className="w-9 h-9 rounded-xl bg-accent-500/10 flex items-center justify-center text-accent-400">
        {icon}
      </div>
      <h3 className="text-sm font-bold text-white/80">{title}</h3>
    </div>
    <div className="divider !mt-3 !mb-4"></div>
    {children}
  </motion.div>
);

interface SettingRowProps {
  label: string;
  description?: string;
  children: React.ReactNode;
}

const SettingRow: React.FC<SettingRowProps> = ({ label, description, children }) => (
  <div className="flex items-center justify-between py-2">
    <div>
      <div className="text-sm font-medium text-white/90">{label}</div>
      {description && <div className="text-xs text-white/40 mt-0.5">{description}</div>}
    </div>
    <div>{children}</div>
  </div>
);

export const SettingsPage: React.FC = () => {
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const theme = useAppStore((s) => s.theme);
  const projects = useAppStore((s) => s.projects);
  const addToast = useAppStore((s) => s.addToast);
  const saveSettings = useAppStore((s) => s.saveSettings);
  const { t, language } = useTranslation();

  const [audioStorageStats, setAudioStorageStats] = useState<StorageStats | null>(null);
  const [isCleaningStorage, setIsCleaningStorage] = useState(false);

  const loadStorageStats = useCallback(async () => {
    try {
      const stats = await getAudioStorageStats();
      setAudioStorageStats(stats);
    } catch (err) {
      console.debug('[SettingsPage] Error loading storage stats:', err);
    }
  }, []);

  useEffect(() => {
    loadStorageStats();
  }, [loadStorageStats]);

  const handlePruneUnusedAudio = async () => {
    setIsCleaningStorage(true);
    try {
      const activeKeys = projects
        .map(
          (p) =>
            p.audioSettings?.customAudioKey ||
            p.audioSettings?.customRecordedAudioUrl ||
            p.id
        )
        .filter(Boolean) as string[];

      const res = await pruneOrphanAudioRecords(activeKeys);
      await loadStorageStats();
      if (res.evictedCount > 0) {
        addToast({
          message: `تم تنظيف ${res.evictedCount} تسجيل غير مستخدم وتحرير مساحة التخزين ✨`,
          type: 'success',
        });
      } else {
        addToast({
          message: 'ذاكرة الصوت نظيفة ومحدثة بالفعل! لا توجد ملفات مهملة 👍',
          type: 'info',
        });
      }
    } catch (err) {
      console.warn('[SettingsPage] Prune error:', err);
      addToast({ message: 'حدث خطأ أثناء تنظيف التخزين', type: 'error' });
    } finally {
      setIsCleaningStorage(false);
    }
  };

  const handleSave = async () => {
    await saveSettings();
    addToast({ message: t('common.saved', 'تم حفظ الإعدادات بنجاح'), type: 'success' });
  };

  return (
    <AppLayout
      title={t('settings.title', 'الإعدادات')}
      subtitle={t('settings.subtitle', 'إعدادات التطبيق والتفضيلات')}
      topbarActions={
        <button onClick={handleSave} className="btn-primary-sm flex items-center gap-1.5 text-xs">
          <Save size={14} />
          {t('settings.saveButton', 'حفظ الإعدادات')}
        </button>
      }
    >
      <div className="p-6 max-w-3xl mx-auto space-y-4 animate-in">
        {/* Language */}
        <SettingGroup
          title={t('settings.languageGroup', 'اللغة والتدويل')}
          icon={<Globe size={18} />}
          delay={0}
        >
          <SettingRow
            label={t('settings.languageSelect', 'لغة الواجهة')}
            description={
              language === 'ar'
                ? 'اختر لغة عرض التطبيق (العربية، الإنجليزية، الفرنسية)'
                : language === 'fr'
                  ? 'Choisissez la langue d’affichage'
                  : 'Choose application display language'
            }
          >
            <select
              value={settings.language || 'ar'}
              onChange={(e) => updateSettings({ language: e.target.value as 'ar' | 'en' | 'fr' })}
              className="glass-select text-sm w-48 font-bold"
            >
              <option value="ar">🇸🇦 العربية (Arabic)</option>
              <option value="en">🇬🇧 English (US/UK)</option>
              <option value="fr">🇫🇷 Français (French)</option>
            </select>
          </SettingRow>
        </SettingGroup>

        {/* Appearance */}
        <SettingGroup
          title={t('settings.themeGroup', 'المظهر والسمات')}
          icon={<Palette size={18} />}
          delay={0.05}
        >
          <SettingRow
            label={t('settings.themeSelect', 'سمة التطبيق')}
            description={
              language === 'ar'
                ? 'اختر بين الوضع الداكن الفاخر والوضع النهاري'
                : language === 'fr'
                  ? 'Choisissez entre le mode sombre et clair'
                  : 'Choose between dark and light mode'
            }
          >
            <div className="flex items-center gap-1 bg-surface-800/40 border border-white/[0.06] rounded-xl p-1">
              <button
                type="button"
                onClick={() => {
                  updateSettings({ theme: 'dark' });
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-accent-500/20 text-accent-400 border border-accent-500/30 shadow-sm'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                <Moon size={13} />
                {t('settings.themeDark', 'داكن')}
              </button>
              <button
                type="button"
                onClick={() => {
                  updateSettings({ theme: 'light' });
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'bg-accent-500/20 text-accent-400 border border-accent-500/30 shadow-sm'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                <Sun size={13} />
                {t('settings.themeLight', 'فاتح')}
              </button>
            </div>
          </SettingRow>
        </SettingGroup>

        {/* Storage */}
        <SettingGroup
          title={t('settings.storageGroup', 'مسار الحفظ والتخزين')}
          icon={<FolderOpen size={18} />}
          delay={0.1}
        >
          <SettingRow
            label={t('settings.projectsPath', 'مسار حفظ الفيديوهات')}
            description={
              language === 'ar'
                ? 'المجلد الافتراضي لتصدير وحفظ الفيديوهات'
                : language === 'fr'
                  ? 'Dossier d’enregistrement par défaut'
                  : 'Directory to export and save projects'
            }
          >
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/40 font-mono bg-surface-800/50 px-3 py-1.5 rounded-lg border border-white/[0.04] max-w-[240px] truncate">
                {settings.projectsPath || (language === 'ar' ? 'المسار الافتراضي' : 'Default Path')}
              </span>
              <button
                onClick={async () => {
                  try {
                    const path = await window.electronAPI?.dialog.openDirectory();
                    if (path) {
                      updateSettings({ projectsPath: path });
                      addToast({
                        message: t('common.saved', 'تم تحديث مسار الحفظ'),
                        type: 'success',
                      });
                    }
                  } catch {
                    // Dev fallback
                  }
                }}
                className="glass-button text-xs py-1.5 px-3"
              >
                {t('common.edit', 'تغيير')}
              </button>
            </div>
          </SettingRow>

          <SettingRow
            label={t('settings.autoSave', 'الحفظ التلقائي')}
            description={
              language === 'ar'
                ? 'حفظ المشاريع تلقائياً أثناء العمل'
                : language === 'fr'
                  ? 'Sauvegarder automatiquement pendant l’édition'
                  : 'Auto-save project changes while editing'
            }
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => updateSettings({ autoSave: !settings.autoSave })}
                className={`toggle-switch ${settings.autoSave ? 'active' : ''}`}
              />
            </div>
          </SettingRow>

          {settings.autoSave && (
            <SettingRow
              label={t('settings.autoSaveInterval', 'فترة الحفظ التلقائي')}
              description={
                language === 'ar'
                  ? 'الفاصل الزمني للحفظ الدوري أثناء التعديل'
                  : language === 'fr'
                    ? 'Intervalle de sauvegarde périodique'
                    : 'Interval between periodic automatic saves'
              }
            >
              <select
                value={settings.autoSaveInterval}
                onChange={(e) => updateSettings({ autoSaveInterval: Number(e.target.value) })}
                className="glass-select text-sm w-36"
              >
                <option value={0.5}>
                  {language === 'ar' ? '30 ثانية (فوري)' : '30s (Instant)'}
                </option>
                <option value={1}>{language === 'ar' ? 'دقيقة واحدة' : '1 Minute'}</option>
                <option value={2}>{language === 'ar' ? 'دقيقتان' : '2 Minutes'}</option>
                <option value={5}>{language === 'ar' ? '5 دقائق' : '5 Minutes'}</option>
              </select>
            </SettingRow>
          )}

          {/* IndexedDB Audio Storage Quota & Eviction */}
          <SettingRow
            label="ذاكرة التسجيلات الصوتية (IndexedDB Cache)"
            description={
              audioStorageStats
                ? `${audioStorageStats.totalCount} تسجيل صوتي مخزن • الحجم: ${audioStorageStats.formattedSize} / 100 MB`
                : 'إدارة وتفريغ الملفات الصوتية والتسجيلات المهملة لتفادي امتلاء الذاكرة'
            }
          >
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadStorageStats}
                title="تحديث البيانات"
                className="p-2 rounded-xl bg-surface-800/60 hover:bg-surface-700 text-white/60 hover:text-white transition-all cursor-pointer border border-white/[0.04]"
              >
                <RefreshCw size={13} />
              </button>
              <button
                type="button"
                onClick={handlePruneUnusedAudio}
                disabled={isCleaningStorage || !audioStorageStats || audioStorageStats.totalCount === 0}
                className="glass-button text-xs py-1.5 px-3 flex items-center gap-1.5 hover:border-accent-500/40 text-accent-300 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 size={13} />
                <span>{isCleaningStorage ? 'جاري التنظيف...' : 'تنظيف المهملات 🧹'}</span>
              </button>
            </div>
          </SettingRow>
        </SettingGroup>

        {/* Export defaults */}
        <SettingGroup
          title={t('export.quality', 'إعدادات التصدير الافتراضية')}
          icon={<Download size={18} />}
          delay={0.15}
        >
          <SettingRow label={t('export.quality', 'الجودة الافتراضية')}>
            <select
              value={settings.defaultExportQuality}
              onChange={(e) => updateSettings({ defaultExportQuality: e.target.value as 'standard' | 'high' | 'premium' })}
              className="glass-select text-sm w-36"
            >
              <option value="standard">{t('export.qualityStandard', 'قياسية (720p)')}</option>
              <option value="high">{t('export.qualityHigh', 'عالية (1080p)')}</option>
              <option value="premium">{t('export.qualityPremium', 'فائقة (4K Ultra)')}</option>
            </select>
          </SettingRow>

          <SettingRow label={t('export.aspectRatio', 'المقاس الافتراضي')}>
            <select
              value={settings.defaultAspectRatio}
              onChange={(e) => updateSettings({ defaultAspectRatio: e.target.value as '9:16' | '16:9' | '1:1' })}
              className="glass-select text-sm w-44"
            >
              <option value="9:16">{t('export.ratioReels', '9:16 ريلز / تيك توك')}</option>
              <option value="16:9">{t('export.ratioLandscape', '16:9 يوتيوب / أفقي')}</option>
              <option value="1:1">{t('export.ratioPost', '1:1 منشور مربع')}</option>
            </select>
          </SettingRow>
        </SettingGroup>

        {/* External Services & Pexels */}
        <SettingGroup
          title="خدمات الصور والخلفيات (Pexels API)"
          icon={<FolderOpen size={18} />}
          delay={0.18}
        >
          <SettingRow
            label="مفتاح Pexels API المجاني"
            description="يسمح لك بالبحث وتنزيل ملايين الصور والفيديوهات الإسلامية عالية الدقة 4K مجاناً"
          >
            <div className="flex items-center gap-2">
              <input
                type="password"
                placeholder="أدخل مفتاحك هنا..."
                defaultValue={localStorage.getItem('athar_pexels_key') || ''}
                onChange={(e) => {
                  try {
                    localStorage.setItem('athar_pexels_key', e.target.value.trim());
                  } catch (err) {
                    console.debug('[SettingsPage] Save pexels key error:', err);
                  }
                }}
                className="glass-input text-xs w-56 font-mono"
              />
            </div>
          </SettingRow>
          <div className="p-2.5 rounded-xl bg-gold-400/5 border border-gold-400/20 text-[11px] text-gold-300/80 flex items-center justify-between">
            <span>احصل على مفتاح مجاني فوري في أقل من دقيقة من موقع Pexels الرسمي:</span>
            <a
              href="https://www.pexels.com/api/"
              target="_blank"
              rel="noreferrer"
              className="text-gold-300 font-bold underline hover:text-white transition-colors"
            >
              pexels.com/api ➔
            </a>
          </div>
        </SettingGroup>

        {/* Performance */}
        <SettingGroup
          title={t('settings.performanceGroup', 'إعدادات الأداء والتسريع')}
          icon={<Cpu size={18} />}
          delay={0.2}
        >
          <SettingRow
            label={t('settings.performanceMode', 'وضع الأداء والمعالجة')}
            description={
              language === 'ar'
                ? 'موازنة بين سرعة الريندر وجودة الرسوميات'
                : 'Balance rendering speed with visual quality'
            }
          >
            <select
              value={settings.performanceMode}
              onChange={(e) => updateSettings({ performanceMode: e.target.value as 'performance' | 'balanced' | 'quality' })}
              className="glass-select text-sm w-44"
            >
              <option value="performance">
                {t('settings.performanceSpeed', 'أقصى سرعة (Fast)')}
              </option>
              <option value="balanced">
                {t('settings.performanceBalanced', 'متوازن (مستحسن)')}
              </option>
              <option value="quality">
                {t('settings.performanceQuality', 'أقصى جودة (Ultra)')}
              </option>
            </select>
          </SettingRow>
        </SettingGroup>

        {/* About & Branding */}
        <SettingGroup
          title={
            language === 'ar'
              ? 'حول التطبيق والهوية'
              : language === 'fr'
                ? 'À Propos de l’Application'
                : 'About Application'
          }
          icon={<Info size={18} />}
          delay={0.25}
        >
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-white/50">
                {language === 'ar' ? 'اسم التطبيق' : 'Application Name'}
              </span>
              <span className="text-white font-bold font-arabic">
                {t('appName', 'أَثَــر ستوديو')} | Athar Reels Studio
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/50">{language === 'ar' ? 'الإصدار' : 'Version'}</span>
              <span className="text-gold-300 font-mono font-bold bg-gold-500/10 px-2 py-0.5 rounded-md border border-gold-500/20 text-xs">
                v2.0.0 (Pro Viral Edition)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/50">
                {language === 'ar' ? 'الموقع الرسمي' : 'Official Website'}
              </span>
              <a
                href="https://atar-studio.com"
                target="_blank"
                rel="noreferrer"
                className="text-accent-400 hover:text-accent-300 font-mono font-bold hover:underline"
              >
                atar-studio.com ↗
              </a>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/50">
                {language === 'ar' ? 'محرك المعالجة والريندر' : 'Rendering Engine'}
              </span>
              <span className="text-white/70 font-mono text-xs">
                WebCodecs + Native H.264 FastStart + Web Audio 8D
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/50">
                {language === 'ar' ? 'مصادر التلاوات والبيانات' : 'Audio & Quran Sources'}
              </span>
              <span className="text-white/70 font-mono text-xs">
                EveryAyah • MP3Quran • Quran.com
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/50">
                {language === 'ar' ? 'الخصوصية والتخزين' : 'Privacy & Storage'}
              </span>
              <span className="text-emerald-400 font-medium text-xs">
                {language === 'ar'
                  ? 'محلي 100% على جهازك (بدون تعقب)'
                  : '100% Local & Private on your device'}
              </span>
            </div>
          </div>

          <div className="divider"></div>

          {/* Charity & Dedication Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-gold-500/10 via-amber-500/5 to-surface-900 border border-gold-400/30 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-gold-400/20 border border-gold-400/30 flex items-center justify-center text-gold-300 shrink-0 text-sm">
              🕊️
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-gold-300 font-arabic">
                صَدَقَةٌ جَارِيَةٌ عَنِ الوَالِدَةِ تِيجَانِي عَائِشَة رَحِمَهَا اللهُ
              </p>
              <p className="text-[11px] text-white/60 leading-relaxed font-arabic">
                اللَّهُمَّ اغْفِرْ لَهَا وَارْحَمْهَا، وَعَافِهَا وَاعْفُ عَنْهَا، وَأَكْرِمْ
                نُزُلَهَا وَوَسِّعْ مُدْخَلَهَا، وَاجْعَلْ قَبْرَهَا رَوْضَةً مِنْ رِيَاضِ
                الجَنَّةِ.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-xl bg-accent-500/5 border border-accent-500/10">
            <Shield size={14} className="text-accent-400 mt-0.5 shrink-0" />
            <p className="text-[11px] text-accent-300/70 leading-relaxed font-arabic">
              أَثَر ستوديو (atar-studio.com) — تم تطويره بهدف تسهيل نشر وتصميم القرآن الكريم
              والأذكار والأحاديث الشريفة بأعلى جودة لمواقع التواصل الاجتماعي.
            </p>
          </div>
        </SettingGroup>
      </div>
    </AppLayout>
  );
};
