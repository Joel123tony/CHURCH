import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches || localStorage.getItem('pwaInstalled')) {
      return;
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      localStorage.setItem('pwaInstalled', 'true');
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    let timeoutId;
    let intervalId;

    const evaluateVisibility = () => {
      if (window.matchMedia('(display-mode: standalone)').matches || localStorage.getItem('pwaInstalled')) {
        setShowPrompt(false);
        return;
      }
      
      const cooldownEnd = localStorage.getItem('pwaCooldownEnd');
      const now = new Date().getTime();
      if (cooldownEnd && now < parseInt(cooldownEnd, 10)) {
        setShowPrompt(false);
        return;
      }
      
      const isMobile = window.innerWidth <= 768;
      setShowPrompt(isMobile);
    };

    // Initial 60 second delay before first evaluation
    timeoutId = setTimeout(() => {
      evaluateVisibility();
      // Periodically re-evaluate in case cooldown expires while still on page
      intervalId = setInterval(evaluateVisibility, 10000);
    }, 60000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      localStorage.setItem('pwaInstalled', 'true');
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleClose = () => {
    setShowPrompt(false);
    // Set 10 minute cooldown
    const tenMinutesFromNow = new Date().getTime() + 10 * 60 * 1000;
    localStorage.setItem('pwaCooldownEnd', tenMinutesFromNow.toString());
  };

  // Only render if 60s has passed, cooldown has expired, AND we have a valid install prompt
  if (!showPrompt || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 bg-[#F4EFE7] border border-[#54091b]/20 shadow-lg rounded-xl p-4 z-[99999] flex flex-col gap-2">
      <button 
        onClick={handleClose}
        className="absolute top-2 right-2 text-[#54091b]/60 hover:text-[#54091b] p-1 transition-colors"
        aria-label="Close"
      >
        <X size={18} />
      </button>
      
      <div className="flex items-center gap-3 mb-1">
        <span className="text-2xl" role="img" aria-label="mobile">📱</span>
        <h3 className="font-semibold text-[#54091b] pr-4">App Available</h3>
      </div>
      
      <p className="text-sm text-[#54091b]/80 mb-2 leading-tight">
        Install our app for a faster, easier experience.
      </p>
      
      <button 
        onClick={handleInstallClick}
        className="w-full py-2 bg-[#54091b] text-white rounded-lg font-medium hover:bg-[#3a0612] transition-colors shadow-sm"
      >
        Install App
      </button>
    </div>
  );
}
