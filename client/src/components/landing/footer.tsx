import { Link } from "wouter";
import { Phone, Mail, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";

/* ─── Design Tokens ─── */
const T = {
  bg: "#1E1B15",
  bgLight: "#2A2620",
  primary: "#F59E0B",
  primaryDark: "#D97706",
  text: "#FFFBF5",
  textMuted: "#A39E93",
  border: "#3A362E",
};

const services = [
  { label: "Junk Removal", href: "/services/material-recovery" },
  { label: "Handyman", href: "/services/handyman" },
  { label: "Pressure Washing", href: "/services/pressure-washing" },
  { label: "Lawn Care", href: "/services/landscaping" },
  { label: "Home Cleaning", href: "/services/home-cleaning" },
  { label: "Gutter Cleaning", href: "/services/gutter-cleaning" },
  { label: "Pool Cleaning", href: "/services/pool-cleaning" },
  { label: "Garage Cleanout", href: "/services/garage-cleanout" },
  { label: "Moving Labor", href: "/services/moving-labor" },
  { label: "Carpet Cleaning", href: "/services/carpet-cleaning" },
  { label: "Light Demolition", href: "/services/demolition" },
  { label: "AI Home Scan", href: "/ai/home-scan" },
];

const legalLinks = [
  { label: "Terms", href: "/terms" },
  { label: "Privacy", href: "/privacy" },
  { label: "Cancellations", href: "/cancellation-policy" },
  { label: "Guarantee", href: "/service-guarantee" },
  { label: "Cookies", href: "/cookies" },
  { label: "SMS Terms", href: "/communications-consent" },
  { label: "Affiliate Disclosure", href: "/affiliate-disclosure" },
  { label: "Accessibility", href: "/accessibility" },
  { label: "B2B Terms", href: "/b2b-terms" },
  { label: "Acceptable Use", href: "/acceptable-use" },
  { label: "Cost Guides", href: "/cost-guides" },
];

export function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer style={{ background: T.bg, color: T.textMuted }} data-testid="footer">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">

          {/* Brand */}
          <div className="space-y-5">
            <Link href="/" data-testid="link-footer-logo" className="flex items-center gap-2">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg"
                style={{ background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDark})` }}
              >
                G
              </div>
              <span className="font-bold text-xl" style={{ color: T.text }}>UpTend</span>
            </Link>
            <p className="text-sm font-medium" style={{ color: T.primary }}>
              Powered by Mr. George
            </p>
            <p className="text-sm leading-relaxed" data-testid="text-footer-mission">
              Your Home Health Expert. George knows homes inside and out — and he's got your back.
            </p>
            <div className="space-y-3">
              <a href="tel:407-338-3342" className="flex items-center gap-3 text-sm hover:text-white transition-colors" data-testid="link-footer-phone">
                <Phone className="w-4 h-4 shrink-0" style={{ color: T.primary }} />
                (407) 338-3342
              </a>
              <a href="mailto:alan@uptendapp.com" className="flex items-center gap-3 text-sm hover:text-white transition-colors" data-testid="text-footer-email">
                <Mail className="w-4 h-4 shrink-0" style={{ color: T.primary }} />
                alan@uptendapp.com
              </a>
              <a href="https://uptendapp.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm hover:text-white transition-colors">
                <MapPin className="w-4 h-4 shrink-0" style={{ color: T.primary }} />
                uptendapp.com · Orlando, FL
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-bold mb-6 uppercase tracking-widest text-xs" style={{ color: T.text }}>
              Services
            </h4>
            <ul className="space-y-3 text-sm">
              {services.map((s) => (
                <li key={s.href}>
                  <Link href={s.href} className="hover:text-white transition-colors cursor-pointer">
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Pros */}
          <div>
            <h4 className="font-bold mb-6 uppercase tracking-widest text-xs" style={{ color: T.text }}>
              For Pros
            </h4>
            <ul className="space-y-4 text-sm">
              <li>
                <Link href="/become-pro" className="hover:text-white transition-colors cursor-pointer">
                  Join the Network
                </Link>
              </li>
              <li>
                <Link href="/academy" className="hover:text-white transition-colors cursor-pointer">
                  Pro Academy
                </Link>
              </li>
              <li>
                <Link href="/become-pro#benefits" className="hover:text-white transition-colors cursor-pointer">
                  No Lead Fees
                </Link>
              </li>
              <li>
                <Link href="/business" className="hover:text-white transition-colors cursor-pointer">
                  UpTend for Business
                </Link>
              </li>
              <li>
                <Link href="/emergency" className="hover:text-white transition-colors cursor-pointer text-red-400">
                  🚨 Emergency Services
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="font-bold mb-6 uppercase tracking-widest text-xs" style={{ color: T.text }}>
              Connect
            </h4>
            <p className="text-sm mb-4">
              Questions? Call George at{" "}
              <a href="tel:407-338-3342" className="hover:text-white transition-colors" style={{ color: T.text }}>
                (407) 338-3342
              </a>
            </p>
            {/* Social links */}
            <div className="flex gap-3 mt-4">
              <a href="https://www.facebook.com/UptendGeorge" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold hover:opacity-80 transition-opacity" style={{ background: T.bgLight, color: T.textMuted }} aria-label="Facebook">
                f
              </a>
              <a href="https://www.instagram.com/uptendgeorge" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold hover:opacity-80 transition-opacity" style={{ background: T.bgLight, color: T.textMuted }} aria-label="Instagram">
                ig
              </a>
              <a href="https://www.tiktok.com/@uptendgeorge" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold hover:opacity-80 transition-opacity" style={{ background: T.bgLight, color: T.textMuted }} aria-label="TikTok">
                tt
              </a>
              <a href="https://www.youtube.com/@UpTendGeorge" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold hover:opacity-80 transition-opacity" style={{ background: T.bgLight, color: T.textMuted }} aria-label="YouTube">
                yt
              </a>
            </div>
            <p className="text-xs mt-6" style={{ color: T.textMuted }}>
              Serving Central Florida — Orlando, Lake Nona, Kissimmee, Winter Park & beyond
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 text-xs flex flex-col md:flex-row justify-between items-center gap-4" style={{ borderTop: `1px solid ${T.border}` }}>
          <p data-testid="text-copyright">
            &copy; {currentYear} UpTend Inc. All rights reserved.
          </p>
          <div className="flex gap-x-5 gap-y-2 flex-wrap justify-center">
            {legalLinks.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-white transition-colors cursor-pointer">
                {link.label}
              </Link>
            ))}
            <Link href="/admin-login" className="hover:text-white transition-colors cursor-pointer" style={{ color: `${T.textMuted}80` }} data-testid="link-footer-admin">
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
