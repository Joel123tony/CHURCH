import { useLocation } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();
  const { pathname } = useLocation();
  const isLibraryPage = /^\/(bible|songs|books)(\/|$)/.test(pathname);

  return (
    <footer className={isLibraryPage ? "py-8 bg-[#F4EFE7] text-[#54091b]" : "py-8 bg-[#54091b] text-[#F4EFE7]"}>
      <div className="max-w-7xl mx-auto px-6 text-center text-base">
        {t("© 2026 Methodist Tamil Church Padikuppam. All Rights Reserved.")}
      </div>
    </footer>
  );
}
