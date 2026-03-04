import { Link } from "wouter";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#0a0a0f] text-white px-4">
      <div className="text-center max-w-md">
        <div className="text-7xl font-bold text-gray-700 mb-2">404</div>
        <h1 className="text-2xl font-bold mb-3">Page not found</h1>
        <p className="text-gray-400 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/">
            <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Home className="w-4 h-4" />
              Go Home
            </Button>
          </Link>
          <Link href="/services">
            <Button variant="outline" className="gap-2 border-gray-700 text-gray-300 hover:bg-gray-800">
              Browse Services
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
