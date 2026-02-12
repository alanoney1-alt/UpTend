import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">Page Not Found</h1>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            Sorry, we couldn't find the page you're looking for. It may have been moved or no longer exists.
          </p>

          <div className="mt-6 flex gap-3">
            <Link href="/">
              <Button variant="default" className="gap-2">
                <Home className="w-4 h-4" />
                Go Home
              </Button>
            </Link>
            <Link href="/services">
              <Button variant="outline" className="gap-2">
                Browse Services
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
