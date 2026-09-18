import { useEffect, useState, useRef } from "react";
import { backendState } from "../utils/backendState";

export default function WakeBackend() {
  const [status, setStatus] = useState(backendState.getStatus());
  const isCheckingRef = useRef(false);

  useEffect(() => {
    // Subscribe to backendState changes
    const unsubscribe = backendState.subscribe(setStatus);
    
    // Start initial check if not already checking/ready
    if (backendState.getStatus() === 'checking') {
      checkBackend();
    }
    
    return () => unsubscribe();
  }, []);

  const checkBackend = async () => {
    if (isCheckingRef.current) return;
    isCheckingRef.current = true;
    backendState.setStatus("checking");
    
    let isMounted = true;
    const maxDurationMs = 60000; // maximum 60 seconds
    const intervalMs = 3000;
    const maxRetries = Math.ceil(maxDurationMs / intervalMs);
    const baseURL = import.meta.env.VITE_API_URL || "/api";
    const healthUrl = `${baseURL}/health`;

    for (let i = 0; i < maxRetries; i++) {
      if (!isMounted) break;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(healthUrl, {
          method: "GET",
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          console.log("✅ Backend is awake and responsive.");
          backendState.setStatus("ready");
          isCheckingRef.current = false;
          return;
        } else {
          console.warn(`⏳ Backend returned status ${response.status} on attempt ${i + 1}`);
        }
      } catch (error) {
        console.warn(`⏳ Backend wake attempt ${i + 1} failed or timed out. Render may be cold-starting...`);
      }

      // Wait before next retry
      if (i < maxRetries - 1 && isMounted) {
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
      }
    }

    if (isMounted) {
      console.error("❌ Backend could not be reached after maximum retries.");
      backendState.setStatus("error");
      isCheckingRef.current = false;
    }
  };

  const handleRetry = () => {
    checkBackend();
  };

  if (status === "ready") return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-safe flex justify-center pointer-events-none">
      <div className="bg-slate-900/90 backdrop-blur text-white px-5 py-3 rounded-2xl shadow-xl border border-slate-700/50 pointer-events-auto max-w-sm w-full mx-auto flex items-center justify-between gap-4 animate-in slide-in-from-bottom-5 fade-in duration-300">
        
        {status === "checking" && (
          <div className="flex items-center gap-3">
            <div className="relative flex h-8 w-8 items-center justify-center">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[#ee0039] opacity-20 animate-ping"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#ee0039]"></span>
            </div>
            <div>
              <p className="text-sm font-semibold tracking-wide text-slate-100">Connecting to church server…</p>
              <p className="text-xs text-slate-400 mt-0.5">Please wait a moment.</p>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="flex items-center gap-3 w-full justify-between">
            <div className="flex flex-col">
              <p className="text-sm font-semibold tracking-wide text-red-400">Church services unavailable</p>
              <p className="text-xs text-slate-400 mt-0.5">Could not reach the server.</p>
            </div>
            <button 
              onClick={handleRetry}
              className="bg-white/10 hover:bg-white/20 active:bg-white/10 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
