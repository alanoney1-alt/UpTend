import { usePageTitle } from "@/hooks/use-page-title";
import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Truck, ArrowLeft, Phone, Mail, MapPin, Clock, 
  MessageCircle, HelpCircle, Send, CheckCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { useTranslation } from "react-i18next";

export default function Contact() {
  usePageTitle("Contact Us | UpTend");
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formState),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      setIsSubmitted(true);
      toast({
        title: "Message Sent!",
        description: "We'll get back to you within 24 hours.",
      });
    } catch (error) {
      // Fallback: open email client
      const subject = encodeURIComponent(`Contact Form: ${formState.subject || "General Inquiry"}`);
      const body = encodeURIComponent(`Name: ${formState.name}\nEmail: ${formState.email}\nPhone: ${formState.phone || "N/A"}\n\n${formState.message}`);
      window.location.href = `mailto:hello@uptendapp.com?subject=${subject}&body=${body}`;
      toast({
        title: "Opening Email Client",
        description: "If the form didn't work, please send your message via email.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormState(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-12 pt-28">
        <div className="text-center mb-12">
          <MessageCircle className="w-12 h-12 mx-auto mb-4 text-primary" />
          <h1 className="text-4xl font-bold mb-4">{t("contact.title")}</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {t("contact.subtitle")}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">{t("contact.get_in_touch")}</h2>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary flex-shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">{t("contact.phone_support")}</h3>
                    <a 
                      href="tel:407-338-3342" 
                      className="text-primary hover:underline text-lg font-semibold"
                      data-testid="link-contact-phone"
                    >
                      (407) 338-3342
                    </a>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t("contact.tap_to_call")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary flex-shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">{t("contact.email_support")}</h3>
                    <a 
                      href="mailto:hello@uptendapp.com" 
                      className="text-primary hover:underline"
                      data-testid="link-contact-email"
                    >
                      hello@uptendapp.com
                    </a>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t("contact.respond_24h")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary flex-shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">{t("contact.support_hours")}</h3>
                    <p className="text-foreground">{t("contact.hours_value")}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t("contact.hours_note")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary flex-shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">{t("contact.service_area")}</h3>
                    <p className="text-foreground">{t("contact.area_value")}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t("contact.area_counties")}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-primary/5 border-primary/20">
              <div className="flex items-start gap-4">
                <HelpCircle className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-2">{t("contact.quick_answers")}</h3>
                  <p className="text-muted-foreground text-sm mb-3">
                    {t("contact.quick_answers_desc")}
                  </p>
                  <Link href="/faq">
                    <Button variant="outline" size="sm" data-testid="button-view-faq">
                      {t("contact.view_faq")}
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-6">
            {isSubmitted ? (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
                <h2 className="text-2xl font-bold mb-2">{t("contact.sent_title")}</h2>
                <p className="text-muted-foreground mb-6">
                  {t("contact.sent_desc")}
                </p>
                <Button onClick={() => setIsSubmitted(false)} variant="outline" data-testid="button-send-another">
                  {t("contact.send_another")}
                </Button>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-semibold mb-4">{t("contact.send_message")}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">{t("contact.name")}</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder={t("contact.name_placeholder")}
                        value={formState.name}
                        onChange={handleChange}
                        required
                        data-testid="input-contact-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">{t("contact.email")}</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder={t("contact.email_placeholder")}
                        value={formState.email}
                        onChange={handleChange}
                        required
                        data-testid="input-contact-email"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">{t("contact.phone")}</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder={t("contact.phone_placeholder")}
                        value={formState.phone}
                        onChange={handleChange}
                        data-testid="input-contact-phone"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">{t("contact.subject")}</Label>
                      <Input
                        id="subject"
                        name="subject"
                        placeholder={t("contact.subject_placeholder")}
                        value={formState.subject}
                        onChange={handleChange}
                        required
                        data-testid="input-contact-subject"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">{t("contact.message")}</Label>
                    <Textarea
                      id="message"
                      name="message"
                      placeholder={t("contact.message_placeholder")}
                      rows={5}
                      value={formState.message}
                      onChange={handleChange}
                      required
                      data-testid="textarea-contact-message"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isSubmitting}
                    data-testid="button-submit-contact"
                  >
                    {isSubmitting ? (
                      t("contact.sending")
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        {t("contact.send")}
                      </>
                    )}
                  </Button>
                </form>
              </>
            )}
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
