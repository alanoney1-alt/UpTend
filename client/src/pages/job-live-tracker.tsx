import { useState, useEffect, useRef, useMemo } from "react";
import { useParams } from "wouter";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "@/lib/leaflet-fix";
import { MessageCircle, Star, Navigation, MapPin, Clock } from "lucide-react";

// --- Types ---
type JobStatus = "matched" | "en_route" | "arrived" | "in_progress" | "complete";

interface ProInfo {
  firstName: string;
  initials: string;
  avatarColor: string;
  rating: number;
  vehicle: string;
}

interface MockJob {
  id: string;
  status: JobStatus;
  address: string;
  customerLocation: [number, number];
  proStartLocation: [number, number];
  pro: ProInfo;
}

// --- Constants ---
const STATUSES: { key: JobStatus; label: string }[] = [
  { key: "matched", label: "Matched" },
  { key: "en_route", label: "En Route" },
  { key: "arrived", label: "Arrived" },
  { key: "in_progress", label: "In Progress" },
  { key: "complete", label: "Complete" },
];

const MOCK_JOB: MockJob = {
  id: "demo-001",
  status: "en_route",
  address: "9012 Dowden Rd, Orlando, FL 32827",
  customerLocation: [28.4195, -81.2419],
  proStartLocation: [28.4450, -81.2700],
  pro: {
    firstName: "Marcus",
    initials: "MJ",
    avatarColor: "#6366f1",
    rating: 4.9,
    vehicle: "White Ford F-150 · Tag: HLP 4821",
  },
};

// --- SVG Icons ---
function makeProIcon() {
  const svg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40">
      <circle cx="20" cy="20" r="18" fill="#6366f1" stroke="#fff" stroke-width="3"/>
      <circle cx="20" cy="20" r="6" fill="#fff"/>
    </svg>`
  );
  return new L.Icon({
    iconUrl: `data:image/svg+xml,${svg}`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });
}

function makeDestIcon() {
  const svg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 42" width="30" height="42">
      <path d="M15 0C6.7 0 0 6.7 0 15c0 2.9.8 5.5 2.3 7.8L15 42l12.7-19.2C29.2 20.5 30 17.9 30 15 30 6.7 23.3 0 15 0z" fill="#10b981"/>
      <circle cx="15" cy="15" r="6" fill="#fff"/>
    </svg>`
  );
  return new L.Icon({
    iconUrl: `data:image/svg+xml,${svg}`,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -42],
  });
}

const proIcon = makeProIcon();
const destIcon = makeDestIcon();

// --- Map auto-pan ---
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    map.panTo(center, { animate: true, duration: 0.5 });
  }, [center, map]);
  return null;
}

// --- Helpers ---
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function formatEta(seconds: number) {
  if (seconds <= 0) return "Arriving";
  const m = Math.ceil(seconds / 60);
  return `${m} min`;
}

