import darkLogoUrl from '../assets/methodist-logo.png';
import lightLogoUrl from '../assets/bible-logo.png';

const loadImage = (src) => new Promise((resolve, reject) => {
  const img = new Image();
  img.crossOrigin = 'Anonymous';
  img.onload = () => resolve(img);
  img.onerror = reject;
  img.src = src;
});

let cachedDarkLogo = null;
let cachedLightLogo = null;

const hexToRgb = (hex) => {
  let c = hex.substring(1);
  if(c.length === 3){
    c = c.split('').map(x => x + x).join('');
  }
  return {
    r: parseInt(c.substring(0,2), 16),
    g: parseInt(c.substring(2,4), 16),
    b: parseInt(c.substring(4,6), 16)
  };
};

const getBackgroundBrightness = (theme) => {
  let color = '#FFFFFF';
  
  if (theme.bg.type === 'solid') {
    color = theme.bg.color;
  } else if (theme.bg.type === 'linear' || theme.bg.type === 'radial') {
    if (theme.bg.stops && theme.bg.stops.length > 0) {
      let rSum = 0, gSum = 0, bSum = 0;
      theme.bg.stops.forEach(stop => {
        const rgb = hexToRgb(stop.color);
        rSum += rgb.r;
        gSum += rgb.g;
        bSum += rgb.b;
      });
      const avgR = rSum / theme.bg.stops.length;
      const avgG = gSum / theme.bg.stops.length;
      const avgB = bSum / theme.bg.stops.length;
      return 0.299 * avgR + 0.587 * avgG + 0.114 * avgB;
    }
  }
  
  const rgb = hexToRgb(color);
  return 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
};

