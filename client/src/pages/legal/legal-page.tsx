import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import type { ReactNode } from "react";

interface LegalPageProps {
  title: string;
  icon: ReactNode;
  lastUpdated: string;
  children: ReactNode;
}

export function LegalPage({ title, icon, lastUpdated, children }: LegalPageProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <Logo className="w-8 h-8" textClassName="text-xl" />
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="w-12 h-12 mx-auto mb-4 text-primary flex items-center justify-center">
            {icon}
          </div>
          <h1 className="text-4xl font-bold mb-4">{title}</h1>
          <p className="text-muted-foreground">Last Updated: {lastUpdated}</p>
        </div>

        <Card className="p-8 prose prose-gray dark:prose-invert max-w-none">
          {children}
        </Card>
      </main>

      <footer className="border-t py-8 mt-16">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} UpTend. All rights reserved.</p>
          <div className="flex flex-wrap justify-center gap-4 mt-2">
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/cancellation-policy" className="hover:text-foreground">Cancellations</Link>
            <Link href="/service-guarantee" className="hover:text-foreground">Guarantee</Link>
            <Link href="/b2b-terms" className="hover:text-foreground">B2B Terms</Link>
            <Link href="/acceptable-use" className="hover:text-foreground">Acceptable Use</Link>
            <Link href="/accessibility" className="hover:text-foreground">Accessibility</Link>
            <Link href="/cookies" className="hover:text-foreground">Cookies</Link>
            <Link href="/communications-consent" className="hover:text-foreground">SMS Terms</Link>
            <Link href="/affiliate-disclosure" className="hover:text-foreground">Affiliate Disclosure</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
