import re

file_path = r'd:\MY_SITES\Chruch_web\src\components\ShareImageModal.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update THEMES
old_themes = """const THEMES = [
  {
    id: 'burgundy-gold',
    name: 'Burgundy & Gold',
    bg: 'linear-gradient(135deg, #4A0E1B 0%, #2A0810 100%)',
    textColor: '#F4EFE7',
    accentColor: '#D4AF37',
  },
  {
    id: 'cream-gold',
    name: 'Cream & Gold',
    bg: 'linear-gradient(135deg, #F9F6F0 0%, #E8DCCB 100%)',
    textColor: '#54091b',
    accentColor: '#D4AF37',
  },
  {
    id: 'minimal-white',
    name: 'Minimal White',
    bg: '#FFFFFF',
    textColor: '#1E293B',
    accentColor: '#94A3B8',
  },
  {
    id: 'cross-silhouette',
    name: 'Cross Silhouette',
    bg: 'linear-gradient(to bottom, #1e3c72 0%, #2a5298 100%)',
    textColor: '#FFFFFF',
    accentColor: '#FFD700',
    overlay: 'radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.4) 100%)'
  },
  {
    id: 'soft-light-rays',
    name: 'Soft Light Rays',
    bg: 'linear-gradient(120deg, #fdfbfb 0%, #ebedee 100%)',
    textColor: '#334155',
    accentColor: '#D4AF37',
  }
];"""

new_themes = """import { renderVerseCanvas } from '../utils/canvasRenderer';

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
];"""

content = content.replace(old_themes, new_themes)

# 2. Add state for preview data
state_find = "const [isGenerating, setIsGenerating] = useState(false);"
state_replace = """const [isGenerating, setIsGenerating] = useState(false);
  const [previewDataUrl, setPreviewDataUrl] = useState(null);
  const [previewBlob, setPreviewBlob] = useState(null);
"""
content = content.replace(state_find, state_replace)

# 3. Add useEffect to generate canvas whenever options change
# Find: const activeTheme = THEMES[currentThemeIndex];
# The finalColor = fontColor || activeTheme.textColor; needs to be evaluated first.
# Wait, I'll just put the useEffect after `const finalColor`.

useEffect_find = "const finalColor = fontColor || activeTheme.textColor;"
useEffect_replace = """const finalColor = fontColor || activeTheme.textColor;

  useEffect(() => {
    if (!isOpen || !verseData) return;
    
    let isMounted = true;
    const generatePreview = async () => {
      try {
        const { blob, dataUrl } = await renderVerseCanvas({
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
        }
      } catch (err) {
        console.error("Preview generation failed:", err);
      }
    };
    
    generatePreview();
    return () => { isMounted = false; };
  }, [isOpen, verseData, currentThemeIndex, fontFamily, fontSize, finalColor, textAlign, activeTheme, bookLocalized, chapter, verseNum, text, language, isMultiple]);
"""
content = content.replace(useEffect_find, useEffect_replace)

# 4. Update handleShare and handleDownload
share_find = """  const handleShare = async () => {
    if (!imageRef.current) return;
    
    try {
      setIsGenerating(true);
      const html2canvas = (await import('html2canvas')).default;
      
      // Ensure the content is fully rendered and styles applied
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(imageRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
      });

      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      const file = new File([blob], `verse-${chapter}-${verseNum}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Bible Verse',
          text: `${bookLocalized} ${chapter}:${verseNum}`
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Verse-${bookLocalized}-${chapter}-${verseNum}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Error generating image:', err);
    } finally {
      setIsGenerating(false);
    }
  };"""

share_replace = """  const handleShare = async () => {
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
  };"""

content = content.replace(share_find, share_replace)

download_find = """  const handleDownload = async () => {
    if (!imageRef.current) return;
    
    try {
      setIsGenerating(true);
      const html2canvas = (await import('html2canvas')).default;
      
      // Ensure the content is fully rendered and styles applied
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(imageRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
      });

      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${bookLocalized}_${chapter}_${verseNum}.png`.replace(/\s+/g, '_');
      
      // Fallback for strict mobile browsers that block download attribute
      if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) {
         a.target = '_blank';
      }
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error('Error downloading image:', err);
    } finally {
      setIsGenerating(false);
    }
  };"""

download_replace = """  const handleDownload = async () => {
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
  };"""

content = content.replace(download_find, download_replace)

# 5. Update Preview DOM
preview_find_regex = r'\{\s*/\*\s*Square Card Wrapper\s*\*/\s*\}.*?\{\s*/\*\s*Right / Bottom: Controls Panel \(Scrollable\)\s*\*/\s*\}'
preview_replace = """{/* Square Card Wrapper */}
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

        {/* Right / Bottom: Controls Panel (Scrollable) */}"""

content = re.sub(preview_find_regex, preview_replace, content, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Applied update_modal.py")
