import { useState, useEffect } from 'react';
import { X, Smartphone } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

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
  if (!showPrompt || !deferredPrompt || isAdminRoute) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:w-[340px] bg-[#F4EFE7] border border-[#54091b]/20 shadow-2xl rounded-2xl p-5 z-[99999] flex flex-col">
      <button 
        onClick={handleClose}
        className="absolute top-3 right-3 text-[#54091b]/50 hover:text-[#54091b] p-1.5 rounded-full hover:bg-[#54091b]/5 transition-all"
        aria-label="Close"
      >
        <X size={18} />
      </button>
      
      <div className="flex items-start gap-4 mb-4 mt-1">
        <div className="w-12 h-12 bg-white text-[#54091b] rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-[#54091b]/10">
          <Smartphone size={24} strokeWidth={2.5} />
        </div>
        <div className="pr-5">
          <h3 className="font-bold text-[#54091b] text-base leading-tight mb-1">Install App</h3>
          <p className="text-[13px] text-[#54091b]/70 leading-snug">
            Get a faster, more seamless experience on your device.
          </p>
        </div>
      </div>
      
      <button 
        onClick={handleInstallClick}
        className="w-full py-2.5 bg-[#54091b] text-white rounded-xl font-bold hover:bg-[#3a0612] transition-colors shadow-md hover:shadow-lg active:scale-[0.98]"
      >
        Install Now
      </button>
    </div>
  );
}
