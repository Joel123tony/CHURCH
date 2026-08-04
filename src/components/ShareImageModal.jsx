import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Share2, ChevronLeft, ChevronRight, Loader2, AlignLeft, AlignCenter, AlignRight, Check , Download} from 'lucide-react';


import { renderVerseCanvas } from '../utils/canvasRenderer';

const THEMES = [
  {
    id: 'burgundy-gold',
    name: 'Burgundy & Gold',
    bg: { type: 'linear', x0: 0, y0: 0, x1: 1080, y1: 1080, stops: [{ offset: 0, color: '#4A0E1B' }, { offset: 1, color: '#2A0810' }] },
    textColor: '#F4EFE7',
    accentColor: '#D4AF37',
  },
  {
    id: 'cream-gold',
    name: 'Cream & Gold',
    bg: { type: 'linear', x0: 0, y0: 0, x1: 1080, y1: 1080, stops: [{ offset: 0, color: '#F9F6F0' }, { offset: 1, color: '#E8DCCB' }] },
    textColor: '#54091b',
    accentColor: '#D4AF37',
  },
  {
    id: 'minimal-white',
    name: 'Minimal White',
    bg: { type: 'solid', color: '#FFFFFF' },
    textColor: '#1E293B',
    accentColor: '#94A3B8',
  },
  {
    id: 'cross-silhouette',
    name: 'Cross Silhouette',
    bg: { type: 'linear', x0: 0, y0: 0, x1: 0, y1: 1080, stops: [{ offset: 0, color: '#1e3c72' }, { offset: 1, color: '#2a5298' }] },
    textColor: '#FFFFFF',
    accentColor: '#FFD700',
    overlay: { type: 'radial', x0: 540, y0: 540, r0: 0, x1: 540, y1: 540, r1: 760, stops: [{ offset: 0, color: 'rgba(255,255,255,0.1)' }, { offset: 1, color: 'rgba(0,0,0,0.4)' }] }
  },
  {
    id: 'soft-light-rays',
    name: 'Soft Light Rays',
    bg: { type: 'linear', x0: 0, y0: 0, x1: 1080, y1: 800, stops: [{ offset: 0, color: '#fdfbfb' }, { offset: 1, color: '#ebedee' }] },
    textColor: '#334155',
    accentColor: '#D4AF37',
  }
];

const FONTS_EN = [
  { name: 'Playfair Display', value: "'Playfair Display', serif" },
  { name: 'Merriweather', value: "'Merriweather', serif" },
  { name: 'Libre Baskerville', value: "'Libre Baskerville', serif" },
  { name: 'Cormorant Garamond', value: "'Cormorant Garamond', serif" },
  { name: 'Crimson Text', value: "'Crimson Text', serif" },
];

const FONTS_TA = [
  { name: 'Noto Serif Tamil', value: "'Noto Serif Tamil', serif" },
  { name: 'Noto Sans Tamil', value: "'Noto Sans Tamil', sans-serif" },
  { name: 'Catamaran', value: "'Catamaran', sans-serif" },
  { name: 'Mukta Malar', value: "'Mukta Malar', sans-serif" },
  { name: 'Hind Madurai', value: "'Hind Madurai', sans-serif" },
];

const COLORS = [
  { name: 'Theme Default', value: '' }, 
  { name: 'White', value: '#FFFFFF' },
  { name: 'Black', value: '#000000' },
  { name: 'Burgundy', value: '#5B0E21' },
  { name: 'Gold', value: '#D4AF37' },
  { name: 'Cream', value: '#F4EFE7' },
  { name: 'Dark Brown', value: '#3E2723' },
  { name: 'Navy Blue', value: '#1A237E' },
];

const ALIGNMENTS = [
  { name: 'Left', value: 'left', icon: AlignLeft },
  { name: 'Center', value: 'center', icon: AlignCenter },
  { name: 'Right', value: 'right', icon: AlignRight },
];

const SIZES = [16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40];

