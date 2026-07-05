import { useLanguage } from "../context/LanguageContext";

export default function Footer() {
  const { t, cmsData } = useLanguage();
  const styles = cmsData?.footer?.styles || {};

  return (
    <footer className="py-8" style={{ backgroundColor: styles.backgroundColor || "#54091b", color: styles.bodyTextColor || "#F4EFE7" }}>
      <div className={`max-w-7xl mx-auto px-6 text-center ${styles.bodyFontSize || "text-base"}`}>
        {t("© 2026 Methodist Tamil Church Padikuppam. All Rights Reserved.")}
        {cmsData?.footer?.footerText && (
          <div className="mt-2 text-sm opacity-80">
            {t(cmsData.footer.footerText)}
          </div>
        )}
      </div>
    </footer>
  );
}