// --- Component ---
export default function JobLiveTracker() {
  const params = useParams<{ jobId: string }>();
  const jobId = params.jobId || MOCK_JOB.id;

  const [progress, setProgress] = useState(0); // 0..1 along route
  const [status, setStatus] = useState<JobStatus>("en_route");
  const totalDuration = 120; // seconds for full simulation
  const [etaSeconds, setEtaSeconds] = useState(totalDuration);

  // Simulate pro movement
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        const next = Math.min(p + 1 / totalDuration, 1);
        setEtaSeconds(Math.max(0, Math.round((1 - next) * totalDuration)));
        // Update status based on progress
        if (next >= 1) setStatus("arrived");
        else if (next >= 0.85) setStatus("en_route");
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Advance status after arrival
  useEffect(() => {
    if (status !== "arrived") return;
    const t1 = setTimeout(() => setStatus("in_progress"), 5000);
    const t2 = setTimeout(() => setStatus("complete"), 15000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [status]);

  const proPosition: [number, number] = useMemo(
    () => [
      lerp(MOCK_JOB.proStartLocation[0], MOCK_JOB.customerLocation[0], progress),
      lerp(MOCK_JOB.proStartLocation[1], MOCK_JOB.customerLocation[1], progress),
    ],
    [progress]
  );

  const mapCenter: [number, number] = useMemo(
    () => [
      (proPosition[0] + MOCK_JOB.customerLocation[0]) / 2,
      (proPosition[1] + MOCK_JOB.customerLocation[1]) / 2,
    ],
    [proPosition]
  );

  const statusIdx = STATUSES.findIndex((s) => s.key === status);

  const openGeorge = () => {
    window.dispatchEvent(new CustomEvent("george:open"));
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950 text-white">
      {/* Status stepper */}
      <div className="shrink-0 px-4 pt-4 pb-3 bg-zinc-950/90 backdrop-blur-sm border-b border-zinc-800">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          {STATUSES.map((s, i) => (
            <div key={s.key} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={`w-3 h-3 rounded-full transition-all duration-500 ${
                    i <= statusIdx
                      ? "bg-emerald-500 scale-110"
                      : "bg-zinc-700"
                  }`}
                />
                <span
                  className={`text-[10px] mt-1 whitespace-nowrap transition-colors duration-500 ${
                    i <= statusIdx ? "text-emerald-400 font-medium" : "text-zinc-500"
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {i < STATUSES.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-1 mt-[-10px] transition-colors duration-500 ${
                    i < statusIdx ? "bg-emerald-500" : "bg-zinc-700"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer
          center={mapCenter}
          zoom={14}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
          />
          <MapUpdater center={mapCenter} />
          <Marker position={proPosition} icon={proIcon}>
            <Popup>{MOCK_JOB.pro.firstName} is on the way</Popup>
          </Marker>
          <Marker position={MOCK_JOB.customerLocation} icon={destIcon}>
            <Popup>{MOCK_JOB.address}</Popup>
          </Marker>
        </MapContainer>

        {/* ETA pill overlay */}
        {status === "en_route" && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-zinc-900/90 backdrop-blur-md border border-zinc-700 rounded-full px-5 py-2 flex items-center gap-2 shadow-2xl">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span className="text-lg font-semibold tracking-tight">{formatEta(etaSeconds)}</span>
          </div>
        )}
        {status === "arrived" && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-emerald-600/90 backdrop-blur-md rounded-full px-5 py-2 shadow-2xl">
            <span className="text-sm font-semibold">Your pro has arrived</span>
          </div>
        )}
      </div>

      {/* Bottom card */}
      <div className="shrink-0 bg-zinc-900 border-t border-zinc-800 px-4 pt-4 pb-6 safe-area-bottom">
        <div className="max-w-lg mx-auto space-y-3">
          {/* Pro info row */}
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0"
              style={{ backgroundColor: MOCK_JOB.pro.avatarColor }}
            >
              {MOCK_JOB.pro.initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-base">{MOCK_JOB.pro.firstName}</span>
                <span className="flex items-center gap-0.5 text-sm text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  {MOCK_JOB.pro.rating}
                </span>
              </div>
              <p className="text-xs text-zinc-400 truncate">{MOCK_JOB.pro.vehicle}</p>
            </div>
            {/* Contact button */}
            <button
              onClick={openGeorge}
              className="shrink-0 w-10 h-10 rounded-full bg-emerald-600 hover:bg-emerald-500 transition-colors flex items-center justify-center"
            >
              <MessageCircle className="w-5 h-5" />
            </button>
          </div>

          {/* Address */}
          <div className="flex items-start gap-2 text-sm text-zinc-400">
            <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-emerald-500" />
            <span>{MOCK_JOB.address}</span>
          </div>

          {/* Contact Pro button */}
          <button
            onClick={openGeorge}
            className="w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            Contact Pro
          </button>
        </div>
      </div>
    </div>
  );
}
