import re

file_path = r'd:\MY_SITES\Chruch_web\src\components\ShareImageModal.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add Download import to lucide-react
content = re.sub(r"import \{([^}]+)\} from 'lucide-react';", r"import {\1, Download} from 'lucide-react';", content)

# 2. Add handleDownload after handleShare
download_logic = """
  const handleDownload = async () => {
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
  };
"""

content = content.replace("const finalColor = fontColor || activeTheme.textColor;", download_logic + "\n  const finalColor = fontColor || activeTheme.textColor;")

# 3. Replace the existing Share button JSX
old_button_jsx = """          {/* Share Button (Sticky at Bottom) */}
          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 border-t border-[#D4AF37]/25 shrink-0 bg-[linear-gradient(180deg,transparent,#3E0817_20%)] md:bg-black/10">
            <button 
              onClick={handleShare}
              disabled={isGenerating}
              className="w-full bg-gradient-to-b from-[#7A0F24] to-[#5B0E21] hover:from-[#8B132A] hover:to-[#6B1127] border border-[#D4AF37]/30 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all duration-300 disabled:opacity-70 text-[16px] shadow-[0_10px_20px_rgba(91,14,33,0.4)] hover:shadow-[0_10px_25px_rgba(212,175,55,0.2)]"
            >
              {isGenerating ? <Loader2 size={22} className="animate-spin text-[#D4AF37]" /> : <Share2 size={22} className="text-[#D4AF37]" />}
              {isGenerating ? 'Generating Image...' : 'Share Image'}
            </button>
          </div>"""

new_button_jsx = """          {/* Action Buttons (Sticky at Bottom) */}
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
          </div>"""

# Ensure it replaces safely by matching more flexibly
import re
content = re.sub(r'\{\s*/\*\s*Share Button \(Sticky at Bottom\)\s*\*/\s*\}.*?</div>\s*</div>', new_button_jsx + '\n\n        </div>', content, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Applied add_download.py")
