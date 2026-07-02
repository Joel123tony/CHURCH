export default function TextField({ value, onChange, placeholder = "Enter text" }) {
  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border px-4 py-2"
    />
  );
}