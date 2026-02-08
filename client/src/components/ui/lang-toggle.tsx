import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";

export function LanguageToggle() {
  const { i18n } = useTranslation();

  const toggle = () => {
    const newLang = i18n.language?.startsWith("es") ? "en" : "es";
    i18n.changeLanguage(newLang);
  };

  const isSpanish = i18n.language?.startsWith("es");

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      data-testid="button-lang-toggle"
    >
      <Languages className="w-4 h-4 mr-1" />
      {isSpanish ? "ES" : "EN"}
    </Button>
  );
}
