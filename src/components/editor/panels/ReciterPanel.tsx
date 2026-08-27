import React from 'react';
import { Project, AudioSettings, QuranWord } from '../../../types';
import { AyahData } from '../../../services/quranApi';
import { reciters, surahs } from '../../../data/mockData';
import {
  getAvailableSurahsForReciter,
  isSurahAvailableForReciter,
} from '../../../services/quranApi';
import { Sparkles, FileText, Globe, Trash2 } from 'lucide-react';

interface ReciterPanelProps {
  currentProject: Project | null;
  reciterId: string;
  setReciterId: (id: string) => void;
  surahNumber: number;
  setSurahNumber: (num: number) => void;
  fromAyah: number;
  setFromAyah: (num: number) => void;
  toAyah: number;
  setToAyah: (num: number) => void;
  ayahs: AyahData[];
  setAyahs: React.Dispatch<React.SetStateAction<AyahData[]>>;
  audioSettings: AudioSettings;
  setAudioSettings: React.Dispatch<React.SetStateAction<AudioSettings>>;
  filterEditorAvailableOnly: boolean;
  setFilterEditorAvailableOnly: (val: boolean) => void;
  showTranslation: boolean;
  setShowTranslation: (val: boolean) => void;
  showTafsir: boolean;
  setShowTafsir: (val: boolean) => void;
  onOpenReciterModal: () => void;
  onOpenVoiceRecorder: () => void;
  stopAudio: () => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  addToast: (
    toast: { message: string; type?: 'success' | 'error' | 'info' | 'warning' }
  ) => void;
}

