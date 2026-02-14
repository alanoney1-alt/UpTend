import { Link } from "wouter";
import { Logo } from "@/components/ui/logo";
import { Mail, Phone, MapPin, Instagram, Linkedin, Twitter } from "lucide-react";
import { useTranslation } from "react-i18next";

export function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-900" data-testid="footer">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">

          <div className="space-y-6">
            <Link href="/" data-testid="link-footer-logo">
              <Logo className="w-10 h-10" textClassName="text-2xl" />
            </Link>
            <h3 className="text-white font-bold text-lg" data-testid="text-footer-stewardship">{t("footer.footer_home_value_os")}</h3>
            <p className="text-sm leading-relaxed" data-testid="text-footer-mission">
              {t("footer.footer_mission")}
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm hover:text-white transition-colors">
                <Phone className="w-4 h-4 text-primary shrink-0" />
                <a href="tel:407-338-3342" data-testid="link-footer-phone">(407) 338-3342</a>
              </div>
              <div className="flex items-center gap-3 text-sm hover:text-white transition-colors">
                <Mail className="w-4 h-4 text-primary shrink-0" />
                <a href="mailto:alan@uptend.app" data-testid="text-footer-email">alan@uptend.app</a>
              </div>
              <div className="flex items-center gap-3 text-sm hover:text-white transition-colors">
                <MapPin className="w-4 h-4 text-primary shrink-0" />
                <span data-testid="text-footer-location">{t("footer.footer_orlando")}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-widest text-xs" data-testid="text-footer-services">{t("footer.footer_essential_5")}</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/services/home-audit" className="hover:text-primary transition-colors cursor-pointer" data-testid="link-footer-home-audit">
                  {t("footer.footer_ai_home_scan")}
                </Link>
              </li>
              <li>
                <Link href="/services/handyman" className="hover:text-primary transition-colors cursor-pointer" data-testid="link-footer-handyman">
                  {t("footer.footer_handyman")}
                </Link>
              </li>
              <li>
                <Link href="/services/material-recovery" className="hover:text-primary transition-colors cursor-pointer" data-testid="link-footer-junk-removal">
                  {t("footer.footer_junk_removal")}
                </Link>
              </li>
              <li>
                <Link href="/services/garage-cleanout" className="hover:text-primary transition-colors cursor-pointer" data-testid="link-footer-garage-cleanout">
                  {t("footer.footer_garage_cleanout")}
                </Link>
              </li>
              <li>
                <Link href="/services/moving-labor" className="hover:text-primary transition-colors cursor-pointer" data-testid="link-footer-moving-labor">
                  {t("footer.footer_moving_labor")}
                </Link>
              </li>
              <li>
                <Link href="/services/home-cleaning" className="hover:text-primary transition-colors cursor-pointer" data-testid="link-footer-home-cleaning">
                  {t("footer.footer_home_cleaning")}
                </Link>
              </li>
              <li>
                <Link href="/services/carpet-cleaning" className="hover:text-primary transition-colors cursor-pointer" data-testid="link-footer-carpet-cleaning">
                  {t("footer.footer_carpet_cleaning")}
                </Link>
              </li>
              <li>
                <Link href="/services/landscaping" className="hover:text-primary transition-colors cursor-pointer" data-testid="link-footer-landscaping">
                  {t("footer.footer_landscaping")}
                </Link>
              </li>
              <li>
                <Link href="/services/gutter-cleaning" className="hover:text-primary transition-colors cursor-pointer" data-testid="link-footer-gutter-cleaning">
                  {t("footer.footer_gutter_cleaning")}
                </Link>
              </li>
              <li>
                <Link href="/services/pressure-washing" className="hover:text-primary transition-colors cursor-pointer" data-testid="link-footer-pressure-washing">
                  {t("footer.footer_pressure_washing")}
                </Link>
              </li>
              <li>
                <Link href="/services/pool-cleaning" className="hover:text-primary transition-colors cursor-pointer" data-testid="link-footer-pool-cleaning">
                  {t("footer.footer_pool_cleaning")}
                </Link>
              </li>
              <li>
                <Link href="/services/demolition" className="hover:text-primary transition-colors cursor-pointer" data-testid="link-footer-demolition">
                  {t("footer.footer_light_demolition")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-widest text-xs" data-testid="text-footer-for-pros">{t("footer.footer_for_pros")}</h4>
            <ul className="space-y-4 text-sm">
              <li>
                <Link href="/become-pro" className="hover:text-primary transition-colors cursor-pointer" data-testid="link-footer-join-network">
                  {t("footer.footer_join_network")}
                </Link>
              </li>
              <li>
                <Link href="/academy" className="hover:text-primary transition-colors cursor-pointer" data-testid="link-footer-academy">
                  {t("footer.footer_academy")}
                </Link>
              </li>
              <li>
                <Link href="/become-pro#benefits" className="hover:text-primary transition-colors cursor-pointer" data-testid="link-footer-no-lead-fees">
                  {t("footer.footer_no_lead_fees")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-widest text-xs">{t("footer.footer_connect")}</h4>
            <p className="text-sm text-slate-400 mb-4">
              Questions? Call us at <a href="tel:407-338-3342" className="text-white hover:text-primary transition-colors">(407) 338-3342</a>
            </p>
            <p className="text-xs text-slate-500" data-testid="text-footer-serving">
              {t("footer.footer_serving")}
            </p>
          </div>
        </div>

        <div className="border-t border-slate-900 mt-16 pt-8 text-xs flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <p data-testid="text-copyright">&copy; {currentYear} {t("footer.footer_copyright")}</p>
          </div>
          <div className="flex gap-6 flex-wrap">
            <Link href="/terms" className="hover:text-white transition-colors cursor-pointer" data-testid="link-footer-terms">
              {t("footer.footer_terms")}
            </Link>
            <Link href="/privacy" className="hover:text-white transition-colors cursor-pointer" data-testid="link-footer-privacy">
              {t("footer.footer_privacy")}
            </Link>
            <Link href="/cost-guides" className="hover:text-white transition-colors cursor-pointer" data-testid="link-footer-cost-guides">
              Cost Guides
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
