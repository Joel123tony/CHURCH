import { useEffect } from "react";

export default function WakeBackend() {
  useEffect(() => {
    let isMounted = true;

    const wakeBackend = async () => {
      const maxRetries = 3;
      const baseURL = import.meta.env.VITE_API_URL || "/api";
      // We append /health to the baseURL (e.g. /api/health)
      const healthUrl = `${baseURL}/health`;

      for (let i = 0; i < maxRetries; i++) {
        if (!isMounted) return;

        try {
          // Use fetch instead of the global axios instance to avoid 
          // triggering the global error interceptor while Render is waking up.
          const controller = new AbortController();
          // Give Render up to 15 seconds to respond before timing out and retrying
          const timeoutId = setTimeout(() => controller.abort(), 15000);

          const response = await fetch(healthUrl, {
            method: "GET",
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            console.log("✅ Backend is awake and responsive.");
            break; // Success, stop retrying
          } else {
            console.warn(`Backend returned status ${response.status} on attempt ${i + 1}`);
          }
        } catch (error) {
          console.warn(`Backend wake attempt ${i + 1} failed or timed out. Render may be cold-starting...`);
        }

        // Wait before the next retry
        if (i < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      }
    };

    // Give the main UI a moment to paint before sending the background request
    const initTimer = setTimeout(() => {
      wakeBackend();
    }, 500);

    return () => {
      isMounted = false;
      clearTimeout(initTimer);
    };
  }, []);

  return null;
}
