import { useState, useRef, useCallback, useEffect } from "react";

interface Violation {
  id: string;
  address: string;
  violationType: string;
  severity: string;
  ccrSection: string;
  description: string;
  photoUrl?: string;
  status: "pending" | "approved" | "dismissed";
}

interface DetectionResult {
  id: string;
  address: string;
  violation_type: string;
  severity: string;
  ccr_section: string;
  description: string;
}

const COMMUNITIES = [
  { id: "lake-nona", name: "Lake Nona" },
  { id: "celebration", name: "Celebration" },
  { id: "windermere", name: "Windermere" },
  { id: "dr-phillips", name: "Dr. Phillips" },
  { id: "winter-park", name: "Winter Park" },
];

export default function HoaInspections() {
  const [community, setCommunity] = useState("");
  const [batchMode, setBatchMode] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [currentResult, setCurrentResult] = useState<Violation | null>(null);
  const [batchQueue, setBatchQueue] = useState<Violation[]>([]);
  const [recentInspections, setRecentInspections] = useState<Violation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [reviewingBatch, setReviewingBatch] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load recent inspections
  useEffect(() => {
    fetch("/api/violations/recent?limit=10")
      .then((r) => r.ok ? r.json() : [])
      .then(setRecentInspections)
      .catch(() => {});
  }, []);

  const getGPS = (): Promise<{ lat: number; lng: number } | null> =>
    new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handlePhoto = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      e.target.value = "";

      setError(null);
      setAnalyzing(true);
      setCurrentResult(null);

      try {
        const [gps, base64] = await Promise.all([getGPS(), toBase64(file)]);

        const res = await fetch("/api/violations/photo-detect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            photo: base64,
            lat: gps?.lat,
            lng: gps?.lng,
            communityId: community,
          }),
        });

        if (!res.ok) throw new Error("Detection failed");

        const data: DetectionResult = await res.json();
        const violation: Violation = {
          id: data.id,
          address: data.address,
          violationType: data.violation_type,
          severity: data.severity,
          ccrSection: data.ccr_section,
          description: data.description,
          photoUrl: base64,
          status: "pending",
        };

        if (batchMode) {
          setBatchQueue((q) => [...q, violation]);
          setCurrentResult(null);
        } else {
          setCurrentResult(violation);
        }
      } catch {
        setError("Failed to analyze photo. Please try again.");
      } finally {
        setAnalyzing(false);
      }
    },
    [community, batchMode]
  );

  const handleApprove = async (violation: Violation) => {
    try {
      await fetch(`/api/violations/${violation.id}/approve`, { method: "POST" });
      setCurrentResult(null);
      setRecentInspections((prev) => [{ ...violation, status: "approved" as const }, ...prev].slice(0, 10));
      setBatchQueue((q) => q.filter((v) => v.id !== violation.id));
    } catch {
      setError("Failed to send notice.");
    }
  };

  const handleDismiss = (violation: Violation) => {
    setCurrentResult(null);
    setBatchQueue((q) => q.filter((v) => v.id !== violation.id));
  };

  const severityColor = (s: string) => {
    switch (s.toLowerCase()) {
      case "high": return "text-red-400";
      case "medium": return "text-yellow-400";
      default: return "text-green-400";
    }
  };

  const ViolationCard = ({ v, showActions = true }: { v: Violation; showActions?: boolean }) => (
    <div className="bg-zinc-800 rounded-2xl p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-white font-semibold text-lg">{v.address}</p>
          <p className="text-zinc-400 text-sm">{v.violationType}</p>
        </div>
        <span className={`text-sm font-bold uppercase ${severityColor(v.severity)}`}>{v.severity}</span>
      </div>
      <div className="text-zinc-300 text-sm">
        <span className="text-zinc-500">CC&R §</span> {v.ccrSection}
      </div>
      <p className="text-zinc-300 text-sm leading-relaxed">{v.description}</p>
      {showActions && v.status === "pending" && (
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => handleApprove(v)}
            className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl active:scale-95 transition-transform"
          >
            Send Notice
          </button>
          <button
            onClick={() => handleDismiss(v)}
            className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white font-bold py-3 rounded-xl active:scale-95 transition-transform"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-white px-4 py-6 pb-24 max-w-lg mx-auto">
      {/* Header */}
      <h1 className="text-2xl font-bold mb-4">🏘️ Inspections</h1>

      {/* Community Selector */}
      <select
        value={community}
        onChange={(e) => setCommunity(e.target.value)}
        className="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 mb-4 text-lg border border-zinc-700 focus:border-primary focus:outline-none"
      >
        <option value="">Select Community</option>
        {COMMUNITIES.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      {/* Batch Mode Toggle */}
      <div className="flex items-center justify-between bg-zinc-800 rounded-xl px-4 py-3 mb-6">
        <span className="text-zinc-300">Batch Mode</span>
        <button
          onClick={() => { setBatchMode(!batchMode); setReviewingBatch(false); }}
          className={`w-12 h-7 rounded-full transition-colors relative ${batchMode ? "bg-primary" : "bg-zinc-600"}`}
        >
          <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full transition-transform ${batchMode ? "translate-x-5.5 left-0" : "left-0.5"}`} style={batchMode ? { transform: "translateX(22px)" } : {}} />
        </button>
      </div>

      {/* Camera Button */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handlePhoto}
      />
      <button
        disabled={!community || analyzing}
        onClick={() => fileInputRef.current?.click()}
        className="w-full bg-primary hover:bg-primary/90 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-bold text-xl py-8 rounded-2xl mb-6 active:scale-95 transition-transform flex flex-col items-center gap-2"
      >
        {analyzing ? (
          <>
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-white/30 border-t-white" />
            <span>Analyzing...</span>
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Capture Violation</span>
          </>
        )}
      </button>

      {!community && <p className="text-zinc-500 text-center text-sm -mt-4 mb-4">Select a community first</p>}

      {/* Error */}
      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-300 rounded-xl p-3 mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Current Result (non-batch) */}
      {currentResult && !batchMode && <ViolationCard v={currentResult} />}

      {/* Batch Queue */}
      {batchMode && batchQueue.length > 0 && (
        <div className="space-y-3 mb-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-zinc-300">
              Queued ({batchQueue.length})
            </h2>
            <button
              onClick={() => setReviewingBatch(!reviewingBatch)}
              className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold active:scale-95 transition-transform"
            >
              {reviewingBatch ? "Done" : "Review All"}
            </button>
          </div>
          {batchQueue.map((v) => (
            <ViolationCard key={v.id} v={v} showActions={reviewingBatch} />
          ))}
        </div>
      )}

      {/* Recent Inspections */}
      {recentInspections.length > 0 && (
        <div className="mt-8 space-y-3">
          <h2 className="text-lg font-semibold text-zinc-400">Today's Inspections</h2>
          {recentInspections.map((v) => (
            <div key={v.id} className="bg-zinc-900 rounded-xl p-3 flex justify-between items-center">
              <div>
                <p className="text-white text-sm font-medium">{v.address}</p>
                <p className="text-zinc-500 text-xs">{v.violationType}</p>
              </div>
              <span className={`text-xs font-bold uppercase ${v.status === "approved" ? "text-red-400" : v.status === "dismissed" ? "text-zinc-500" : "text-yellow-400"}`}>
                {v.status === "approved" ? "Noticed" : v.status === "dismissed" ? "Dismissed" : "Pending"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
