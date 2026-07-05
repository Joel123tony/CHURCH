import { useRef } from "react";

export default function TextareaField({ value, onChange, placeholder = "Enter text" }) {
  const ref = useRef(null);

  return (
    <textarea
      ref={ref}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full min-h-[160px] rounded-lg border px-4 py-2 resize-y"
    />
  );
}