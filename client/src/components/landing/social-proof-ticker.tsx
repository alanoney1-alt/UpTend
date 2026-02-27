export function SocialProofTicker() {
  const items = [
    "Now accepting the first 100 customers and pros in Orlando",
    "Serving Lake Nona, Winter Park, Dr. Phillips, Windermere, and 8 more neighborhoods",
    "11 service categories available",
    "All pros background-checked and insured",
    "Founding Member spots filling up",
    "Home Intelligence, powered by George",
  ];
  const all = [...items, ...items];

  return (
    <div className="w-full overflow-hidden bg-muted/40 border-y border-border py-2 group">
      <div className="marquee-track group-hover:[animation-play-state:paused]">
        {all.map((text, i) => (
          <span
            key={i}
            className="inline-block px-6 text-xs text-muted-foreground whitespace-nowrap"
          >
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}
