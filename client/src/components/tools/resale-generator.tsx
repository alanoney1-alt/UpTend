import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Copy, DollarSign, Tag, Sparkles, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ListingData {
  title: string;
  price: number;
  description: string;
  tags?: string[];
}

const generateListing = async (photoUrl: string): Promise<ListingData> => {
  const response = await fetch("/api/ai/generate-listing", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ photoUrl }),
  });

  if (!response.ok) {
    throw new Error("AI Failed");
  }

  return await response.json();
};

export function ResaleGenerator({
  photoUrl,
  onComplete,
}: {
  photoUrl: string;
  onComplete?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [listing, setListing] = useState<ListingData | null>(null);
  const [claimed, setClaimed] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const data = await generateListing(photoUrl);
      setListing(data);
    } catch {
      toast({ title: "AI Error", description: "Could not identify item. Try a clearer photo.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Paste this into Facebook Marketplace." });
  };

  if (claimed) {
    return (
      <Card className="border-green-300 dark:border-green-700" data-testid="card-resale-claimed">
        <CardContent className="p-6 text-center space-y-3">
          <CheckCircle className="w-10 h-10 text-green-500 mx-auto" />
          <h3 className="font-bold">Item Claimed for Resale</h3>
          <p className="text-sm text-muted-foreground">
            Good luck selling! UpTend takes 0% commission.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!listing) {
    return (
      <Card className="border-dashed border-2 border-amber-400 dark:border-amber-600 bg-amber-50/50 dark:bg-amber-950/20" data-testid="card-resale-prompt">
        <CardContent className="p-6 text-center space-y-4">
          <div className="bg-amber-100 dark:bg-amber-900/40 w-12 h-12 rounded-full flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h3 className="font-bold">Spot a Treasure?</h3>
            <p className="text-sm text-muted-foreground">
              Don't dump it! Keep it and sell it. Our AI will write the ad for you.
            </p>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full"
            data-testid="button-generate-listing"
          >
            {loading ? (
              <Loader2 className="animate-spin mr-2 w-4 h-4" />
            ) : (
              <Tag className="mr-2 w-4 h-4" />
            )}
            {loading ? "Analyzing Item..." : "Generate Listing"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden animate-in zoom-in-95" data-testid="card-resale-listing">
      <div className="bg-green-600 dark:bg-green-700 p-3 text-white text-center font-bold flex items-center justify-center gap-2">
        <DollarSign className="w-5 h-5" /> Potential Profit: ${listing.price}
      </div>
      <CardContent className="p-4 space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-bold text-muted-foreground uppercase">Title</label>
          <div className="flex gap-2">
            <Input
              readOnly
              value={listing.title}
              className="flex-1"
              data-testid="input-listing-title"
            />
            <Button size="icon" variant="outline" onClick={() => copyToClipboard(listing.title)} data-testid="button-copy-title">
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-muted-foreground uppercase">Description</label>
          <div className="relative">
            <Textarea
              readOnly
              value={listing.description}
              className="min-h-[96px] resize-none"
              data-testid="input-listing-description"
            />
            <Button
              size="sm"
              variant="outline"
              className="absolute bottom-2 right-2"
              onClick={() => copyToClipboard(listing.description)}
              data-testid="button-copy-description"
            >
              <Copy className="w-3 h-3 mr-1" /> Copy
            </Button>
          </div>
        </div>

        {listing.tags && listing.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {listing.tags.map((tag, i) => (
              <Badge key={i} variant="secondary" className="text-xs" data-testid={`badge-tag-${i}`}>
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <Button
          onClick={() => {
            setClaimed(true);
            onComplete?.();
          }}
          className="w-full"
          data-testid="button-claim-item"
        >
          I've Listed It (Claim Item)
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          *You are responsible for storage and sale. UpTend takes 0% commission.
        </p>
      </CardContent>
    </Card>
  );
}
