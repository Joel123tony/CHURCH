import React, { useEffect, useState } from 'react';

export default function MobileScrollIndicator({ scrollRef, theme = 'light' }) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [thumbWidth, setThumbWidth] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let ticking = false;

    const updateScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = el;
      
      // Prevent divide by zero and hide if no overflow
      if (scrollWidth <= clientWidth || clientWidth === 0) {
        setIsVisible(false);
        return;
      }
      
      setIsVisible(true);
      
      const maxScroll = scrollWidth - clientWidth;
      // Clamp progress between 0 and 1
      const progress = Math.max(0, Math.min(1, scrollLeft / maxScroll));
      
      const ratio = clientWidth / scrollWidth;
      // Thumb width should visually represent the viewport ratio, with min and max limits
      const calculatedWidth = Math.max(ratio * 100, 15);
      
      setThumbWidth(calculatedWidth);
      setScrollProgress(progress);
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    updateScroll();
    
    // Observe resize events to update the scrollbar when layout changes
    const resizeObserver = new ResizeObserver(() => updateScroll());
    resizeObserver.observe(el);

    el.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', updateScroll, { passive: true });

    return () => {
      el.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateScroll);
      resizeObserver.disconnect();
    };
  }, [scrollRef]);

  if (!isVisible) return null;

  // theme='light' refers to a light section background (so track is dark/transparent, thumb is dark)
  // theme='dark' refers to a dark section background (so track is light/transparent, thumb is light)
  const trackBg = theme === 'light' ? 'bg-[#54091b]/10' : 'bg-white/15';
  const thumbBg = theme === 'light' ? 'bg-[#54091b]/80' : 'bg-white/90';

  const maxTravel = 100 - thumbWidth;
  // Calculate translateX percentage based on thumb's own width
  const translateX = thumbWidth > 0 ? (scrollProgress * maxTravel) / thumbWidth * 100 : 0;

  return (
    <div className={`md:hidden mt-4 mx-auto w-24 h-1.5 rounded-full relative overflow-hidden ${trackBg}`}>
      <div 
        className={`absolute top-0 bottom-0 left-0 rounded-full transition-transform duration-75 ease-out ${thumbBg}`}
        style={{
          width: `${thumbWidth}%`,
          transform: `translateX(${translateX}%)`
        }}
      />
    </div>
  );
}