function wrapText(context, text, maxWidth) {
  const paragraphs = text.split('\n');
  const lines = [];
  
  paragraphs.forEach(para => {
    if (!para.trim()) {
      lines.push('');
      return;
    }
    const words = para.split(' ');
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = context.measureText(currentLine + " " + word).width;
      if (width < maxWidth) {
        currentLine += " " + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
  });
  return lines;
}

export const renderVerseCanvas = async (options) => {
  const {
    width = 1080,
    height = 1080,
    theme,
    fontFamily,
    fontSize,
    fontColor,
    textAlign,
    bookLocalized,
    chapter,
    verseNum,
    text,
    language,
    isMultiple
  } = options;

  await document.fonts.ready;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Draw Background
  if (theme.bg.type === 'solid') {
    ctx.fillStyle = theme.bg.color;
    ctx.fillRect(0, 0, width, height);
  } else if (theme.bg.type === 'linear') {
    const grad = ctx.createLinearGradient(theme.bg.x0, theme.bg.y0, theme.bg.x1, theme.bg.y1);
    theme.bg.stops.forEach(stop => grad.addColorStop(stop.offset, stop.color));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }

  // Draw Overlay
  if (theme.overlay) {
    if (theme.overlay.type === 'radial') {
      const grad = ctx.createRadialGradient(
        theme.overlay.x0, theme.overlay.y0, theme.overlay.r0,
        theme.overlay.x1, theme.overlay.y1, theme.overlay.r1
      );
      theme.overlay.stops.forEach(stop => grad.addColorStop(stop.offset, stop.color));
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    }
  }

  // Draw Logo (Top)
  const luminance = getBackgroundBrightness(theme);
  const isLightBackground = luminance > 128;
  
  const targetLogoUrl = isLightBackground ? lightLogoUrl : darkLogoUrl;
  let activeLogo = isLightBackground ? cachedLightLogo : cachedDarkLogo;

  if (!activeLogo) {
    try {
      activeLogo = await loadImage(targetLogoUrl);
      if (isLightBackground) {
        cachedLightLogo = activeLogo;
      } else {
        cachedDarkLogo = activeLogo;
      }
    } catch (e) {
      console.error("Failed to load logo", e);
    }
  }

  let currentY = 100; // Padding top

  if (activeLogo) {
    const logoHeight = 100; 
    const logoWidth = activeLogo.width * (logoHeight / activeLogo.height);
    const logoX = (width - logoWidth) / 2;
    
    ctx.drawImage(activeLogo, logoX, currentY, logoWidth, logoHeight);
    
    currentY += logoHeight + 40;
  }

  // Footer Area (Fixed)
  const dividerY = height - 160;
  
  ctx.fillStyle = theme.accentColor;
  ctx.fillRect((width - 150) / 2, dividerY, 150, 4);
  
  ctx.fillStyle = fontColor;
  ctx.font = `bold 28px sans-serif`;
  ctx.textAlign = 'center';
  ctx.globalAlpha = 0.9;
  if (ctx.letterSpacing !== undefined) {
     ctx.letterSpacing = "6px";
  }
  ctx.fillText("METHODIST TAMIL CHURCH", width / 2, height - 120);
  ctx.fillText("PADIKUPPAM", width / 2, height - 70);
  ctx.globalAlpha = 1.0;
  if (ctx.letterSpacing !== undefined) {
     ctx.letterSpacing = "0px";
  }

  // Calculate Available Space for Verse + Reference
  const safeGap = 40;
  const bottomSpaceY = dividerY - safeGap;
  const textSpaceY = currentY;
  const availableHeight = bottomSpaceY - textSpaceY;
  const textMaxWidth = width - 160; 
  
  // Reference Configuration
  const referenceText = `${bookLocalized} ${chapter}:${verseNum}`;
  const referenceFontSize = 48;
  const referenceHeight = 50; 
  const referenceGap = 40; // Gap between verse text and reference
  
  // Font Auto-fitting Logic
  const MIN_FONT_SIZE = 14;
  let currentFontSize = fontSize;
  const scale = 2.4; 
  
  let lines = [];
  let lineHeight = 0;
  let verseHeight = 0;
  let totalContentHeight = 0;
  let scaledFontSize = 0;
  
  const wrappedText = isMultiple ? text : `"${text}"`;
  
  while (currentFontSize >= MIN_FONT_SIZE) {
    scaledFontSize = currentFontSize * scale;
    lineHeight = language === 'ta' ? scaledFontSize * 1.7 : scaledFontSize * 1.5;
    
    ctx.font = `500 ${scaledFontSize}px ${fontFamily}, serif`;
    lines = wrapText(ctx, wrappedText, textMaxWidth);
    verseHeight = lines.length * lineHeight;
    
    // Total block height: Verse Text + Gap + Reference
    totalContentHeight = verseHeight + referenceGap + referenceHeight;
    
    if (totalContentHeight <= availableHeight) {
      break; 
    }
    currentFontSize -= 1; 
  }
  
  // Calculate final layout positions (vertically centered in available space)
  let startY = textSpaceY + (availableHeight - totalContentHeight) / 2;
  
  if (startY < textSpaceY) {
    startY = textSpaceY; // Never render above the top boundary
  }

  // Draw Reference Above Verse
  const referenceY = startY;
  ctx.fillStyle = fontColor;
  ctx.font = `bold ${referenceFontSize}px ${fontFamily}, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(referenceText, width / 2, referenceY);

  // Draw Verse Text Below Reference
  const verseStartY = startY + referenceHeight + referenceGap;
  ctx.font = `500 ${scaledFontSize}px ${fontFamily}, serif`;
  ctx.textAlign = textAlign;
  
  lines.forEach((line, index) => {
    let x = width / 2;
    if (textAlign === 'left') x = 80;
    if (textAlign === 'right') x = width - 80;
    ctx.textBaseline = 'top';
    ctx.fillText(line, x, verseStartY + (index * lineHeight));
  });

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve({ blob, dataUrl: canvas.toDataURL('image/png'), finalFontSize: currentFontSize });
    }, 'image/png');
  });
};