export const ReciterPanel: React.FC<ReciterPanelProps> = ({
  currentProject,
  reciterId,
  setReciterId,
  surahNumber,
  setSurahNumber,
  fromAyah,
  setFromAyah,
  toAyah,
  setToAyah,
  ayahs,
  setAyahs,
  audioSettings,
  setAudioSettings,
  filterEditorAvailableOnly,
  setFilterEditorAvailableOnly,
  showTranslation,
  setShowTranslation,
  showTafsir,
  setShowTafsir,
  onOpenReciterModal,
  onOpenVoiceRecorder,
  stopAudio,
  updateProject,
  addToast,
}) => {
  const selectedSurah = surahs.find((s) => s.number === surahNumber);

  return (
    <div className="space-y-4 animate-in">
      <div>
        {/* Active Custom Recorded Voice Banner */}
        {(reciterId === 'custom_voice' || audioSettings.customRecordedAudioUrl) && (
          <div className="mb-3 p-3 rounded-2xl bg-gradient-to-r from-gold-500/20 via-amber-500/15 to-transparent border border-gold-400/40 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gold-400 text-surface-950 flex items-center justify-center font-bold text-sm shadow-md">
                  🎙️
                </div>
                <div>
                  <div className="font-bold text-gold-300 text-xs flex items-center gap-1">
                    <span>تلاوتك المسجلة نشطة</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      مفعل
                    </span>
                  </div>
                  <div className="text-[11px] text-white/50">
                    {Math.round(audioSettings.customAudioDuration || 0)}ث • مع صدى الحرم
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={onOpenVoiceRecorder}
                  className="px-2.5 py-1 rounded-xl bg-gold-400 hover:bg-gold-300 text-surface-950 font-bold text-[11px] shadow-sm transition-all cursor-pointer"
                >
                  تغيير / تسجيل 🎙️
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAudioSettings((s) => ({
                      ...s,
                      customRecordedAudioUrl: undefined,
                      customAudioKey: undefined,
                    }));
                    setReciterId('alafasy_128');
                    if (updateProject && currentProject?.id) {
                      updateProject(currentProject.id, {
                        customAudioUrl: undefined,
                        customAudioKey: undefined,
                        reciterId: 'alafasy_128',
                        reciter: 'مشاري راشد العفاسي',
                        audioSettings: {
                          ...currentProject.audioSettings,
                          customRecordedAudioUrl: undefined,
                          customAudioKey: undefined,
                        },
                      });
                    }
                    stopAudio();
                    addToast({
                      message: 'تم إلغاء التسجيل والعودة لصوت القارئ المعتمد',
                      type: 'info',
                    });
                  }}
                  className="p-1.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-300 border border-white/10 transition-all cursor-pointer"
                  title="حذف التسجيل الصوتي والعودة للقارئ المعتمد"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            {/* Custom Reciter Name Input Field */}
            <div className="pt-2 border-t border-gold-400/20 space-y-1">
              <label className="text-[11px] font-bold text-gold-300 flex items-center justify-between">
                <span>اسمك / اسم القارئ (يظهر في الفيديو والغلاف):</span>
                <span className="text-[9px] text-white/40">تعديل</span>
              </label>
              <input
                type="text"
                value={audioSettings.customReciterName ?? currentProject?.customReciterName ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setAudioSettings((s) => ({ ...s, customReciterName: val }));
                  if (updateProject && currentProject?.id) {
                    updateProject(currentProject.id, {
                      reciter: val || 'تسجيلي الخاص 🎙️',
                      customReciterName: val,
                    });
                  }
                }}
                placeholder="مثال: القارئ محمد طه / تلاوتي الخاصة"
                className="glass-input w-full p-2 rounded-xl text-xs bg-surface-950/90 border border-gold-400/30 text-white placeholder-white/30 focus:border-gold-400 focus:outline-none"
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <label className="text-white/60 font-bold">اختيار القارئ</label>
            {(() => {
              const avail = getAvailableSurahsForReciter(reciterId);
              const isFull = avail.length === 114;
              return isFull ? (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  🟢 114 سورة كاملة
                </span>
              ) : (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  🟡 {avail.length} سورة مسجلة
                </span>
              );
            })()}
          </div>
          <button
            type="button"
            onClick={onOpenReciterModal}
            className="text-[11px] text-gold-400 hover:text-gold-300 font-bold flex items-center gap-1 hover:underline bg-gold-400/10 px-2 py-0.5 rounded-lg border border-gold-400/20 cursor-pointer"
          >
            <Sparkles size={11} />
            <span>تصفح ({reciters.length}) 🎙️</span>
          </button>
        </div>
        <select
          value={reciterId}
          onChange={(e) => {
            const newReciter = e.target.value;
            setReciterId(newReciter);
            if (newReciter !== 'custom_voice') {
              setAudioSettings((s) => ({ ...s, customRecordedAudioUrl: undefined }));
              const newAvail = getAvailableSurahsForReciter(newReciter);
              if (!newAvail.includes(surahNumber)) {
                const autoSurah = newAvail[0] || 1;
                setSurahNumber(autoSurah);
                const sObj = surahs.find((s) => s.number === autoSurah);
                addToast({
                  message: `تم ضبط السورة تلقائياً على (سورة ${sObj?.name}) لأنها متوفرة بصوت القارئ ✨`,
                  type: 'info',
                });
              }
            }
            stopAudio();
          }}
          className="glass-input w-full p-2 rounded-xl text-xs bg-surface-900"
        >
          {(reciterId === 'custom_voice' || audioSettings.customRecordedAudioUrl) && (
            <option value="custom_voice" className="bg-surface-900 text-gold-400 font-bold">
              🎙️ تسجيلي الصوتي الخاص (أنا)
            </option>
          )}
          {reciters.map((r) => {
            const rSurahs = getAvailableSurahsForReciter(r.id);
            const isFull = rSurahs.length === 114;
            return (
              <option key={r.id} value={r.id} className="bg-surface-900 text-white">
                {r.name} — {r.style} ({isFull ? '114 سورة ✓' : `${rSurahs.length} سورة`})
              </option>
            );
          })}
        </select>
      </div>

      {/* Content Selector: Quran Surah or Custom Text/Hadith */}
      {currentProject?.contentType === 'custom' ||
      currentProject?.contentType === 'hadith' ||
      currentProject?.contentType === 'azkar' ? (
        <div className="space-y-3 p-3.5 rounded-2xl bg-surface-900/90 border border-gold-400/20">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gold-300 flex items-center gap-1.5">
              <FileText size={14} />
              <span>نص المقطع (حديث / موعظة / كلمة) ✍️</span>
            </label>
            <span className="text-[11px] px-2 py-0.5 rounded bg-gold-400/10 text-gold-400 border border-gold-400/20 font-bold">
              {currentProject?.contentType === 'hadith'
                ? 'حديث نبوي 📜'
                : currentProject?.contentType === 'azkar'
                  ? 'دعاء وذكر 🤲'
                  : 'موعظة وكلام حر 🎙️'}
            </span>
          </div>

          <textarea
            value={currentProject?.customText || (ayahs[0]?.text ?? '')}
            onChange={(e) => {
              const newText = e.target.value;
              if (currentProject) {
                updateProject(currentProject.id, { customText: newText });
              }
              const rawWords = newText.split(/\s+/).filter(Boolean);
              const totalWords = Math.max(rawWords.length, 1);
              const totalDur = audioSettings.customAudioDuration || 10;
              const secPerW = totalDur / totalWords;
              const newWords: QuranWord[] = rawWords.map((w, idx) => ({
                id: idx + 1,
                position: idx + 1,
                text: w,
                startTime: idx * secPerW,
                endTime: (idx + 1) * secPerW,
                charTypeName: 'word',
              }));
              setAyahs([
                {
                  number: 1,
                  numberInSurah: 1,
                  surahNumber: 0,
                  surahName: currentProject?.customTitle || 'موعظة وكلمة طيبة',
                  text: newText,
                  audioUrl: currentProject?.customAudioUrl || '',
                  duration: totalDur,
                  juz: 1,
                  page: 1,
                  words: newWords,
                },
              ]);
            }}
            rows={4}
            className="w-full p-2.5 rounded-xl bg-surface-950/80 border border-white/10 text-white text-xs leading-relaxed focus:outline-none focus:border-gold-400 resize-none font-medium"
            placeholder="اكتب أو عدل نص الموعظة أو الحديث هنا..."
          />
        </div>
      ) : (
        <>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-white/60 font-bold">السورة القرآنية</label>
              {(() => {
                const avail = getAvailableSurahsForReciter(reciterId);
                const isFull = avail.length === 114;
                if (isFull) return null;
                return (
                  <label className="flex items-center gap-1 text-[11px] text-gold-300 font-bold cursor-pointer bg-gold-500/10 px-1.5 py-0.5 rounded-md border border-gold-500/20">
                    <input
                      type="checkbox"
                      checked={filterEditorAvailableOnly}
                      onChange={(e) => setFilterEditorAvailableOnly(e.target.checked)}
                      className="checkbox checkbox-xs accent-gold-400"
                    />
                    <span>المتوفرة فقط ({avail.length})</span>
                  </label>
                );
              })()}
            </div>

            {(() => {
              const avail = getAvailableSurahsForReciter(reciterId);
              const isFull = avail.length === 114;
              const displayed =
                filterEditorAvailableOnly && !isFull
                  ? surahs.filter((s) => avail.includes(s.number))
                  : surahs;

              return (
                <select
                  value={surahNumber}
                  onChange={(e) => {
                    setSurahNumber(Number(e.target.value));
                    stopAudio();
                  }}
                  className="glass-input w-full p-2 rounded-xl text-xs bg-surface-900"
                >
                  {displayed.map((s) => {
                    const isAvail = avail.includes(s.number);
                    return (
                      <option key={s.number} value={s.number} className="bg-surface-900 text-white">
                        {s.number}. سورة {s.name} ({s.ayahCount} آية){' '}
                        {isAvail ? '✓' : '(⚠️ غير مسجلة)'}
                      </option>
                    );
                  })}
                </select>
              );
            })()}

            {/* Warning banner if selected Surah is missing for reciter */}
            {(() => {
              const isAvail = isSurahAvailableForReciter(reciterId, surahNumber);
              if (isAvail) return null;
              const avail = getAvailableSurahsForReciter(reciterId);
              const curSurahName = surahs.find((s) => s.number === surahNumber)?.name;
              const curReciterName = reciters.find((r) => r.id === reciterId)?.name;
              const fallbackSurahNum = avail[0] || 1;
              const fallbackSurahName = surahs.find((s) => s.number === fallbackSurahNum)?.name;

              return (
                <div className="mt-2 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 space-y-1.5 animate-in">
                  <p className="text-[11px] text-amber-200 leading-snug">
                    ⚠️ <span className="font-bold">سورة {curSurahName}</span> غير مسجلة بصوت{' '}
                    <span className="font-bold">{curReciterName}</span>.
                  </p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        setReciterId('alafasy_128');
                        stopAudio();
                      }}
                      className="px-2 py-0.5 rounded-lg bg-surface-900 hover:bg-surface-800 text-gold-300 font-bold text-[10px] border border-gold-400/30 cursor-pointer"
                    >
                      تبديل لمشاري العفاسي (مصحف كامل) 🔄
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSurahNumber(fallbackSurahNum);
                        stopAudio();
                      }}
                      className="px-2 py-0.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-surface-950 font-bold text-[10px] cursor-pointer"
                    >
                      اختيار سورة {fallbackSurahName} 📖
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-white/60 mb-1 font-bold">من آية</label>
              <input
                type="number"
                min={1}
                max={selectedSurah?.ayahCount || 286}
                value={fromAyah}
                onChange={(e) => setFromAyah(Number(e.target.value))}
                className="glass-input w-full p-2 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-white/60 mb-1 font-bold">إلى آية</label>
              <input
                type="number"
                min={fromAyah}
                max={selectedSurah?.ayahCount || 286}
                value={toAyah}
                onChange={(e) => setToAyah(Number(e.target.value))}
                className="glass-input w-full p-2 rounded-xl text-xs"
              />
            </div>
          </div>
        </>
      )}

      {/* Translation & Tafsir Toggles */}
      <div className="pt-2 border-t border-white/10 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-white/70 font-bold flex items-center gap-1.5">
            <Globe size={13} className="text-gold-400" />
            <span>عرض الترجمة الإنجليزية</span>
          </span>
          <input
            type="checkbox"
            checked={showTranslation}
            onChange={(e) => setShowTranslation(e.target.checked)}
            className="checkbox checkbox-sm accent-gold-400 cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-white/70 font-bold flex items-center gap-1.5">
            <span className="text-xs">📜</span>
            <span>عرض التفسير الميسر</span>
          </span>
          <input
            type="checkbox"
            checked={showTafsir}
            onChange={(e) => setShowTafsir(e.target.checked)}
            className="checkbox checkbox-sm accent-gold-400 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
