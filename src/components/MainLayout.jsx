import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Contact from "./Contact";
import Footer from "./Footer";
import { useEffect } from "react";

export default function MainLayout() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="flex flex-col min-h-screen bg-[#F4EFE7]">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Contact />
      <Footer />
    </div>
  );
}
