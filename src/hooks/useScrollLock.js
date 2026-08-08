import { useEffect } from 'react';

let lockCount = 0;

export function useScrollLock(isLocked) {
  useEffect(() => {
    if (!isLocked || typeof window === 'undefined') return;

    const preventDefault = (e) => {
      // Find closest scrollable container
      let target = e.target;
      let shouldAllowScroll = false;

      while (target && target !== document.body && target !== document.documentElement) {
        const style = window.getComputedStyle(target);
        const overflowY = style.overflowY;
        const isScrollable = (overflowY === 'auto' || overflowY === 'scroll') && target.scrollHeight > target.clientHeight;
        const overflowX = style.overflowX;
        const isScrollableX = (overflowX === 'auto' || overflowX === 'scroll') && target.scrollWidth > target.clientWidth;
        
        if (isScrollable || isScrollableX) {
          shouldAllowScroll = true;
          break;
        }
        target = target.parentElement;
      }

      if (!shouldAllowScroll && e.cancelable) {
        e.preventDefault();
      }
    };

    const preventDefaultForScrollKeys = (e) => {
      const keys = ['ArrowUp', 'ArrowDown', 'Space', 'PageUp', 'PageDown', 'Home', 'End'];
      if (keys.includes(e.code) || keys.includes(e.key)) {
        const tagName = e.target.tagName.toLowerCase();
        if (tagName === 'input' || tagName === 'textarea' || tagName === 'button' || tagName === 'select') {
          return;
        }
        
        let target = e.target;
        let shouldAllowScroll = false;

        while (target && target !== document.body && target !== document.documentElement) {
          const style = window.getComputedStyle(target);
          const overflowY = style.overflowY;
          const isScrollable = (overflowY === 'auto' || overflowY === 'scroll') && target.scrollHeight > target.clientHeight;
          const overflowX = style.overflowX;
          const isScrollableX = (overflowX === 'auto' || overflowX === 'scroll') && target.scrollWidth > target.clientWidth;
          
          if (isScrollable || isScrollableX) {
            shouldAllowScroll = true;
            break;
          }
          target = target.parentElement;
        }

        if (!shouldAllowScroll && e.cancelable) {
          e.preventDefault();
        }
      }
    };

    if (lockCount === 0) {
      window.addEventListener('touchmove', preventDefault, { passive: false });
      window.addEventListener('wheel', preventDefault, { passive: false });
      window.addEventListener('keydown', preventDefaultForScrollKeys, { passive: false });
      
      window.__scrollLockCleanup = () => {
        window.removeEventListener('touchmove', preventDefault);
        window.removeEventListener('wheel', preventDefault);
        window.removeEventListener('keydown', preventDefaultForScrollKeys);
        window.__scrollLockCleanup = null;
      };
    }

    lockCount++;

    return () => {
      lockCount--;
      if (lockCount === 0 && window.__scrollLockCleanup) {
        window.__scrollLockCleanup();
      }
    };
  }, [isLocked]);
}
