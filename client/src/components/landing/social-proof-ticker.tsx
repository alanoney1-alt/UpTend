const PROOF_ENTRIES = [
  { name: "Sarah", neighborhood: "Lake Nona", service: "gutter cleaning", time: "2 hours ago" },
  { name: "James", neighborhood: "Winter Park", service: "pressure washing", time: "3 hours ago" },
  { name: "Maria", neighborhood: "Dr. Phillips", service: "junk removal", time: "4 hours ago" },
  { name: "David", neighborhood: "Windermere", service: "pool cleaning", time: "5 hours ago" },
  { name: "Ashley", neighborhood: "Baldwin Park", service: "home cleaning", time: "6 hours ago" },
  { name: "Carlos", neighborhood: "Celebration", service: "landscaping", time: "7 hours ago" },
  { name: "Emily", neighborhood: "Avalon Park", service: "carpet cleaning", time: "8 hours ago" },
  { name: "Robert", neighborhood: "Horizon West", service: "handyman repair", time: "9 hours ago" },
  { name: "Jessica", neighborhood: "Lake Nona", service: "moving labor", time: "10 hours ago" },
  { name: "Michael", neighborhood: "Winter Park", service: "garage cleanout", time: "12 hours ago" },
];

export function SocialProofTicker() {
  const items = PROOF_ENTRIES.map(
    (e) => `${e.name} in ${e.neighborhood} booked ${e.service} | ${e.time}`
  );
  // Duplicate for seamless loop
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
