import logoUrl from '../assets/methodist-logo.png';

const loadImage = (src) => new Promise((resolve, reject) => {
  const img = new Image();
  img.crossOrigin = 'Anonymous';
  img.onload = () => resolve(img);
  img.onerror = reject;
  img.src = src;
});

let cachedLogo = null;

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
  if (!cachedLogo) {
    try {
      cachedLogo = await loadImage(logoUrl);
    } catch (e) {
      console.error("Failed to load logo", e);
    }
  }

  let currentY = 100; // Padding top

  if (cachedLogo) {
    const logoHeight = 100; // slightly larger for 1080p
    const logoWidth = cachedLogo.width * (logoHeight / cachedLogo.height);
    const logoX = (width - logoWidth) / 2;
    
    ctx.globalAlpha = 0.9;
    ctx.globalCompositeOperation = 'luminosity';
    ctx.drawImage(cachedLogo, logoX, currentY, logoWidth, logoHeight);
    ctx.globalAlpha = 1.0;
    ctx.globalCompositeOperation = 'source-over';
    
    currentY += logoHeight + 40;
  }

  // Draw Reference
  ctx.fillStyle = fontColor;
  ctx.font = `bold 48px ${fontFamily}, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(`${bookLocalized} ${chapter}:${verseNum}`, width / 2, currentY);
  
  currentY += 70;

  // Draw Bottom Divider & Branding
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

  // Draw Verse Text
  const textSpaceY = currentY;
  const bottomSpaceY = dividerY - 40;
  const textMaxWidth = width - 160; 
  
  let currentFontSize = fontSize;
  // Trigger Vite HMR cache invalidation
  const scale = 2.4; // original implementation scaling factor (1080 / 450)
  let scaledFontSize = currentFontSize * scale;
  
  ctx.font = `500 ${scaledFontSize}px ${fontFamily}, serif`;
  ctx.textAlign = textAlign; 
  
  let lineHeight = language === 'ta' ? scaledFontSize * 1.7 : scaledFontSize * 1.5;
  const wrappedText = isMultiple ? text : `"${text}"`;
  
  let lines = wrapText(ctx, wrappedText, textMaxWidth);
  let totalTextHeight = lines.length * lineHeight;
  
  const availableHeight = bottomSpaceY - textSpaceY;
  
  // True DOM measurement auto-fit algorithm
  const MIN_FONT_SIZE = 16;
  let iterations = 0;
  
  // Create hidden DOM element for accurate measurement of Tamil glyphs
  const measureDiv = document.createElement('div');
  measureDiv.style.position = 'absolute';
  measureDiv.style.visibility = 'hidden';
  measureDiv.style.width = textMaxWidth + 'px';
  measureDiv.style.fontFamily = fontFamily;
  measureDiv.style.fontWeight = '500';
  measureDiv.style.textAlign = textAlign;
  measureDiv.style.whiteSpace = 'pre-wrap';
  measureDiv.style.wordBreak = 'break-word';
  measureDiv.innerText = text; // Raw text (unwrapped) to let DOM wrap it naturally
  document.body.appendChild(measureDiv);

  console.log(`Initial font size: ${currentFontSize}px`);
  console.log(`Available height: ${availableHeight}px`);
  
  while (currentFontSize > MIN_FONT_SIZE) {
    scaledFontSize = currentFontSize * scale;
    lineHeight = language === 'ta' ? scaledFontSize * 1.7 : scaledFontSize * 1.5;
    
    measureDiv.style.fontSize = scaledFontSize + 'px';
    measureDiv.style.lineHeight = (language === 'ta' ? '1.7' : '1.5');
    
    const renderedHeight = measureDiv.getBoundingClientRect().height;
    
    console.log(`[Iter ${iterations}] Rendered height: ${renderedHeight}px`);
    
    if (renderedHeight <= availableHeight) {
      console.log(`Fits: true`);
      break; 
    }
    
    currentFontSize -= 2; 
    console.log(`Reducing to: ${currentFontSize}px`);
    iterations++;
    
    if (iterations > 50) {
      console.log("Max iterations reached, breaking to avoid infinite loop.");
      break;
    }
  }
  
  // Cleanup
  document.body.removeChild(measureDiv);
  
  // Recalculate canvas wrapping with final font size
  scaledFontSize = currentFontSize * scale;
  ctx.font = `500 ${scaledFontSize}px ${fontFamily}, serif`;
  lineHeight = language === 'ta' ? scaledFontSize * 1.7 : scaledFontSize * 1.5;
  lines = wrapText(ctx, wrappedText, textMaxWidth);
  totalTextHeight = measureDiv.getBoundingClientRect ? (measureDiv.offsetHeight || lines.length * lineHeight) : (lines.length * lineHeight);
  // Re-measure accurately via DOM before removing it? Wait, it's already removed. 
  // Let's just use the last DOM height for centering.
  // Actually, we can just center based on lines.length * lineHeight for canvas drawing.
  totalTextHeight = lines.length * lineHeight;
  
  console.log(`Final font size: ${currentFontSize}px`);
  
  let startY = textSpaceY + (availableHeight - totalTextHeight) / 2;
  
  // Make sure it doesn't overlap the top if text is very long
  if (startY < textSpaceY) startY = textSpaceY;
  
  lines.forEach((line, index) => {
    let x = width / 2;
    if (textAlign === 'left') x = 80;
    if (textAlign === 'right') x = width - 80;
    ctx.fillText(line, x, startY + (index * lineHeight));
  });

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve({ blob, dataUrl: canvas.toDataURL('image/png'), finalFontSize: currentFontSize });
    }, 'image/png');
  });
};
