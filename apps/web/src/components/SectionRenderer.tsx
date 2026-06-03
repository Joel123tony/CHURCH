type Block =
  | { type: "text"; heading: string; content: string; bibleVerse?: string }
  | { type: "image"; title: string; description?: string; url: string }
  | { type: "video"; title: string; description?: string; url: string }
  | { type: "gallery"; items: Array<{ type: "image" | "video"; url: string; title?: string }> }
  | { type: "button"; label: string; link: string }
  | { type: "card"; icon?: string; title: string; description: string };

export type SectionData = {
  id: string;
  anchorId?: string;
  title: string;
  subtitle?: string;
  description?: string;
  richText?: string;
  backgroundImage?: string;
  backgroundVideo?: string;
  blocks?: Block[];
};

export function SectionRenderer({ section }: { section: SectionData }) {
  return (
    <section id={section.anchorId ?? section.id} className="mx-auto max-w-7xl px-4 py-16 md:px-8">
      <div className="mb-8 max-w-3xl">
        <p className="text-sm uppercase tracking-[0.3em] text-gold/80">{section.subtitle}</p>
        <h2 className="mt-3 text-3xl font-semibold text-pearl md:text-5xl">{section.title}</h2>
        {section.description ? <p className="mt-4 text-base leading-7 text-mist/80">{section.description}</p> : null}
      </div>
      {section.backgroundImage || section.backgroundVideo ? (
        <div className="mb-6 overflow-hidden rounded-[2rem] border border-white/10 bg-white/5">
          {section.backgroundImage ? (
            <img src={section.backgroundImage} alt={section.title} className="h-72 w-full object-cover md:h-96" />
          ) : (
            <video src={section.backgroundVideo} className="h-72 w-full object-cover md:h-96" controls muted />
          )}
        </div>
      ) : null}
      <div className="grid gap-6 md:grid-cols-2">
        {section.blocks?.map((block, index) => {
          if (block.type === "text") {
            return (
              <article key={index} className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <h3 className="text-xl font-semibold">{block.heading}</h3>
                <p className="mt-4 text-sm leading-7 text-mist/80">{block.content}</p>
                {block.bibleVerse ? <p className="mt-4 border-l-2 border-gold/60 pl-4 text-sm italic text-gold/90">{block.bibleVerse}</p> : null}
              </article>
            );
          }

          if (block.type === "image") {
            return (
              <article key={index} className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl">
                <img src={block.url} alt={block.title} className="h-64 w-full object-cover" />
                <div className="p-6">
                  <h3 className="text-lg font-semibold">{block.title}</h3>
                  {block.description ? <p className="mt-2 text-sm text-mist/70">{block.description}</p> : null}
                </div>
              </article>
            );
          }

          if (block.type === "video") {
            return (
              <article key={index} className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <h3 className="text-lg font-semibold">{block.title}</h3>
                {block.description ? <p className="mt-2 text-sm text-mist/70">{block.description}</p> : null}
                <a href={block.url} className="mt-4 inline-flex text-sm text-gold hover:underline" target="_blank" rel="noreferrer">
                  Watch video
                </a>
              </article>
            );
          }

          if (block.type === "button") {
            return (
              <a
                key={index}
                href={block.link}
                className="inline-flex items-center justify-center rounded-full border border-gold/40 bg-gold px-5 py-3 text-sm font-semibold text-ink transition hover:scale-[1.02]"
              >
                {block.label}
              </a>
            );
          }

          if (block.type === "gallery") {
            return (
              <article key={index} className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl md:col-span-2">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {block.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                      {item.type === "image" ? (
                        <img src={item.url} alt={item.title ?? "Gallery item"} className="h-56 w-full object-cover" />
                      ) : (
                        <div className="grid h-56 place-items-center bg-[linear-gradient(135deg,rgba(215,180,106,0.18),rgba(255,255,255,0.03))] text-sm text-mist/80">
                          Video preview
                        </div>
                      )}
                      {item.title ? <div className="p-4 text-sm text-mist/80">{item.title}</div> : null}
                    </div>
                  ))}
                </div>
              </article>
            );
          }

          return (
            <article key={index} className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <h3 className="text-lg font-semibold">{block.title}</h3>
              <p className="mt-2 text-sm text-mist/70">{block.description}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
