const formatBytes = (bytes) => {
  if (!bytes) return "0 KB";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  const value = bytes / 1024 ** index;
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
};

export default function CompressionBadge({ stats }) {
  if (!stats) return null;

  const { status, savingsPercentage, savings, originalSize, compressedSize } = stats;
  const badgeConfig =
    status === "Compressed" && savingsPercentage > 0
      ? { className: "bg-green-600/90", label: `✓ Saved ${savingsPercentage}%` }
      : status === "Already Optimized"
        ? { className: "bg-slate-700/90", label: "✓ Already Optimized" }
        : status === "Error" || status === "Failed"
          ? { className: "bg-red-600/90", label: "⚠ Compression Failed" }
          : null;

  if (!badgeConfig) return null;

  return (
    <div className="absolute top-2 left-2 z-20 group animate-in fade-in duration-300">
      <div
        className={`rounded-md px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm backdrop-blur-md border border-white/10 ${badgeConfig.className}`}
      >
        {badgeConfig.label}
      </div>

      {status === "Compressed" && (
        <div className="pointer-events-none absolute left-0 top-full mt-1.5 hidden w-max rounded-lg bg-gray-900/95 px-3 py-2 text-xs text-gray-200 shadow-xl ring-1 ring-white/10 group-hover:block z-30">
          <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
            <span className="text-gray-400">Original:</span>
            <span className="font-mono text-right">{formatBytes(originalSize)}</span>
            
            <span className="text-gray-400">Compressed:</span>
            <span className="font-mono text-right">{formatBytes(compressedSize)}</span>
            
            <div className="col-span-2 mt-1 mb-1 h-px bg-gray-700/50"></div>
            
            <span className="font-semibold text-green-400">Saved:</span>
            <span className="font-mono font-semibold text-green-400 text-right">
              {formatBytes(savings)} ({savingsPercentage}%)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
