import { useState } from "react";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const YT_REGEX = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/;

export function extractYouTubeVideoId(url: string): string | null {
  const match = url.match(YT_REGEX);
  return match ? match[1] : null;
}

/** Return all YouTube video IDs found in a block of text */
export function extractAllVideoIds(text: string): string[] {
  const globalRe = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/g;
  const ids: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = globalRe.exec(text)) !== null) {
    if (!ids.includes(m[1])) ids.push(m[1]);
  }
  return ids;
}

// ─── Component ───────────────────────────────────────────────────────────────

interface VideoPlayerProps {
  videoId: string;
  title?: string;
}

export function VideoPlayer({ videoId, title }: VideoPlayerProps) {
  const [loaded, setLoaded] = useState(false);

  if (!videoId) return null;

  const thumbUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`;

  // Click-to-load: show thumbnail first, load iframe on click (lighter & faster)
  if (!loaded) {
    return (
      <button
        type="button"
        onClick={() => setLoaded(true)}
        className="relative w-full aspect-video rounded-xl overflow-hidden group my-2 block border-0 p-0 cursor-pointer bg-black"
        aria-label={title ? `Play: ${title}` : "Play video"}
      >
        <img
          src={thumbUrl}
          alt={title || "Video thumbnail"}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
          <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <svg viewBox="0 0 24 24" className="w-7 h-7 text-white fill-current ml-0.5" aria-hidden>
              <polygon points="5,3 19,12 5,21" />
            </svg>
          </div>
        </div>
        {title && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2">
            <p className="text-white text-xs font-medium truncate">{title}</p>
          </div>
        )}
      </button>
    );
  }

  return (
    <div className="relative w-full aspect-video rounded-xl overflow-hidden my-2">
      <iframe
        src={embedUrl}
        title={title || "YouTube video"}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 w-full h-full border-0"
      />
    </div>
  );
}
