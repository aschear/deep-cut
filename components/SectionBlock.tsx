interface SectionBlockProps {
  header: string;
  body: string;
}

export default function SectionBlock({ header, body }: SectionBlockProps) {
  // Split body into paragraphs on double newlines (Claude sometimes uses them)
  const paragraphs = body
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <section className="animate-[fade-in_0.6s_ease-out_forwards]">
      <h2 className="font-sans text-[0.65rem] font-semibold tracking-[0.22em] uppercase text-ember mb-3">
        {header}
      </h2>
      <div className="space-y-4">
        {paragraphs.map((p, i) => (
          <p key={i} className="font-body text-[0.975rem] leading-[1.75] text-cream/90">
            {p}
          </p>
        ))}
      </div>
    </section>
  );
}
