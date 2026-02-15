import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Lock, Sparkles } from "lucide-react";

interface UpgradePromptProps {
  featureName: string;
  variant?: "banner" | "card" | "inline";
}

export function UpgradePrompt({ featureName, variant = "card" }: UpgradePromptProps) {
  if (variant === "banner") {
    return (
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <span className="text-sm text-amber-800">
            <span className="font-medium">Upgrade to unlock advanced features</span> — SLA management, reports, compliance, and more.
          </span>
        </div>
        <Link href="/b2b-pricing">
          <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
            View Plans <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </Link>
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 rounded-md px-3 py-2">
        <Lock className="h-3.5 w-3.5" />
        <span>{featureName} requires a paid plan.</span>
        <Link href="/b2b-pricing">
          <span className="underline font-medium cursor-pointer">Upgrade</span>
        </Link>
      </div>
    );
  }

  return (
    <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
      <CardContent className="p-8 text-center space-y-4">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-100">
          <Lock className="h-7 w-7 text-amber-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Unlock {featureName}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            You're on the <Badge variant="outline" className="mx-1 border-amber-300 text-amber-700">Independent (Free)</Badge> plan.
            Upgrade to Starter to access {featureName.toLowerCase()}.
          </p>
        </div>
        <div className="bg-white rounded-lg border border-amber-200 p-4 max-w-sm mx-auto text-left">
          <p className="text-sm font-medium text-gray-900 mb-2">Starter Plan — $3/door/mo</p>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• 11–50 properties</li>
            <li>• SLA management & compliance</li>
            <li>• Reports & CSV import</li>
            <li>• Priority support</li>
          </ul>
        </div>
        <Link href="/b2b-pricing">
          <Button className="bg-orange-500 hover:bg-orange-600 text-white">
            Upgrade Now <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
