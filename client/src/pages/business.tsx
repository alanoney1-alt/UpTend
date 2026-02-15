import { Link } from "wouter";
import { usePageTitle } from "@/hooks/use-page-title";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2, Users, Home, Store, Leaf, BarChart3,
  Link2, DollarSign, Calendar, Bot, Code, CheckCircle,
  ArrowRight, Shield, TrendingUp, FileText
} from "lucide-react";
import { useTranslation } from "react-i18next";

// sharedFeatures and audiences moved inside component for i18n

export default function Business() {
  usePageTitle("UpTend for Business | B2B Property Services Platform");
  const { t } = useTranslation();

  const sharedFeatures = [
    { icon: BarChart3, text: t("biz.feature_dashboard") },
    { icon: Leaf, text: t("biz.feature_esg") },
    { icon: Calendar, text: t("biz.feature_priority") },
    { icon: Home, text: t("biz.feature_bulk_scan") },
    { icon: Bot, text: t("biz.feature_george") },
    { icon: Code, text: t("biz.feature_api") },
  ];

  const audiences = [
    { icon: Building2, title: t("biz.aud_pm_title"), desc: t("biz.aud_pm_desc") },
    { icon: Users, title: t("biz.aud_hoa_title"), desc: t("biz.aud_hoa_desc") },
    { icon: Home, title: t("biz.aud_re_title"), desc: t("biz.aud_re_desc") },
    { icon: Store, title: t("biz.aud_commercial_title"), desc: t("biz.aud_commercial_desc") },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 mb-6 text-sm">
            {t("biz.badge")}
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            {t("biz.hero_title_prefix")} <span className="text-orange-500">{t("biz.hero_title_highlight")}</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto mb-10">
            {t("biz.hero_subtitle")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/business/register">
              <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 text-lg">
                {t("biz.get_started")} <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/business/login">
              <Button size="lg" variant="outline" className="border-slate-600 text-slate-200 hover:bg-slate-800 px-8 text-lg">
                {t("biz.log_in")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Two Business Models */}
      <section className="py-20 px-4 bg-slate-950">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">{t("biz.two_ways")}</h2>
          <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">{t("biz.choose_model")}</p>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Referral Partner */}
            <Card className="bg-slate-800/50 border-slate-700 overflow-hidden">
              <div className="bg-gradient-to-r from-orange-500/20 to-orange-600/10 p-6 border-b border-slate-700">
                <Badge className="bg-orange-500/30 text-orange-300 border-orange-500/40 mb-3">{t("biz.referral_partner")}</Badge>
                <h3 className="text-2xl font-bold text-white">{t("biz.customers_pay")}</h3>
              </div>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <DollarSign className="w-5 h-5 text-orange-400 mt-0.5 shrink-0" />
                    <span className="text-slate-300" dangerouslySetInnerHTML={{ __html: t("biz.referral_revenue") }} />
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 shrink-0" />
                    <span className="text-slate-300">{t("biz.referral_normal_pricing")}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-orange-400 mt-0.5 shrink-0" />
                    <span className="text-slate-300">{t("biz.referral_monthly_payouts")}</span>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-slate-400 mb-2 font-medium">{t("biz.perfect_for")}:</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="bg-slate-700 text-slate-300">{t("biz.ref_for_agents")}</Badge>
                    <Badge variant="secondary" className="bg-slate-700 text-slate-300">{t("biz.ref_for_hoa")}</Badge>
                    <Badge variant="secondary" className="bg-slate-700 text-slate-300">{t("biz.ref_for_insurance")}</Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-slate-400 font-medium">{t("biz.features")}:</p>
                  <ul className="space-y-2 text-sm text-slate-300">
                    <li className="flex items-center gap-2"><Link2 className="w-4 h-4 text-orange-400" /> {t("biz.ref_feat_tracking")}</li>
                    <li className="flex items-center gap-2"><Link2 className="w-4 h-4 text-orange-400" /> {t("biz.ref_feat_links")}</li>
                    <li className="flex items-center gap-2"><FileText className="w-4 h-4 text-orange-400" /> {t("biz.ref_feat_reports")}</li>
                    <li className="flex items-center gap-2"><Leaf className="w-4 h-4 text-orange-400" /> {t("biz.ref_feat_esg")}</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Direct Account */}
            <Card className="bg-slate-800/50 border-orange-500/50 overflow-hidden ring-1 ring-orange-500/30">
              <div className="bg-gradient-to-r from-orange-500/30 to-orange-600/20 p-6 border-b border-slate-700">
                <Badge className="bg-orange-500 text-white mb-3">{t("biz.most_popular")}</Badge>
                <Badge className="bg-orange-500/30 text-orange-300 border-orange-500/40 mb-3 ml-2">{t("biz.direct_account")}</Badge>
                <h3 className="text-2xl font-bold text-white">{t("biz.you_pay_save")}</h3>
              </div>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <DollarSign className="w-5 h-5 text-orange-400 mt-0.5 shrink-0" />
                    <div className="text-slate-300">
                      <strong className="text-white">{t("biz.volume_discounts")}:</strong>
                      <ul className="mt-1 space-y-1 text-sm">
                        <li>{t("biz.vol_10")}</li>
                        <li>{t("biz.vol_25")}</li>
                        <li>{t("biz.vol_50")}</li>
                      </ul>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-green-400 mt-0.5 shrink-0" />
                    <span className="text-slate-300">{t("biz.net30")}</span>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-slate-400 mb-2 font-medium">{t("biz.perfect_for")}:</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="bg-slate-700 text-slate-300">{t("biz.dir_for_pm")}</Badge>
                    <Badge variant="secondary" className="bg-slate-700 text-slate-300">{t("biz.dir_for_commercial")}</Badge>
                    <Badge variant="secondary" className="bg-slate-700 text-slate-300">{t("biz.dir_for_hoa")}</Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-slate-400 font-medium">{t("biz.features")}:</p>
                  <ul className="space-y-2 text-sm text-slate-300">
                    <li className="flex items-center gap-2"><BarChart3 className="w-4 h-4 text-orange-400" /> {t("biz.dir_feat_dashboard")}</li>
                    <li className="flex items-center gap-2"><Calendar className="w-4 h-4 text-orange-400" /> {t("biz.dir_feat_bulk")}</li>
                    <li className="flex items-center gap-2"><Shield className="w-4 h-4 text-orange-400" /> {t("biz.dir_feat_priority")}</li>
                    <li className="flex items-center gap-2"><Leaf className="w-4 h-4 text-orange-400" /> {t("biz.dir_feat_esg")}</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Both Models Include */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">{t("biz.both_include")}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sharedFeatures.map((f) => (
              <div key={f.text} className="flex items-start gap-3 bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <f.icon className="w-5 h-5 text-orange-400 mt-0.5 shrink-0" />
                <span className="text-slate-300 text-sm">{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="py-20 px-4 bg-slate-950">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">{t("biz.who_for")}</h2>
          <p className="text-slate-400 text-center mb-12">{t("biz.who_for_sub")}</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {audiences.map((a) => (
              <Card key={a.title} className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-4">
                    <a.icon className="w-7 h-7 text-orange-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{a.title}</h3>
                  <p className="text-sm text-slate-400">{a.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ESG Differentiator */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <Leaf className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t("biz.esg_headline")}
          </h2>
          <p className="text-slate-400 text-lg mb-8 max-w-2xl mx-auto">
            {t("biz.esg_subhead")}
          </p>
          <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-5">
              <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-3" />
              <p className="text-slate-300 text-sm">{t("biz.esg_report")}</p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-5">
              <BarChart3 className="w-6 h-6 text-green-400 mx-auto mb-3" />
              <p className="text-slate-300 text-sm">{t("biz.esg_dashboard")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 px-4 bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">{t("biz.cta_headline")}</h2>
          <Link href="/business/register">
            <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-10 text-lg">
              {t("biz.get_started")} <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
