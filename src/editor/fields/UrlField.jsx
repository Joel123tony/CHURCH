export default function UrlField({ value, onChange, placeholder = "Enter URL" }) {
  return (
    <input
      type="url"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border px-4 py-2"
    />
  );
}