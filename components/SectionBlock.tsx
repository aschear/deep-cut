interface SectionBlockProps {
  header: string;
  body: string | null;
}

export default function SectionBlock({ header, body }: SectionBlockProps) {
  return (
    <section>
      <h2 className="font-sans text-[0.65rem] font-semibold tracking-[0.22em] uppercase text-ember mb-3">
        {header}
      </h2>

      {body === null ? (
        // Loading skeleton
        <div className="space-y-2 animate-[skeleton-pulse_1.4s_ease-in-out_infinite]">
          <div className="h-3 rounded-full bg-chalk-line w-full" />
          <div className="h-3 rounded-full bg-chalk-line w-[92%]" />
          <div className="h-3 rounded-full bg-chalk-line w-[96%]" />
          <div className="h-3 rounded-full bg-chalk-line w-[85%]" />
          <div className="h-3 rounded-full bg-chalk-line w-[90%]" />
        </div>
      ) : (
        <div className="space-y-4 animate-[fade-in_0.6s_ease-out_forwards]">
          {body
            .split(/\n\n+/)
            .map((p) => p.trim())
            .filter(Boolean)
            .map((p, i) => (
              <p key={i} className="font-body text-[0.975rem] leading-[1.75] text-cream/90">
                {p}
              </p>
            ))}
        </div>
      )}
    </section>
  );
}
