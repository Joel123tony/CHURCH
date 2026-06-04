import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { SectionRenderer, type SectionData } from "../components/SectionRenderer";

type Props = {
  variant: "page" | "pastor-detail" | "sermon-detail";
};

type PageData = {
  title: string;
  description: string;
  sections: SectionData[];
};

type PastorDetail = {
  pastor: {
    slug: string;
    name: string;
    position: string;
    biography?: string;
    startYear?: number;
    endYear?: number;
    mainPhoto?: string;
    currentPastor?: boolean;
  };
  sermons: Array<{
    slug: string;
    title: string;
    description?: string;
    publishDate?: string;
    videoUrl?: string;
  }>;
};

type SermonDetail = {
  slug: string;
  title: string;
  description?: string;
  speaker?: string;
  publishDate?: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  duration?: string;
};

const pages: Record<string, PageData> = {
  about: {
    title: "About Our Church",
    description: "Methodist Tamil Church is a Christ-centered congregation in Padikuppam, Mogappair East, Chennai.",
    sections: [
      {
        id: "about-hero",
        title: "Rooted in Faith",
        subtitle: "About",
        description: "We are committed to worship, prayer, discipleship, fellowship, and outreach."
      }
    ]
  },
  mission: {
    title: "Mission",
    description: "To glorify God through worship, proclaim the Gospel of Jesus Christ, make disciples, strengthen believers, and serve the community with compassion and love.",
    sections: [
      {
        id: "mission-hero",
        title: "Why we exist",
        subtitle: "Mission",
        description: "To glorify God through worship, proclaim the Gospel of Jesus Christ, make disciples, strengthen believers, and serve the community with compassion and love."
      }
    ]
  },
  vision: {
    title: "Vision",
    description: "To be a vibrant Christ-centered church that transforms lives through worship, prayer, discipleship, fellowship, and community outreach.",
    sections: [
      {
        id: "vision-hero",
        title: "What we are building",
        subtitle: "Vision",
        description: "Helping people grow in their relationship with Jesus Christ."
      }
    ]
  },
  ministries: {
    title: "Ministries",
    description: "Worship Services, Prayer Meetings, Bible Study, Youth Fellowship, Men's Fellowship, Women's Fellowship, Family Ministry, Community Outreach, and Special Church Events.",
    sections: [
      {
        id: "ministries-hero",
        title: "Serve together",
        subtitle: "Ministries",
        description: "Volunteer, disciple, pray, and reach out together as one church family."
      }
    ]
  },
  events: {
    title: "Events",
    description: "Sunday worship, prayer meetings, Bible study, youth fellowship, family ministry, and special church events.",
    sections: [
      {
        id: "events-hero",
        title: "Upcoming gatherings",
        subtitle: "Events",
        description: "Join us for weekly worship and special ministry moments."
      }
    ]
  },
  gallery: {
    title: "Gallery",
    description: "Photos and videos from worship, outreach, and community life.",
    sections: [
      {
        id: "gallery-hero",
        title: "Moments from church life",
        subtitle: "Gallery",
        description: "Browse visual highlights from worship and ministry."
      }
    ]
  },
  pastors: {
    title: "Pastors",
    description: "Meet the shepherds who lead and care for the church.",
    sections: [
      {
        id: "pastors-hero",
        title: "Leadership and care",
        subtitle: "Pastors",
        description: "Profiles of the leaders serving the Methodist Tamil Church community."
      }
    ]
  },
  contact: {
    title: "Contact",
    description: "Get in touch with Methodist Tamil Church in Padikuppam.",
    sections: [
      {
        id: "contact-hero",
        title: "Connect with us",
        subtitle: "Contact",
        description: "Address, location, languages, and social links are easy to find on the homepage."
      }
    ]
  },
  sermons: {
    title: "Sermons",
    description: "Recent sermons, featured sermons, and live archive content.",
    sections: [
      {
        id: "sermons-hero",
        title: "Word and worship",
        subtitle: "Sermons",
        description: "Watch sermons and revisit teaching anytime."
      }
    ]
  }
};

