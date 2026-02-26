import { Link } from "wouter";
import { Logo } from "@/components/ui/logo";
import { Mail, MessageCircle, MapPin, Instagram, Linkedin, Twitter } from "lucide-react";
import { useTranslation } from "react-i18next";

export function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-900 pb-20 md:pb-0" data-testid="footer">
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
                <MessageCircle className="w-4 h-4 text-primary shrink-0" />
                <button onClick={() => window.dispatchEvent(new CustomEvent("george:open"))} className="hover:text-primary transition-colors cursor-pointer" data-testid="link-footer-chat">Chat with George</button>
              </div>
              <div className="flex items-center gap-3 text-sm hover:text-white transition-colors">
                <Mail className="w-4 h-4 text-primary shrink-0" />
                <a href="mailto:hello@uptendapp.com" data-testid="text-footer-email">hello@uptendapp.com</a>
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
                <Link href="/home-dna-scan" className="hover:text-primary transition-colors cursor-pointer" data-testid="link-footer-home-audit">
                  {t("footer.footer_ai_home_scan")}
                </Link>
              </li>
              <li>
                <Link href="/services/handyman" className="hover:text-primary transition-colors cursor-pointer" data-testid="link-footer-handyman">
                  {t("footer.footer_handyman")}
                </Link>
              </li>
              <li>
                <Link href="/services/junk-removal" className="hover:text-primary transition-colors cursor-pointer" data-testid="link-footer-junk-removal">
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
              <li>
                <Link href="/business" className="hover:text-primary transition-colors cursor-pointer" data-testid="link-footer-business">
                  UpTend for Business
                </Link>
              </li>
              <li>
                <Link href="/home-dna-scan" className="hover:text-primary transition-colors cursor-pointer text-[#F47C20] font-medium" data-testid="link-footer-home-scan">
                  Home DNA Scan
                </Link>
              </li>
              <li>
                <Link href="/emergency-sos" className="hover:text-primary transition-colors cursor-pointer text-red-400" data-testid="link-footer-emergency">
                  Emergency Services
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-widest text-xs">{t("footer.footer_connect")}</h4>
            <p className="text-sm text-slate-400 mb-4">
              Questions? <button onClick={() => window.dispatchEvent(new CustomEvent("george:open"))} className="text-white hover:text-primary transition-colors cursor-pointer">Chat with George</button>
            </p>
            <div className="flex gap-4 mb-4">
              <a href="https://facebook.com/UptendGeorge" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors" aria-label="Facebook">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="https://instagram.com/uptendgeorge" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors" aria-label="Instagram">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
              <a href="https://tiktok.com/@uptendgeorge" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors" aria-label="TikTok">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
              </a>
            </div>
            <p className="text-xs text-slate-400" data-testid="text-footer-serving">
              {t("footer.footer_serving")}
            </p>
          </div>
        </div>

        <div className="border-t border-slate-900 mt-16 pt-8 text-xs flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <p data-testid="text-copyright">&copy; {currentYear} {t("footer.footer_copyright")}</p>
          </div>
          <div className="flex gap-x-6 gap-y-2 flex-wrap">
            <Link href="/terms" className="hover:text-white transition-colors cursor-pointer" data-testid="link-footer-terms">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-white transition-colors cursor-pointer" data-testid="link-footer-privacy">
              Privacy
            </Link>
            <Link href="/cancellation-policy" className="hover:text-white transition-colors cursor-pointer">
              Cancellations
            </Link>
            <Link href="/service-guarantee" className="hover:text-white transition-colors cursor-pointer">
              Guarantee
            </Link>
            <Link href="/cookies" className="hover:text-white transition-colors cursor-pointer">
              Cookies
            </Link>
            <Link href="/communications-consent" className="hover:text-white transition-colors cursor-pointer">
              SMS Terms
            </Link>
            <Link href="/affiliate-disclosure" className="hover:text-white transition-colors cursor-pointer">
              Affiliate Disclosure
            </Link>
            <Link href="/accessibility" className="hover:text-white transition-colors cursor-pointer">
              Accessibility
            </Link>
            <Link href="/b2b-terms" className="hover:text-white transition-colors cursor-pointer">
              B2B Terms
            </Link>
            <Link href="/acceptable-use" className="hover:text-white transition-colors cursor-pointer">
              Acceptable Use
            </Link>
            <Link href="/cost-guides" className="hover:text-white transition-colors cursor-pointer">
              Cost Guides
            </Link>
            <Link href="/gallery" className="hover:text-white transition-colors cursor-pointer">
              Gallery
            </Link>
            {/* Admin link removed */}
          </div>
        </div>
      </div>
    </footer>
  );
}
