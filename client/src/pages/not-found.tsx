import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">{t("not_found.title")}</h1>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            {t("not_found.message")}
          </p>

          <div className="mt-6 flex gap-3">
            <Link href="/">
              <Button variant="default" className="gap-2">
                <Home className="w-4 h-4" />
                {t("not_found.go_home")}
              </Button>
            </Link>
            <Link href="/services">
              <Button variant="outline" className="gap-2">
                {t("not_found.browse_services")}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
