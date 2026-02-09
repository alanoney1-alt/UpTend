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
                  DwellScan™ (Home Audit)
                </Link>
              </li>
              <li>
                <Link href="/services/material-recovery" className="hover:text-primary transition-colors cursor-pointer" data-testid="link-footer-junk-removal">
                  BulkSnap™ (Junk Removal)
                </Link>
              </li>
              <li>
                <Link href="/book/freshcut" className="hover:text-primary transition-colors cursor-pointer" data-testid="link-footer-landscaping">
                  FreshCut™ (Landscaping)
                </Link>
              </li>
              <li>
                <Link href="/services/home-cleaning" className="hover:text-primary transition-colors cursor-pointer" data-testid="link-footer-home-cleaning">
                  PolishUp™ (Home Cleaning)
                </Link>
              </li>
              <li>
                <Link href="/book/deepfiber" className="hover:text-primary transition-colors cursor-pointer" data-testid="link-footer-carpet-cleaning">
                  DeepFiber™ (Carpet Cleaning)
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-primary transition-colors cursor-pointer" data-testid="link-footer-pressure-washing">
                  FreshWash™ (Pressure Washing)
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-primary transition-colors cursor-pointer" data-testid="link-footer-gutter-cleaning">
                  GutterFlush™ (Gutter Cleaning)
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-primary transition-colors cursor-pointer" data-testid="link-footer-pool-cleaning">
                  PoolSpark™ (Pool Cleaning)
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-primary transition-colors cursor-pointer" data-testid="link-footer-furniture-moving">
                  LiftCrew™ (Furniture Moving)
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-primary transition-colors cursor-pointer" data-testid="link-footer-moving-labor">
                  LiftCrew™ (Moving Labor)
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-primary transition-colors cursor-pointer" data-testid="link-footer-truck-unloading">
                  UnloadPro™ (Truck Unloading)
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-primary transition-colors cursor-pointer" data-testid="link-footer-garage-cleanout">
                  GarageReset™ (Garage Cleanout)
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-primary transition-colors cursor-pointer" data-testid="link-footer-demolition">
                  TearDown™ (Demolition)
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
            <p className="mt-1 text-slate-500" data-testid="text-legal-entity">{t("footer.footer_legal_entity")}</p>
          </div>
          <div className="flex gap-6 flex-wrap">
            <Link href="/terms" className="hover:text-white transition-colors cursor-pointer" data-testid="link-footer-terms">
              {t("footer.footer_terms")}
            </Link>
            <Link href="/privacy" className="hover:text-white transition-colors cursor-pointer" data-testid="link-footer-privacy">
              {t("footer.footer_privacy")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
