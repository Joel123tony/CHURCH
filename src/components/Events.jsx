import React, { useEffect, useState, memo } from "react";
import API from "../api/axios";
import { useLanguage } from "../context/LanguageContext";

import { FaFire, FaCalendarAlt, FaClock, FaMapMarkerAlt } from "react-icons/fa";
import { FadeUp, FadeLeft, FadeRight, StaggerContainer, StaggerItem } from "./animations/index.jsx";

const Events = memo(function Events({ initialEvents }) {
  const { t } = useLanguage();
  const [eventsData, setEventsData] = useState(() => initialEvents || { featuredEvent: null, upcomingEvents: [] });
  const [loading, setLoading] = useState(() => !initialEvents);

  const parseEventTimestamp = (event) => {
    const date = new Date(event?.date);
    if (Number.isNaN(date.getTime())) return Number.POSITIVE_INFINITY;

    const timeValue = `${event?.time || ""}`.trim().toLowerCase();
    let hours = 23;
    let minutes = 59;

    if (timeValue && timeValue !== "tba") {
      const match24 = timeValue.match(/^(\d{1,2}):(\d{2})$/);
      const match12 = timeValue.match(/^(\d{1,2}):(\d{2})\s*([ap]m)$/);

      if (match12) {
        hours = Number(match12[1]) % 12;
        if (match12[3] === "pm") hours += 12;
        minutes = Number(match12[2]);
      } else if (match24) {
        hours = Number(match24[1]);
        minutes = Number(match24[2]);
      }
    }

    date.setHours(hours, minutes, 0, 0);
    return date.getTime();
  };

  useEffect(() => {
    if (initialEvents) {
      setEventsData(initialEvents);
      setLoading(false);
    }
  }, [initialEvents]);

  const { featuredEvent: latestEvent, upcomingEvents } = eventsData;

  if (loading) {
    return (
      <section id="events" className="py-20 text-center bg-[#54091b] text-[#F4EFE7]">
        {t("Loading Events...")}
      </section>
    );
  }

  return (
    <section id="events" className="relative py-16 lg:py-24 overflow-hidden bg-[#54091b]">
      <div className="absolute top-0 left-0 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeUp>
          <div className="flex flex-col md:flex-row gap-3 justify-between items-start mb-8 lg:mb-12">
            <h2 className="text-left text-3xl md:text-4xl font-bold text-[#F4EFE7]">{t("Events")}</h2>
          </div>
        </FadeUp>

        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          <div className="lg:col-span-5 w-full min-w-0">
            <FadeLeft delay={100}>
              <div className="flex flex-col w-full">
                <div className="flex items-center gap-3 mb-5 sm:mb-6">
                  <FaFire className="text-2xl text-[#F4EFE7]" />
                  <h3 className="text-2xl font-bold text-[#F4EFE7]">{t("Featured Event")}</h3>
                </div>

                {latestEvent ? (
                  <div className="relative rounded-2xl sm:rounded-[32px] p-6 sm:p-8 shadow-2xl border border-white/10 transition-all duration-300 hover:shadow-3xl bg-[#f4efe7] group w-full">
                    <div className="flex items-start justify-between mb-5 sm:mb-6">
                      <div className="inline-flex px-3 py-1.5 sm:px-4 sm:py-1.5 rounded-full bg-[#54091b]/10 text-[#54091b] text-[10px] sm:text-xs font-bold uppercase tracking-widest">
                        {t("Featured Event")}
                      </div>
                    </div>
                    
                    <div className="flex gap-4 sm:gap-6 mb-5 sm:mb-6 items-start">
                      <div className="flex flex-col items-center justify-center bg-[#54091b] text-white rounded-xl w-16 h-16 sm:w-20 sm:h-20 shadow-lg flex-shrink-0">
                        <span className="text-2xl sm:text-3xl font-bold leading-tight">
                          {new Date(latestEvent.date).getDate().toString().padStart(2, '0')}
                        </span>
                        <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider">
                          {new Date(latestEvent.date).toLocaleString('en-US', { month: 'short' })}
                        </span>
                      </div>
                      <div className="flex-1 pt-0.5 sm:pt-1">
                        <h3 className="text-xl sm:text-2xl leading-snug font-bold text-[#54091b] mb-2 sm:mb-3">
                          {t(latestEvent.title)}
                        </h3>
                        <div className="flex items-center gap-2 text-[#374151] text-sm sm:text-base font-medium">
                          <FaClock className="text-[#54091b]/80 flex-shrink-0" />
                          <span>{latestEvent.time || "TBA"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 sm:pt-5 border-t border-[#54091b]/10 flex items-start gap-3 text-sm sm:text-base text-[#374151]">
                      <FaMapMarkerAlt className="text-[#54091b]/80 mt-0.5 sm:mt-1 flex-shrink-0 text-lg" />
                      <span className="leading-relaxed font-medium">{t(latestEvent.venue)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white/10 backdrop-blur rounded-3xl p-8 text-white w-full">
                    {t("No upcoming events available.")}
                  </div>
                )}
              </div>
            </FadeLeft>
          </div>

          <div className="lg:col-span-7 w-full min-w-0">
            <FadeRight delay={200}>
              <div className="flex flex-col w-full">
                <div className="flex items-center justify-between mb-5 sm:mb-6">
                  <div className="flex items-center gap-3">
                    <FaCalendarAlt className="text-2xl text-[#F4EFE7]" />
                    <h3 className="text-2xl font-bold text-[#F4EFE7]">{t("Upcoming Events")}</h3>
                  </div>

                  <span className="px-3 py-1 rounded-full bg-white/10 text-white text-sm font-medium">
                    {upcomingEvents.length}
                  </span>
                </div>

                <div className="max-h-[650px] overflow-y-auto pr-1 sm:pr-2 custom-scrollbar">
                  {upcomingEvents.length > 0 ? (
                    <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-2" staggerDelay={60}>
                      {upcomingEvents.map((event) => (
                        <StaggerItem key={event._id} animation="fade-up">
                          <div className="relative overflow-hidden rounded-2xl p-4 sm:p-5 shadow-lg border border-white/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl bg-[#f4efe7] flex gap-3 sm:gap-4 h-full group">
                            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-1.5 bg-[#54091b] opacity-80 group-hover:opacity-100 transition-opacity" />
                            
                            <div className="flex flex-col items-center justify-start min-w-[3rem] sm:min-w-[3.5rem] pt-0.5">
                              <span className="text-2xl sm:text-3xl font-bold text-[#54091b] leading-none mb-1">
                                {new Date(event.date).getDate().toString().padStart(2, '0')}
                              </span>
                              <span className="text-[10px] sm:text-xs font-bold text-[#54091b] uppercase tracking-wider">
                                {new Date(event.date).toLocaleString('en-US', { month: 'short' })}
                              </span>
                            </div>

                            <div className="flex-1 flex flex-col justify-center min-w-0">
                              <h4 className="text-[15px] sm:text-lg font-bold text-[#1E293B] leading-tight mb-2 sm:mb-2.5 line-clamp-2">
                                {t(event.title)}
                              </h4>
                              
                              <div className="space-y-1 sm:space-y-1.5 text-xs sm:text-[13px] text-[#475569] font-medium">
                                <div className="flex items-center gap-2">
                                  <FaClock className="text-[#54091b]/70 flex-shrink-0" />
                                  <span className="truncate">{event.time || "TBA"}</span>
                                </div>
                                <div className="flex items-start gap-2">
                                  <FaMapMarkerAlt className="text-[#54091b]/70 mt-0.5 flex-shrink-0" />
                                  <span className="line-clamp-2 leading-snug">{t(event.venue)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </StaggerItem>
                      ))}
                    </StaggerContainer>
                  ) : (
                    <div className="bg-white/10 backdrop-blur rounded-3xl p-8 text-white w-full">
                      {t("No upcoming events available.")}
                    </div>
                  )}
                </div>
              </div>
            </FadeRight>
          </div>
        </div>
      </div>
    </section>
  );
});

export default Events;
