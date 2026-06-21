import { createContext, useContext, useEffect, useMemo, useState } from "react";

const LanguageContext = createContext(null);

const translations = {
  en: {
    nav: {
      home: "Home",
      history: "History",
      events: "Events",
      gallery: "Gallery",
      pastor: "Pastor",
      contact: "Contact",
    },
    page: {
      title: "Methodist Tamil Church",
    },
    hero: {
      heading: "MTC Padikuppam",
      description:
        "MTC Padikuppam (Methodist Tamil Church) serves the local community through Christ-centered worship, prayer, and sound biblical teaching. We are committed to making disciples through spiritual growth, meaningful fellowship, and regular Bible study. Our church actively reaches out to the community through various outreach ministries, sharing God's love in practical ways and supporting those in need. Together, we seek to grow in faith, build strong families, and live as faithful followers of Christ, rooted in grace and truth.",
      loading: "Loading...",
      noVideo: "No Video Available",
      latestSermon: "Latest Sermon",
      noVideoShort: "No Video",
      watchYoutube: "Watch Video on YouTube",
      watchOnYoutube: "Watch on YouTube",
    },
    history: {
      title: "Church History",
      paragraph1:
        "From 1975 to 1983, the ministry led by Rev. Y. Moses Selvaraj played a significant role in the remarkable growth and development of the church. Under his dedicated leadership, the church expanded both in strength and in spiritual vision, with ministries growing steadily and purposefully.",
      paragraph2:
        "During this period, the ministry at Padikuppam was initiated, marking an important step in the church's mission outreach. The vision was to extend God's work beyond the local congregation, establishing a strong presence across major districts and surrounding regions.",
      paragraph3:
        "This foundation helped the church grow in faith, unity, and outreach, shaping its mission for future generations.",
      alt: "Methodist Tamil Church",
    },
    events: {
      title: "Events",
      featured: "Featured Event",
      latest: "Latest Event",
      upcoming: "Upcoming Events",
      date: "Date",
      time: "Time",
      venue: "Venue",
      loading: "Loading Events...",
      noLatest: "No latest event available.",
      noUpcoming: "No upcoming events available.",
    },
    gallery: {
      title: "Gallery",
      allMedia: "All Media",
      search: "Search...",
      close: "Close",
      loading: "Loading gallery...",
      closeViewer: "Close",
    },
    clientGallery: {
      latest: "Latest Gallery",
      viewAll: "View All Gallery",
    },
    pastor: {
      title: "Pastor",
      loading: "Loading...",
      currentPastor: "Current Pastor",
      name: "Name",
      role: "Role",
      yearsOfService: "Years of Service",
      bio: "Bio",
      noBio: "No details available",
      noCurrent: "No Current Pastor Selected",
      searchTitle: "Search Pastors",
      searchByName: "Search By Name",
      searchByYear: "Search By Year",
      search: "Search",
      results: "Search Results",
      noPastorFound: "No Pastor Found",
      currentLabel: "Current Pastor",
      present: "Present",
      year: "Year",
      years: "Years",
    },
    youtube: {
      title: "YouTube",
      loading: "Loading videos...",
      noVideos: "No videos found",
    },
    contact: {
      title: "Contact Us",
      description:
        "We'd love to hear from you. Reach out for worship, fellowship, prayer requests, or any questions.",
      visitUs: "Visit Us",
      directions: "Get Directions",
      emailUs: "Email Us",
      sendEmail: "Send Email",
      prayerRequest: "Prayer Request",
      prayerQuote:
        "Call to me and I will answer you and tell you great and unsearchable things you do not know.",
      prayerReference: "Jeremiah 33:3",
      connect: "Connect With Us",
      submitRequest: "Submit Request",
    },
    prayerModal: {
      success: "Prayer Request Submitted Successfully",
      name: "Name",
      phone: "Phone Number (Optional)",
      request: "Prayer Request",
      submitting: "Submitting...",
      close: "Close",
    },
    footer: {
      copyright: "© 2026 Methodist Tamil Church Padikuppam. All Rights Reserved.",
    },
  },
  ta: {
    nav: {
      home: "முகப்பு",
      history: "வரலாறு",
      events: "நிகழ்வுகள்",
      gallery: "காட்சியகம்",
      pastor: "பாஸ்டர்",
      contact: "தொடர்பு",
    },
    page: {
      title: "பரிசுத்த ஜீவியம் , சுவிசேஷ ஊழியம்",
    },
    hero: {
      heading: "எம்டிசி படிக்குப்பம்",
      description:
        "எம்டிசி படிக்குப்பம் (Methodist Tamil Church) கிறிஸ்து மையமான ஆராதனை, ஜெபம் மற்றும் திடமான வேதாகம போதனையின் மூலம் உள்ளூர் சமூகத்திற்கு சேவை செய்கிறது. ஆவிக்குரிய வளர்ச்சி, அர்த்தமுள்ள உடன்பிறப்பு, மற்றும் வழக்கமான வேதபாடத்தின் மூலம் சீடர்களை உருவாக்குவதற்கு நாங்கள் உறுதிபூண்டுள்ளோம். எங்கள் திருச்சபை பல்வேறு சேவை ஊழியங்களின் மூலம் சமூகத்தை அடைந்து, தேவனின் அன்பை செயல்முறை வழிகளில் பகிர்ந்து, தேவையுள்ளவர்களை ஆதரிக்கிறது. ஒன்றாக, விசுவாசத்தில் வளரவும், வலுவான குடும்பங்களை அமைக்கவும், கிருபையும் சத்தியமும் நிரம்பிய கிறிஸ்துவின் உண்மையான பின்பற்றிகளாக வாழவும் நாம் முயல்கிறோம்.",
      loading: "ஏற்றுகிறது...",
      noVideo: "வீடியோ இல்லை",
      latestSermon: "சமீபத்திய செய்தி",
      noVideoShort: "வீடியோ இல்லை",
      watchYoutube: "யூடியூப்பில் வீடியோ பார்க்க",
      watchOnYoutube: "யூடியூப்பில் பார்க்க",
    },
    history: {
      title: "திருச்சபை வரலாறு",
      paragraph1:
        "1975 முதல் 1983 வரை, ரெவ். Y. மோசஸ் செல்வராஜ் அவர்களின் தலைமையில் நடந்த ஊழியம் திருச்சபையின் குறிப்பிடத்தக்க வளர்ச்சி மற்றும் முன்னேற்றத்தில் முக்கிய பங்காற்றியது. அவருடைய அர்ப்பணிப்பான வழிநடத்தலில், திருச்சபை ஆவிக்குறிய பார்வையிலும் வலிமையிலும் விரிவடைந்து, ஊழியங்கள் தொடர்ந்து திட்டமிட்ட முறையில் வளர்ந்தன.",
      paragraph2:
        "இந்த காலத்தில் படிக்குப்பத்தில் ஊழியம் தொடங்கப்பட்டது, இது திருச்சபையின் பணிவிருத்தி சேவையில் ஒரு முக்கியமான படியாக இருந்தது. உள்ளூர் சபையைத் தாண்டி தேவனுடைய செயலை விரிவுபடுத்தும் நோக்குடன், முக்கிய மாவட்டங்களிலும் சுற்றியுள்ள பகுதிகளிலும் வலுவான சாட்சியை நிலைநிறுத்துவதே அந்தக் காட்சி.",
      paragraph3:
        "இந்த அடித்தளம் திருச்சபை விசுவாசத்திலும், ஒருமைப்பாட்டிலும், வெளிச்சேவையிலும் வளர உதவியது; எதிர்கால தலைமுறைகளுக்கான அதன் பணியை வடிவமைத்தது.",
      alt: "மெதடிஸ்ட் தமிழ் திருச்சபை",
    },
    events: {
      title: "நிகழ்வுகள்",
      featured: "முக்கிய நிகழ்வு",
      latest: "சமீபத்திய நிகழ்வு",
      upcoming: "வரவிருக்கும் நிகழ்வுகள்",
      date: "தேதி",
      time: "நேரம்",
      venue: "இடம்",
      loading: "நிகழ்வுகள் ஏற்றப்படுகிறது...",
      noLatest: "சமீபத்திய நிகழ்வு இல்லை.",
      noUpcoming: "வரவிருக்கும் நிகழ்வுகள் இல்லை.",
    },
    gallery: {
      title: "காட்சியகம்",
      allMedia: "அனைத்து ஊடகங்கள்",
      search: "தேடு...",
      close: "மூடு",
      loading: "காட்சியகம் ஏற்றப்படுகிறது...",
      closeViewer: "மூடு",
    },
    clientGallery: {
      latest: "சமீபத்திய காட்சிகள்",
      viewAll: "அனைத்து காட்சிகளையும் பார்க்க",
    },
    pastor: {
      title: "பாஸ்டர்",
      loading: "ஏற்றுகிறது...",
      currentPastor: "தற்போதைய பாஸ்டர்",
      name: "பெயர்",
      role: "பங்கு",
      yearsOfService: "சேவை ஆண்டுகள்",
      bio: "விவரம்",
      noBio: "விவரங்கள் கிடைக்கவில்லை",
      noCurrent: "தற்போதைய பாஸ்டர் தேர்வு செய்யப்படவில்லை",
      searchTitle: "பாஸ்டர்களைத் தேடவும்",
      searchByName: "பெயரால் தேடவும்",
      searchByYear: "ஆண்டினால் தேடவும்",
      search: "தேடு",
      results: "தேடல் முடிவுகள்",
      noPastorFound: "பாஸ்டர் கிடைக்கவில்லை",
      currentLabel: "தற்போதைய பாஸ்டர்",
      present: "தற்போது",
      year: "ஆண்டு",
      years: "ஆண்டுகள்",
    },
    youtube: {
      title: "யூடியூப்",
      loading: "வீடியோக்கள் ஏற்றப்படுகிறது...",
      noVideos: "வீடியோக்கள் கிடைக்கவில்லை",
    },
    contact: {
      title: "தொடர்பு கொள்ளுங்கள்",
      description:
        "உங்களிடம் இருந்து கேட்க நாங்கள் மகிழ்ச்சியடைகிறோம். ஆராதனை, உடன்பிறப்பு, ஜெப வேண்டுதல்கள் அல்லது ஏதேனும் கேள்விகளுக்காக எங்களை அணுகுங்கள்.",
      visitUs: "எங்களை சந்திக்கவும்",
      address:"எண்.1 வண்டியம்மன் கோயில் தெரு,மொகப்பையர் கிழக்கு,சென்னை - 600107",
      directions: "வழிகாட்டுதலைப் பெறுங்கள்",
      emailUs: "மின்னஞ்சல் அனுப்புங்கள்",
      sendEmail: "மின்னஞ்சல் அனுப்பு",
      prayerRequest: "ஜெப வேண்டுகோள்",
      prayerQuote:
        "என்னை நோக்கிக் கூப்பிடு, அப்பொழுது நான் உனக்கு உத்தரவு கொடுத்து, நீ அறியாததும் உனக்கு எட்டாததுமான பெரிய காரியங்களை உனக்கு அறிவிப்பேன்.",
      prayerReference: "எரேமியா 33:3",
      connect: "எங்களுடன் இணைக",
      submitRequest: "வேண்டுகோளை சமர்ப்பிக்கவும்",
    },
    prayerModal: {
      success: "ஜெப வேண்டுகோள் வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது",
      name: "பெயர்",
      phone: "தொலைபேசி எண் (விருப்பம்)",
      request: "ஜெப வேண்டுகோள்",
      submitting: "சமர்ப்பிக்கப்படுகிறது...",
      close: "மூடு",
    },
    footer: {
      copyright: "© 2026 மெதடிஸ்ட் தமிழ் திருச்சபை படிக்குப்பம். அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.",
    },
  },
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    if (typeof window === "undefined") return "en";

    const saved = window.localStorage.getItem("site-language");
    return saved === "ta" ? "ta" : "en";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.localStorage.setItem("site-language", language);
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo(() => {
    const t = (key) => {
      const parts = key.split(".");
      let current = translations[language];

      for (const part of parts) {
        current = current?.[part];
        if (current === undefined) break;
      }

      if (current !== undefined) return current;

      current = translations.en;
      for (const part of parts) {
        current = current?.[part];
        if (current === undefined) break;
      }

      return current ?? key;
    };

    return {
      language,
      setLanguage,
      toggleLanguage: () =>
        setLanguage((current) => (current === "en" ? "ta" : "en")),
      t,
    };
  }, [language]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }

  return context;
}


