import { useLanguage } from "../context/LanguageContext";

export default function Footer() {
  const { t, cmsData } = useLanguage();
  const styles = cmsData?.footer?.styles || {};

  return (
    <footer className="py-8" style={{ backgroundColor: styles.backgroundColor || "#54091b", color: styles.textColor || "#F4EFE7" }}>
      <div className="max-w-7xl mx-auto px-6 text-center">
        {t("footer.copyright")}
        {t("footer.footerText") && t("footer.footerText") !== "footer.footerText" && (
          <div className="mt-2 text-sm opacity-80">
            {t("footer.footerText")}
          </div>
        )}
      </div>
    </footer>
  );
}
