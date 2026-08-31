const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'BibleBlessingModal.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add import
if (!content.includes('renderVerseCanvas')) {
    content = content.replace(
        'import bibleLogo from "../assets/bible-logo.png";',
        'import bibleLogo from "../assets/bible-logo.png";\nimport { renderVerseCanvas } from "../utils/canvasRenderer";'
    );
}

// 2. Add font loading useEffect
const fontEffect = `
  // Inject Google Fonts dynamically so canvas can use them
  useEffect(() => {
    if (isVisible) {
      const link = document.createElement('link');
      link.href = 'https://fonts.googleapis.com/css2?family=Noto+Serif+Tamil:wght@400;700&family=Playfair+Display:wght@400;700&display=swap';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
      return () => { document.head.removeChild(link); };
    }
  }, [isVisible]);

  useEffect(() => {`;

if (!content.includes('family=Noto+Serif+Tamil')) {
    content = content.replace(
        '  useEffect(() => {\n    // Check if it has already been shown',
        fontEffect + '\n    // Check if it has already been shown'
    );
}

// 3. Replace handleSaveImage
const oldHandleSaveImage = `  const handleSaveImage = async () => {
    if (!exportRef.current) return;
    setIsGeneratingImage(true);

    try {
      // Dynamically import html2canvas
      const html2canvas = (await import('html2canvas')).default;

      const canvas = await html2canvas(exportRef.current, {
        scale: 2, // High DPI for crisp text
        useCORS: true,
        backgroundColor: "#F4EFE7",
        width: 1080,
        height: 1350,
      });

      const image = canvas.toDataURL("image/png", 1.0);
      const link = document.createElement("a");
      link.href = image;
      link.download = \`Bible-Blessing-\${language}.png\`;
      link.click();
    } catch (error) {
      console.error("Failed to generate image:", error);
    } finally {
      setIsGeneratingImage(false);
    }
  };`;

const newHandleSaveImage = `  const handleSaveImage = async () => {
    if (!verse) return;
    setIsGeneratingImage(true);

    try {
      const currentVerse = verse[language];
      const theme = {
        bg: { type: 'solid', color: '#F8F3EC' },
        textColor: '#5D1324',
        accentColor: '#D7C9B5',
      };

      const fontFamily = language === 'en' ? "'Playfair Display', serif" : "'Noto Serif Tamil', serif";

      const { dataUrl } = await renderVerseCanvas({
        width: 1080,
        height: 1350, // 4:5 Instagram Portrait ratio
        theme,
        fontFamily,
        fontSize: 48,
        fontColor: theme.textColor,
        textAlign: 'center',
        bookLocalized: currentVerse.book,
        chapter: currentVerse.chapter,
        verseNum: currentVerse.verse,
        text: currentVerse.text,
        language: language,
        isMultiple: false
      });

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = \`Bible-Blessing-\${language}.png\`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Failed to generate image:", error);
    } finally {
      setIsGeneratingImage(false);
    }
  };`;

content = content.replace(oldHandleSaveImage, newHandleSaveImage);

// 4. Remove exportRef div block
const exportRefStart = "      {/* Hidden Export Template - 1080x1350 (Instagram Portrait) */}";
if (content.includes(exportRefStart)) {
    content = content.substring(0, content.indexOf(exportRefStart)) + "    </div>\n  );\n}\n";
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Updated successfully');
