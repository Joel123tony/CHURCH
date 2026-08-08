import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

export default function DateTime({ className = "" }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    // Update every second to ensure the minute ticks over precisely on the exact second
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const formatDate = (date) => {
    // Format: 08 AUG 2026
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }).toUpperCase();
  };

  const formatTime = (date) => {
    // Format: 09:42 AM
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  };

  return (
    <div className={`flex items-center bg-white/50 backdrop-blur-sm border border-[#54091b]/10 shadow-[0_2px_10px_rgba(84,9,27,0.04)] text-[#54091b] px-3.5 py-1.5 sm:py-2 rounded-xl ${className}`}>
      <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2.5 opacity-70" />
      <span className="text-[11px] sm:text-xs font-bold tracking-widest opacity-70 mr-2">{formatDate(time)}</span>
      <span className="opacity-30 text-xs mr-2 font-black">·</span>
      <span className="text-xs sm:text-sm font-extrabold tracking-wide">{formatTime(time)}</span>
    </div>
  );
}