export default function ShareImageModal({ isOpen, onClose, verseData }) {
  const [currentThemeIndex, setCurrentThemeIndex] = useState(0);
  const [fontSize, setFontSize] = useState(28);
  const [fontColor, setFontColor] = useState('');
  const [textAlign, setTextAlign] = useState('center');
  const [fontFamily, setFontFamily] = useState('');
  const [isGenerating] = useState(false);
  const [previewDataUrl, setPreviewDataUrl] = useState(null);
  const [previewBlob, setPreviewBlob] = useState(null);

  
  
  const activeTheme = THEMES[currentThemeIndex];
  const { bookLocalized, chapter, verseNum, text, language, isMultiple } = verseData || {};

  // Inject Google Fonts dynamically
  useEffect(() => {
    if (isOpen) {
      const link = document.createElement('link');
      link.href = 'https://fonts.googleapis.com/css2?family=Catamaran:wght@400;700&family=Cormorant+Garamond:wght@400;700&family=Crimson+Text:wght@400;700&family=Hind+Madurai:wght@400;700&family=Libre+Baskerville:wght@400;700&family=Merriweather:wght@400;700&family=Mukta+Malar:wght@400;700&family=Noto+Sans+Tamil:wght@400;700&family=Noto+Serif+Tamil:wght@400;700&family=Playfair+Display:wght@400;700&display=swap';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
      return () => { document.head.removeChild(link); };
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && language) {
      if (language === 'en') {
        setFontFamily(FONTS_EN[0].value);
      } else {
        setFontFamily(FONTS_TA[0].value);
      }
    }
  }, [isOpen, language]);

  // Reset to default max font size when verse changes, letting the canvasRenderer auto-fit it down if needed
  useEffect(() => {
    if (isOpen && text) {
      setFontSize(36);
    }
  }, [isOpen, text]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);


  const fontOptions = language === 'en' ? FONTS_EN : FONTS_TA;
  const currentSizeIndex = SIZES.indexOf(fontSize);

  const handleNextTheme = () => setCurrentThemeIndex((prev) => (prev + 1) % THEMES.length);
  const handlePrevTheme = () => setCurrentThemeIndex((prev) => (prev === 0 ? THEMES.length - 1 : prev - 1));

  const handleShare = async () => {
    if (!previewBlob) return;
    
    try {
      const file = new File([previewBlob], `verse-${chapter}-${verseNum}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Bible Verse',
          text: `${bookLocalized} ${chapter}:${verseNum}`
        });
      } else {
        handleDownload(); // fallback
      }
    } catch (err) {
      console.error('Error sharing image:', err);
    }
  };

  
  const handleDownload = async () => {
    if (!previewBlob) return;
    
    try {
      const url = URL.createObjectURL(previewBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${bookLocalized}_${chapter}_${verseNum}.png`.replace(/\s+/g, '_');
      
      if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) {
         a.target = '_blank';
      }
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error('Error downloading image:', err);
    }
  };

  const finalColor = fontColor || activeTheme.textColor;

  useEffect(() => {
    if (!isOpen || !verseData) return;
    
    let isMounted = true;
    const generatePreview = async () => {
      try {
        const { blob, dataUrl, finalFontSize } = await renderVerseCanvas({
          width: 1080,
          height: 1080,
          theme: activeTheme,
          fontFamily,
          fontSize,
          fontColor: finalColor,
          textAlign,
          bookLocalized,
          chapter,
          verseNum,
          text,
          language,
          isMultiple
        });
        if (isMounted) {
          setPreviewDataUrl(dataUrl);
          setPreviewBlob(blob);
          if (finalFontSize && finalFontSize !== fontSize) {
            setFontSize(finalFontSize);
          }
        }
      } catch (err) {
        console.error("Preview generation failed:", err);
      }
    };
    
    generatePreview();
    return () => { isMounted = false; };
  }, [isOpen, verseData, currentThemeIndex, fontFamily, fontSize, finalColor, textAlign, activeTheme, bookLocalized, chapter, verseNum, text, language, isMultiple]);


  if (!isOpen || !verseData) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[999999] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 md:p-4">
      
      <div className="w-full h-[92dvh] md:h-[90vh] md:max-h-[800px] md:max-w-5xl rounded-t-3xl md:rounded-3xl flex flex-col md:flex-row bg-[linear-gradient(180deg,#5B0E21,#3E0817)] overflow-hidden shadow-2xl relative">
        
        {/* Header (Mobile Only) */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-[#D4AF37]/20 shrink-0 bg-black/20 backdrop-blur-md">
          <h3 className="font-bold text-lg text-white">Share Verse</h3>
          <button onClick={onClose} className="p-2 -mr-2 rounded-full hover:bg-white/10 transition-colors text-white/80">
            <X size={24} />
          </button>
        </div>

        {/* Left / Top: Preview Area */}
        <div className="w-full md:w-[60%] shrink-0 relative flex flex-col p-4 md:p-12 items-center justify-center bg-black/10">
          {/* Desktop Header Overlay */}
          <div className="hidden md:flex absolute top-0 left-0 right-0 p-6 justify-between items-center z-20 pointer-events-none">
            <h3 className="font-bold text-2xl text-white/90 tracking-wide drop-shadow-md">Share Verse</h3>
          </div>
          
          {/* Square Card Wrapper */}
          <div className="relative w-full max-w-[360px] md:max-w-[450px] aspect-square flex flex-col items-center justify-center rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.35)] shrink-0 overflow-hidden mx-auto transition-all duration-300">
            {previewDataUrl ? (
              <img src={previewDataUrl} alt="Verse Preview" className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-black/20 text-white/50">
                <Loader2 size={32} className="animate-spin mb-4" />
                <span className="text-sm font-bold tracking-wider uppercase">Generating Preview</span>
              </div>
            )}
          </div>
        </div>

        {/* Right / Bottom: Controls Panel (Scrollable) */}
        <div className="w-full md:w-[40%] flex-1 flex flex-col border-t md:border-t-0 md:border-l border-[#D4AF37]/25 bg-white/5 backdrop-blur-2xl relative z-10 shadow-[-10px_0_30px_rgba(0,0,0,0.2)] overflow-hidden">
          
          {/* Desktop Close Button */}
          <div className="hidden md:flex justify-end p-4 shrink-0 border-b border-[#D4AF37]/10">
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/70">
              <X size={24} />
            </button>
          </div>

          {/* Scrollable Options List */}
          <div className="flex-1 overflow-y-auto resources-scrollbar p-5 md:p-8 space-y-6 md:space-y-8 pb-[120px]">
            
            {/* Template Selector */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#D4AF37]/80">Template</label>
              <div className="flex items-center justify-between bg-white/5 border border-[#D4AF37]/25 rounded-2xl p-1.5 shadow-sm">
                <button onClick={handlePrevTheme} className="p-3 rounded-xl hover:bg-white/10 transition-colors text-white/80"><ChevronLeft size={20} /></button>
                <div className="flex-1 text-center font-bold text-sm text-white select-none">
                  {currentThemeIndex + 1} / {THEMES.length} <span className="opacity-70 font-normal ml-1 hidden lg:inline">- {activeTheme.name}</span>
                </div>
                <button onClick={handleNextTheme} className="p-3 rounded-xl hover:bg-white/10 transition-colors text-white/80"><ChevronRight size={20} /></button>
              </div>
            </div>
            
            {/* Font Family */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#D4AF37]/80">Font Family</label>
              <select 
                value={fontFamily} 
                onChange={(e) => setFontFamily(e.target.value)}
                className="w-full p-3.5 bg-white/5 border border-[#D4AF37]/25 rounded-2xl text-sm font-medium text-white shadow-sm outline-none focus:ring-2 focus:ring-[#D4AF37]/50 transition-all appearance-none"
              >
                {fontOptions.map(f => <option key={f.value} value={f.value} className="bg-[#5B0E21] text-white">{f.name}</option>)}
              </select>
            </div>

            {/* Size & Align Row */}
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#D4AF37]/80">Font Size</label>
                <div className="flex items-center justify-between bg-white/5 border border-[#D4AF37]/25 rounded-2xl p-1.5 shadow-sm h-[52px]">
                  <button onClick={() => setFontSize(SIZES[Math.max(0, currentSizeIndex - 1)])} disabled={currentSizeIndex === 0} className="p-2 hover:bg-white/10 rounded-xl disabled:opacity-30 text-white transition-colors">
                    <span className="font-bold">A-</span>
                  </button>
                  <span className="text-sm font-bold text-white">{fontSize}</span>
                  <button onClick={() => setFontSize(SIZES[Math.min(SIZES.length - 1, currentSizeIndex + 1)])} disabled={currentSizeIndex === SIZES.length - 1} className="p-2 hover:bg-white/10 rounded-xl disabled:opacity-30 text-white transition-colors">
                    <span className="font-bold">A+</span>
                  </button>
                </div>
              </div>
              
              <div className="flex-1 space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#D4AF37]/80">Alignment</label>
                <div className="flex items-center justify-between bg-white/5 border border-[#D4AF37]/25 rounded-2xl p-1.5 shadow-sm h-[52px]">
                  {ALIGNMENTS.map(align => (
                    <button 
                      key={align.value}
                      onClick={() => setTextAlign(align.value)}
                      className={`p-2 rounded-xl transition-colors ${textAlign === align.value ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'hover:bg-white/10 text-white/60'}`}
                    >
                      <align.icon size={18} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Font Color */}
            <div className="space-y-2 pb-4">
              <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#D4AF37]/80">Text Color</label>
              <div className="flex flex-wrap gap-3">
                {COLORS.map(color => (
                  <button
                    key={color.name}
                    onClick={() => setFontColor(color.value)}
                    title={color.name}
                    className={`w-10 h-10 rounded-full border-2 shadow-sm transition-transform ${fontColor === color.value ? 'scale-110 border-[#D4AF37] ring-2 ring-[#D4AF37]/40' : 'border-white/10 hover:scale-105'}`}
                    style={{ backgroundColor: color.value || activeTheme.textColor }}
                  >
                    {fontColor === color.value && <div className="w-full h-full flex items-center justify-center mix-blend-difference"><Check size={16} className="text-white opacity-80"/></div>}
                  </button>
                ))}
              </div>
            </div>
          </div>

                    {/* Action Buttons (Sticky at Bottom) */}
          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 border-t border-[#D4AF37]/25 shrink-0 bg-[linear-gradient(180deg,transparent,#3E0817_20%)] md:bg-black/10 flex gap-4">
            <button 
              onClick={handleShare}
              disabled={isGenerating}
              className="flex-1 bg-gradient-to-b from-[#7A0F24] to-[#5B0E21] hover:from-[#8B132A] hover:to-[#6B1127] border border-[#D4AF37]/30 text-white h-[48px] rounded-[14px] font-bold flex items-center justify-center gap-2 transition-all duration-[250ms] hover:-translate-y-[1px] disabled:opacity-70 text-[15px] shadow-[0_4px_10px_rgba(91,14,33,0.4)] hover:shadow-[0_6px_15px_rgba(212,175,55,0.3)] hover:text-[#D4AF37] group"
            >
              {isGenerating ? <Loader2 size={18} className="animate-spin text-[#D4AF37]" /> : <Share2 size={18} className="text-[#D4AF37] group-hover:scale-110 transition-transform" />}
              Share
            </button>
            <button 
              onClick={handleDownload}
              disabled={isGenerating}
              className="flex-1 bg-gradient-to-b from-[#7A0F24] to-[#5B0E21] hover:from-[#8B132A] hover:to-[#6B1127] border border-[#D4AF37]/30 text-white h-[48px] rounded-[14px] font-bold flex items-center justify-center gap-2 transition-all duration-[250ms] hover:-translate-y-[1px] disabled:opacity-70 text-[15px] shadow-[0_4px_10px_rgba(91,14,33,0.4)] hover:shadow-[0_6px_15px_rgba(212,175,55,0.3)] hover:text-[#D4AF37] group"
            >
              {isGenerating ? <Loader2 size={18} className="animate-spin text-[#D4AF37]" /> : <Download size={18} className="text-[#D4AF37] group-hover:scale-110 transition-transform" />}
              Download
            </button>
          </div>

        </div>

      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
}
