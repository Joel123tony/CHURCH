import { useLanguage } from "../context/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-cream text-primary py-8">
      <div className="max-w-7xl mx-auto px-6 text-center">
        {t("footer.copyright")}
      </div>
    </footer>
  );
}