export function PageView({ variant }: Props) {
  const params = useParams();
  const slug = params.slug ?? "";

  const pastorQuery = useQuery({
    queryKey: ["public", "pastor-detail", slug],
    queryFn: () => apiFetch<PastorDetail>(`/api/public/pastors/${slug}`),
    enabled: variant === "pastor-detail" && Boolean(slug)
  });

  const sermonQuery = useQuery({
    queryKey: ["public", "sermon-detail", slug],
    queryFn: () => apiFetch<SermonDetail>(`/api/public/sermons/${slug}`),
    enabled: variant === "sermon-detail" && Boolean(slug)
  });

  if (variant === "pastor-detail") {
    const pastor = pastorQuery.data?.pastor;
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        {pastor ? (
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5">
              {pastor.mainPhoto ? <img src={pastor.mainPhoto} alt={pastor.name} className="h-full w-full object-cover" /> : <div className="grid h-96 place-items-center text-white/40">No image</div>}
            </div>
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <p className="text-sm uppercase tracking-[0.35em] text-gold/80">Pastor Profile</p>
              <h1 className="mt-4 text-4xl font-semibold text-pearl">{pastor.name}</h1>
              <p className="mt-2 text-lg text-white/70">{pastor.position}</p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs text-gold/90">
                {pastor.currentPastor ? <span className="rounded-full border border-gold/30 px-3 py-1">Current Pastor</span> : null}
                {pastor.startYear ? <span className="rounded-full border border-white/10 px-3 py-1">Since {pastor.startYear}</span> : null}
                {pastor.endYear ? <span className="rounded-full border border-white/10 px-3 py-1">Until {pastor.endYear}</span> : null}
              </div>
              {pastor.biography ? <p className="mt-6 text-sm leading-7 text-mist/80">{pastor.biography}</p> : null}
            </div>
          </div>
        ) : (
          <p className="text-sm text-white/60">Pastor not found.</p>
        )}

        <div className="mt-10 rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <p className="text-sm uppercase tracking-[0.35em] text-gold/80">Related Sermons</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {(pastorQuery.data?.sermons ?? []).map((sermon) => (
              <a key={sermon.slug} href={`/sermons/${sermon.slug}`} className="rounded-3xl border border-white/10 bg-black/20 p-5 transition hover:border-gold/40">
                <h2 className="text-lg font-semibold text-pearl">{sermon.title}</h2>
                {sermon.description ? <p className="mt-2 text-sm text-white/65">{sermon.description}</p> : null}
              </a>
            ))}
            {!pastorQuery.data?.sermons?.length ? <p className="text-sm text-white/50">No related sermons found.</p> : null}
          </div>
        </div>
      </div>
    );
  }

  if (variant === "sermon-detail") {
    const sermon = sermonQuery.data;
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 md:px-8">
        {sermon ? (
          <article className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-xl">
            {sermon.thumbnailUrl ? <img src={sermon.thumbnailUrl} alt={sermon.title} className="h-80 w-full object-cover" /> : null}
            <div className="p-6 md:p-8">
              <p className="text-sm uppercase tracking-[0.35em] text-gold/80">Sermon Detail</p>
              <h1 className="mt-4 text-4xl font-semibold text-pearl">{sermon.title}</h1>
              {sermon.speaker ? <p className="mt-2 text-lg text-white/70">{sermon.speaker}</p> : null}
              {sermon.description ? <p className="mt-6 text-sm leading-7 text-mist/80">{sermon.description}</p> : null}
              <div className="mt-6 flex flex-wrap gap-2 text-xs text-gold/90">
                {sermon.publishDate ? <span className="rounded-full border border-white/10 px-3 py-1">{new Date(sermon.publishDate).toLocaleDateString()}</span> : null}
                {sermon.duration ? <span className="rounded-full border border-white/10 px-3 py-1">{sermon.duration}</span> : null}
              </div>
              {sermon.videoUrl ? (
                <a
                  href={sermon.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-8 inline-flex rounded-full bg-gold px-5 py-3 text-sm font-semibold text-ink"
                >
                  Watch video
                </a>
              ) : null}
            </div>
          </article>
        ) : (
          <p className="text-sm text-white/60">Sermon not found.</p>
        )}
      </div>
    );
  }

  const page = pages[slug] ?? {
    title: "Church Page",
    description: "This page is populated from the church content system.",
    sections: [
      {
        id: slug || "page",
        title: "Content page",
        subtitle: "Page",
        description: "Use the admin panel to edit this page content."
      }
    ]
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 md:px-8">
      <div className="max-w-3xl">
        <p className="text-sm uppercase tracking-[0.3em] text-gold/80">/{slug || "page"}</p>
        <h1 className="mt-4 text-4xl font-semibold text-pearl md:text-6xl">{page.title}</h1>
        <p className="mt-4 text-base leading-7 text-mist/80">{page.description}</p>
      </div>
      <div className="mt-10">
        {page.sections.map((section) => (
          <SectionRenderer key={section.id} section={section} />
        ))}
      </div>
    </div>
  );
}
