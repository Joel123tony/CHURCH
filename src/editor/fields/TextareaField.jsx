export default function TextareaField({ value, onChange, placeholder = "Enter text" }) {
  return (
    <textarea
      rows={5}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border px-4 py-2"
    />
  );
}