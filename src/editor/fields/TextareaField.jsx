import { useRef, useEffect } from "react";

export default function TextareaField({ value, onChange, placeholder = "Enter text" }) {
  const ref = useRef(null);

  // Auto-resize to fit content, with a comfortable minimum height
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.max(el.scrollHeight, 160) + "px";
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border px-4 py-2 resize-y"
      style={{ minHeight: "160px" }}
    />
  );
}