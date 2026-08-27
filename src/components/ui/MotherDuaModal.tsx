import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  X,
  Sparkles,
  Copy,
  Check,
  Download,
  Send,
  User,
  Award,
  BookOpen,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useHotkeys } from '../../hooks/useHotkeys';

interface MotherDuaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ParentType = 'mother' | 'father' | 'both' | 'custom';
type LifeStatus = 'alive' | 'deceased';

export const MotherDuaModal: React.FC<MotherDuaModalProps> = ({ isOpen, onClose }) => {
  const addToast = useAppStore((s) => s.addToast);
  const [activeTab, setActiveTab] = useState<'parents' | 'tijani_aisha'>('parents');

  // Parents Card Customization States
  const [parentType, setParentType] = useState<ParentType>('mother');
  const [lifeStatus, setLifeStatus] = useState<LifeStatus>('alive');
  const [customName, setCustomName] = useState('');
  const [customDuaNote, _setCustomDuaNote] = useState('');
  const [copied, setCopied] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // Daily Tasbeeh for Parents
  const [parentsTasbeehCount, setParentsTasbeehCount] = useState(() => {
    try {
      return Number(localStorage.getItem('athar_parents_tasbeeh_count') || '7');
    } catch {
      return 7;
    }
  });

  // Tijani Aisha Ameen Count
  const [ameenCount, setAmeenCount] = useState(1);
  const [hasPrayedTijani, setHasPrayedTijani] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('athar_parents_tasbeeh_count', String(parentsTasbeehCount));
    } catch (err) {
      console.debug('[MotherDuaModal] localStorage save error:', err);
    }
  }, [parentsTasbeehCount]);

  useHotkeys('Escape', onClose, { enabled: isOpen });

  if (!isOpen) return null;

  // Resolve Title based on selection
  const getParentTitle = () => {
    if (parentType === 'custom' && customName.trim()) return customName.trim();
    if (parentType === 'mother') return 'أمي الغالية ونور عيني 🌸';
    if (parentType === 'father') return 'أبي الحبيب وتاج رأسي 👑';
    return 'والديّ الكريمين (أمي وأبي) 🤍';
  };

  // Resolve Duas based on alive / deceased status
  const getDuaText = () => {
    if (customDuaNote.trim()) return customDuaNote.trim();

    if (lifeStatus === 'alive') {
      if (parentType === 'mother') {
        return 'اللهم احفظ أمي بعينك التي لا تنام، وألبسها ثوب الصحة والعافية وراحة البال، وبارك في عمرها وأسعد قلبها، واجعل الفردوس الأعلى دارها ومستقرها.';
      } else if (parentType === 'father') {
        return 'اللهم احفظ أبي وسنده وظله، واجعل عافيته تدوم وأيامه تمتلئ بالرضا والبركة، واجزه عني خير الجزاء، واغفر له ذنبه ويسر أمره وارفع قدره في الدارين.';
      } else {
        return 'اللهم أطل في عمر والديّ على طاعتك ورضاك، واجعلهما أسعد خلقك، وارزقني برهما ورضاهما، وأكرمهما بالصحة التامة والعافية الدائمة والفردوس الأعلى من الجنة.';
      }
    } else {
      if (parentType === 'mother') {
        return 'اللهم اغفر لأمي وارحمها وعافها واعف عنها، واجعل قبرها روضة من رياض الجنة، وافسح لها فيه مد بصرها، واجمعني بها في الفردوس الأعلى من الجنة بصحبة النبيين والصديقين.';
      } else if (parentType === 'father') {
        return 'اللهم اغفر لأبي وتغمده بواسع رحمتك، وأكرم نزله ووسع مدخله، واغسله بالماء والثلج والبرد، واجعل ما قدمه في ميزان حسناته، وأسكنه أعلى درجات الجنان.';
      } else {
        return 'اللهم اغفر لوالديّ وارحمهما كما ربياني صغيراً، واجعل قبورهما نوراً وضياءً وسروراً، وتجاوز عن سيئاتهما، واجمعهما في جنات النعيم على سرر متقابلين.';
      }
    }
  };

  const currentTitle = getParentTitle();
  const currentDua = getDuaText();

  // Copy customized Dua
  const handleCopyParentDua = () => {
    const fullText = `🤲 إهداء ودعاء مبارك إلى: ${currentTitle}\n\n﴿رَّبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا﴾\n\n« ${currentDua} »\n\n🌿 صُنع بحب وبرّ عبر استوديو «أَثَــر» القرآني.`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    addToast({ message: 'تم نسخ الدعاء المخصص بنجاح! جاهز للإرسال 📋✨', type: 'success' });
    setTimeout(() => setCopied(false), 2500);
  };

  // WhatsApp Direct Share
  const handleWhatsAppShare = () => {
    const text = `🤲 دعاء مبارك وإهداء خاص إلى: ${currentTitle}\n\n﴿رَّبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا﴾\n\n« ${currentDua} »\n\n🤍 حفظكِ الله وكتب لكِ الأجر والمغفرة.`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    addToast({ message: 'جارٍ فتح واتساب لإرسال الدعاء لوالديك 🌸📲', type: 'info' });
  };

  // 4K Luxury Islamic Card Downloader with LARGE CLEAR CENTERED DUA TEXT
  const handleDownload4KCard = async () => {
    setIsGeneratingImage(true);
    try {
      const width = 1080;
      const height = 1350; // Instagram / WhatsApp Status aspect ratio 4:5
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 1. Background Gradient (Deep Royal Emerald & Slate)
      const grad = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, 900);
      grad.addColorStop(0, '#12382a');
      grad.addColorStop(0.5, '#071b13');
      grad.addColorStop(1, '#020906');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // 2. Ornate Double Gold Border & Corners
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 6;
      ctx.strokeRect(30, 30, width - 60, height - 60);

      ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
      ctx.lineWidth = 2;
      ctx.strokeRect(45, 45, width - 90, height - 90);

      // Corner geometric accents
      const drawCorner = (x: number, y: number) => {
        ctx.fillStyle = '#d4af37';
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 16, 0, Math.PI * 2);
        ctx.stroke();
      };
      drawCorner(30, 30);
      drawCorner(width - 30, 30);
      drawCorner(30, height - 30);
      drawCorner(width - 30, height - 30);

      // 3. Top Decorative Basmala
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 38px "Amiri", "Traditional Arabic", "Tahoma", serif';
      ctx.fillText('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', width / 2, 120);

      // 4. Quranic Verse Box
      ctx.fillStyle = 'rgba(212, 175, 55, 0.16)';
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.55)';
      ctx.lineWidth = 2.5;
      const verseBoxW = 900;
      const verseBoxH = 100;
      const verseBoxX = (width - verseBoxW) / 2;
      const verseBoxY = 155;
      ctx.roundRect(verseBoxX, verseBoxY, verseBoxW, verseBoxH, 22);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 42px "Amiri", "Traditional Arabic", serif';
      ctx.fillText('﴿ رَّبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا ﴾', width / 2, 220);

      // 5. Dedicated Recipient Header
      ctx.fillStyle = '#d4af37';
      ctx.font = 'bold 50px "Tajawal", "Traditional Arabic", "Segoe UI", sans-serif';
      ctx.fillText(`إهداء إلى: ${currentTitle}`, width / 2, 325);

      // Decorative divider
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(width / 2 - 300, 350);
      ctx.lineTo(width / 2 + 300, 350);
      ctx.stroke();

      // 6. Large Luminous Central Dua Box (Takes the vast middle of the card)
      const cardW = 980;
      const cardH = 750;
      const cardX = (width - cardW) / 2;
      const cardY = 385;

      // Glow behind central box
      ctx.shadowColor = 'rgba(212, 175, 55, 0.35)';
      ctx.shadowBlur = 35;
      ctx.fillStyle = 'rgba(3, 16, 11, 0.92)';
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.7)';
      ctx.lineWidth = 3;
      ctx.roundRect(cardX, cardY, cardW, cardH, 30);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0; // Reset shadow

      // 7. Dynamic Font Sizing for Extra Large Dua Text in the Middle
      const textLen = currentDua.length;
      let fontSize = 54;
      let lineHeight = 92;

      if (textLen < 150) {
        fontSize = 58;
        lineHeight = 98;
      } else if (textLen < 220) {
        fontSize = 52;
        lineHeight = 88;
      } else {
        fontSize = 46;
        lineHeight = 80;
      }

      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${fontSize}px "Amiri", "Traditional Arabic", "Tajawal", "Segoe UI", serif`;
      const maxTextWidth = 880;
      const words = currentDua.split(' ');
      const lines: string[] = [];
      let currentLine = '';

      for (let n = 0; n < words.length; n++) {
        const testLine = currentLine ? `${currentLine} ${words[n]}` : words[n];
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxTextWidth && currentLine) {
          lines.push(currentLine);
          currentLine = words[n];
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);

      // Vertically center lines in the central card with generous space
      const totalTextHeight = lines.length * lineHeight;
      let startY = cardY + (cardH - totalTextHeight) / 2 + fontSize * 0.85;

      lines.forEach((l) => {
        ctx.fillText(l, width / 2, startY);
        startY += lineHeight;
      });

      // 8. Footer Stamp & Dedication
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.font = '500 24px "Tajawal", sans-serif';
      ctx.fillText('أُهديت بكل محبة وبرّ ورجاء للأجر • صدقة جارية', width / 2, height - 135);

      ctx.fillStyle = '#d4af37';
      ctx.font = 'bold 26px "Tajawal", sans-serif';
      ctx.fillText('استوديو «أَثَــر» القرآني • atar-studio.com', width / 2, height - 90);

      // Download PNG
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `بطاقة_دعاء_${parentType === 'mother' ? 'أمي' : parentType === 'father' ? 'أبي' : 'الوالدين'}.png`;
      link.href = dataUrl;
      link.click();

      addToast({
        message: 'تم استخراج بطاقة الإهداء 4K بنجاح وبخط كبير وواضح في الوسط! 🌸🖼️',
        type: 'success',
      });
    } catch {
      addToast({ message: 'حدث خطأ أثناء إنشاء الصورة', type: 'error' });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Tijani Aisha Duas - Phrased with universal reverence for ANY Muslim user reciting
  const tijaniDuas = [
    {
      title: 'دعاء المغفرة والرحمة الواسعة',
      text: 'اللهم اغفر للوالدة الكريمة «تيجاني عائشة» وارحمها وعافها واعف عنها، وأكرم نزلها ووسع مدخلها، واغسلها بالماء والثلج والبرد، ونقها من الخطايا كما ينقى الثوب الأبيض من الدنس.',
    },
    {
      title: 'دعاء الفردوس الأعلى والنعيم المقيم',
      text: 'اللهم اجعل قبرها روضة من رياض الجنة، وافسح لها فيه مد بصرها، وافرش قبرها من فراش الجنة، وأسكنها الفردوس الأعلى من الجنة بصحبة النبيين والصديقين والشهداء والصالحين.',
    },
    {
      title: 'دعاء الأثر والصدقة الجارية المشتركة',
      text: 'اللهم اجعل هذا التطبيق وكل تلاوة أو ريل يُنشر منه صدقة جارية ونوراً وضياءً في ميزان حسناتها وميزان حسنات والدينا جميعاً، واغفر لجميع أمهات وآباء المسلمين الأحياء منهم والأموات.',
    },
  ];

  const handleAmeenTijani = () => {
    setAmeenCount((prev) => prev + 1);
    setHasPrayedTijani(true);
    addToast({
      message: 'تقبل الله دعاءك الطيب للوالدة تيجاني عائشة! قال الملك: «آمين ولك بمثل» 🤍🤲',
      type: 'success',
    });
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 text-right select-none"
        role="dialog"
        aria-modal="true"
        aria-label="ركن بر الوالدين وبطاقات الإهداء"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl bg-surface-900 border border-gold-400/35 rounded-3xl shadow-2xl shadow-gold-500/10 overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header & Tabs */}
          <div className="relative px-5 pt-5 pb-3 bg-gradient-to-b from-gold-500/20 via-surface-900 to-surface-900 border-b border-gold-400/20 text-center">
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute left-4 top-4 w-9 h-9 rounded-full bg-surface-800/80 hover:bg-surface-700 text-white/60 hover:text-white flex items-center justify-center transition-all border border-white/[0.06] cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-gold-500/30 to-amber-400/20 border border-gold-400/40 flex items-center justify-center mx-auto mb-2 shadow-md">
              <Heart size={24} className="text-rose-400 fill-rose-400/30 animate-pulse" />
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white mb-1">
              ركن بر الوالدين والصدقة الجارية 🌸
            </h3>
            <p className="text-xs sm:text-sm text-white/70 font-medium">
              أهدِ بطاقة دعاء لوالديك وشارك في الأجر المشترك
            </p>

            {/* Navigation Tabs */}
            <div className="flex items-center justify-center gap-2 mt-4 max-w-md mx-auto p-1.5 rounded-2xl bg-surface-950/85 border border-white/[0.08]">
              <button
                type="button"
                onClick={() => setActiveTab('parents')}
                className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'parents'
                    ? 'bg-gradient-to-r from-gold-500 to-amber-500 text-surface-950 shadow-md font-black'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Sparkles size={15} />
                <span>🤲 بطاقة دعاء لوالديك (أنت)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('tijani_aisha')}
                className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'tijani_aisha'
                    ? 'bg-gradient-to-r from-gold-500 to-amber-500 text-surface-950 shadow-md font-black'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Heart size={15} />
                <span>🤍 صدقة (تيجاني عائشة)</span>
              </button>
            </div>
          </div>

          {/* Modal Scroll Content */}
          <div className="p-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
            {activeTab === 'parents' ? (
              // ==================== TAB 1: USER'S PARENTS CARD & GENERATOR ====================
              <div className="space-y-4">
                {/* 1. Interactive Personalization Selectors */}
                <div className="p-4 rounded-2xl bg-surface-950/90 border border-gold-400/25 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-bold text-gold-300 flex items-center gap-1.5">
                      <User size={15} />
                      <span>اختر لمن تهدي الدعاء والبطاقة:</span>
                    </span>
                    <span className="text-[11px] text-white/40">تخصيص فوري</span>
                  </div>

                  {/* Recipient Buttons */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'mother', label: 'أمي الغالية 🌸' },
                      { id: 'father', label: 'أبي الحبيب 👑' },
                      { id: 'both', label: 'والديّ معاً 🤍' },
                      { id: 'custom', label: 'اسم مخصص ✍️' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setParentType(item.id as ParentType)}
                        className={`py-2 px-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all border cursor-pointer ${
                          parentType === item.id
                            ? 'bg-gold-400/20 text-gold-300 border-gold-400/50 shadow-sm'
                            : 'bg-surface-900/60 text-white/60 border-white/[0.06] hover:bg-white/5'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  {/* Custom Name Input if custom is chosen */}
                  {parentType === 'custom' && (
                    <input
                      type="text"
                      placeholder="اكتب اسم والدتك أو والدك (مثلاً: أمي الحبيبة فاطمة)"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface-900 border border-gold-400/30 text-white text-xs sm:text-sm placeholder:text-white/30 focus:outline-none focus:border-gold-400"
                    />
                  )}

                  {/* Life Status (Alive / Deceased) */}
                  <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
                    <span className="text-xs text-white/70 font-medium">حالة الوالدين:</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setLifeStatus('alive')}
                        className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                          lifeStatus === 'alive'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                            : 'text-white/40 hover:text-white'
                        }`}
                      >
                        أحياء (حفظهم الله) 🌿
                      </button>
                      <button
                        type="button"
                        onClick={() => setLifeStatus('deceased')}
                        className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                          lifeStatus === 'deceased'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                            : 'text-white/40 hover:text-white'
                        }`}
                      >
                        متوفين (رحمهم الله) 🕊️
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. Live Luxury 4K Card Preview with Large Prominent Centered Dua */}
                <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-[#103023] via-[#081811] to-[#030a07] border-2 border-gold-400/40 shadow-2xl text-center space-y-4 overflow-hidden">
                  <div className="absolute top-2 right-2 text-gold-400/20 font-amiri text-6xl select-none pointer-events-none">
                    ﷽
                  </div>

                  <div className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-gold-400/15 border border-gold-400/30 text-gold-300 text-xs sm:text-sm font-bold">
                    <span>إهداء ودعاء بالبر والرضا</span>
                  </div>

                  <h4 className="text-2xl sm:text-3xl font-black text-gold-300">{currentTitle}</h4>

                  <div className="p-3 rounded-xl bg-black/40 border border-gold-400/25 max-w-lg mx-auto">
                    <p className="text-base sm:text-lg text-yellow-300 font-amiri font-bold">
                      ﴿ رَّبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا ﴾
                    </p>
                  </div>

                  {/* Large Centered Dua Box */}
                  <div className="p-5 sm:p-7 rounded-2xl bg-black/60 border-2 border-gold-400/40 shadow-inner my-3">
                    <p className="text-lg sm:text-2xl font-amiri font-bold leading-loose text-white text-center">
                      « {currentDua} »
                    </p>
                  </div>

                  <div className="pt-2 text-xs text-white/50 font-mono">
                    استوديو «أَثَــر» • atar-studio.com
                  </div>
                </div>

                {/* 3. Card Action Buttons (Download 4K Image / WhatsApp / Copy) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={handleDownload4KCard}
                    disabled={isGeneratingImage}
                    className="py-3.5 px-3 rounded-2xl bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-surface-950 font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                  >
                    <Download size={16} />
                    <span>
                      {isGeneratingImage ? 'جارٍ توليد الصورة 4K...' : 'تحميل بطاقة 4K عريضة 📥'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleWhatsAppShare}
                    className="py-3.5 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                  >
                    <Send size={15} />
                    <span>إرسال في واتساب 📲</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyParentDua}
                    className="py-3.5 px-3 rounded-2xl bg-surface-800 hover:bg-surface-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 border border-white/[0.08] transition-all cursor-pointer"
                  >
                    {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                    <span>{copied ? 'تم النسخ' : 'نسخ الدعاء 📋'}</span>
                  </button>
                </div>

                {/* 4. Interactive Daily Parents Tasbeeh Counter */}
                <div className="p-4 rounded-2xl bg-surface-950/80 border border-emerald-500/25 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-right">
                    <div className="font-bold text-xs sm:text-sm text-emerald-300 flex items-center gap-1.5">
                      <Award size={15} />
                      <span>مسبحة بر الوالدين اليومية:</span>
                    </div>
                    <div className="text-xs sm:text-sm text-white/60 mt-0.5 font-amiri font-bold">
                      ﴿ رَّبِّ اغْفِرْ لِي وَلِوَالِدَيَّ ﴾
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setParentsTasbeehCount((c) => c + 1);
                      addToast({
                        message: 'تقبل الله استغفارك ودعاءك لوالديك 🌸✨',
                        type: 'success',
                      });
                    }}
                    className="py-2.5 px-5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs sm:text-sm font-bold flex items-center gap-2 active:scale-90 transition-transform cursor-pointer"
                  >
                    <span>استغفر لوالديك الآن 📿</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/30 font-mono text-emerald-200 font-bold">
                      {parentsTasbeehCount}
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              // ==================== TAB 2: TIJANI AISHA UNIVERSAL REVERENCE DEDICATION (LARGE CLEAR TEXT) ====================
              <div className="space-y-4">
                {/* Hadith Banner: Ameen Wa Laka Bi Mithl */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-surface-950 to-gold-500/20 border-2 border-gold-400/40 text-right space-y-2">
                  <div className="font-black text-sm sm:text-base text-gold-300 flex items-center gap-2">
                    <Sparkles size={16} className="text-gold-400" />
                    <span>بشارة نبوية شريفة (الملائكة تدعو لك ولوالديك):</span>
                  </div>
                  <p className="text-sm sm:text-base text-white leading-relaxed font-medium font-amiri text-lg sm:text-xl">
                    قال رسول الله ﷺ:{' '}
                    <strong className="text-yellow-200 font-bold">
                      «دَعْوَةُ المَرْءِ المُسْلِمِ لأَخِيهِ بِظَهْرِ الغَيْبِ مُسْتَجَابَةٌ، عِنْدَ
                      رَأْسِهِ مَلَكٌ مُوَكَّلٌ كُلَّمَا دَعَا لأَخِيهِ بِخَيْرٍ، قَالَ المَلَكُ:
                      آمِينَ وَلَكَ بِمِثْلٍ»
                    </strong>
                  </p>
                  <p className="text-xs sm:text-sm text-gold-300 font-bold leading-relaxed pt-1 border-t border-gold-400/20">
                    💡 فكل دعوة تدعوها للوالدة الكريمة <strong>«تيجاني عائشة»</strong>، ترد عليك
                    الملائكة بالدعاء لك ولوالديك بمثلها!
                  </p>
                </div>

                {/* Duas List - Universally Phrased with Large, Comfortable, Well-spaced Typography */}
                {tijaniDuas.map((dua, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 * i }}
                    className="p-5 sm:p-6 rounded-2xl bg-surface-950/90 border border-white/[0.12] hover:border-gold-400/40 transition-all text-right space-y-2.5 shadow-md"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-gold-400"></span>
                      <h4 className="text-sm sm:text-base font-black text-gold-300">{dua.title}</h4>
                    </div>
                    <p className="text-base sm:text-lg md:text-xl text-white leading-loose font-amiri font-bold tracking-wide">
                      {dua.text}
                    </p>
                  </motion.div>
                ))}

                {/* Platform Dedication Note */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-surface-950 to-gold-500/15 border border-emerald-500/30 text-xs sm:text-sm text-white/90 leading-relaxed space-y-1">
                  <p className="font-bold text-white mb-1 flex items-center gap-1.5 text-sm sm:text-base">
                    <BookOpen size={16} className="text-emerald-400" />
                    <span>عن هذا المشروع المبارك:</span>
                  </p>
                  تم تطوير استوديو <strong>«أَثَــر»</strong> ليكون مجانياً بالكامل لكل مسلم ومسلمة
                  لصناعة المحتوى القرآني النافع، ويكون أجر كل تلاوة وريل منشور في ميزان حسنات
                  الوالدة <strong>تيجاني عائشة</strong> ووالدينا جميعاً.
                </div>

                {/* Ameen Button for Tijani Aisha */}
                <button
                  type="button"
                  onClick={handleAmeenTijani}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-surface-950 font-black text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg shadow-gold-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  <Heart
                    size={18}
                    className={`text-rose-700 fill-rose-700 ${hasPrayedTijani ? 'scale-125' : ''} transition-transform`}
                  />
                  <span>اللهم اغفر لها وارحمها • آمين ولك بمثل 🤲</span>
                  <span className="text-xs sm:text-sm bg-black/15 px-2.5 py-0.5 rounded-full font-bold">
                    {ameenCount} دعاء
                  </span>
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
