import { Link } from "wouter";
import { BookOpen, Video, ShieldCheck, ClipboardList, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";

const modules = [
  {
    title: "Module 1: The Stewardship Mindset",
    icon: <Star className="text-yellow-500 dark:text-yellow-400" />,
    lessons: [
      "From Service Provider to Verified Home Steward",
      "The UpTend Standard of Care",
      "Understanding your role as an Asset Guardian",
    ],
  },
  {
    title: "Module 2: Technical Mastery (The Essential 5)",
    icon: <ClipboardList className="text-blue-500 dark:text-blue-400" />,
    lessons: [
      "Junk Removal: Efficient Sorting & Disposal",
      "Pressure Washing: Surface Safety & Chemicals",
      "Gutter Cleaning: Ladder Safety & Downspout Testing",
      "Moving Labor: Protecting Property & Personnel",
      "Home Scan: Performing the 360\u00B0 Asset Inventory",
    ],
  },
  {
    title: "Module 3: The 360\u00B0 Evidence Scan",
    icon: <Video className="text-purple-500 dark:text-purple-400" />,
    lessons: [
      "Mastering the 360° Home DNA Scan Video",
      "Pre-Work Documentation: Protecting Yourself from Liability",
      "Post-Work Verification: The 'Done Right' Guarantee",
    ],
  },
  {
    title: "Module 4: Tech & Communication",
    icon: <ShieldCheck className="text-green-500 dark:text-green-400" />,
    lessons: [
      "Using the Bilingual Interface",
      "Real-Time Status Updates & GPS Etiquette",
      "Handling Disputes with Video Proof",
    ],
  },
];

export default function AcademySyllabus() {
  return (
    <div className="min-h-screen bg-background" data-testid="page-academy-syllabus">
      <Header />

      <section className="bg-primary dark:bg-primary pt-28 pb-24 px-6 text-center text-white" data-testid="section-academy-hero">
        <h1 className="text-4xl font-black mb-4 uppercase tracking-tight" data-testid="text-academy-title">
          The UpTend Academy
        </h1>
        <p className="text-orange-100 text-lg max-w-2xl mx-auto" data-testid="text-academy-subtitle">
          Elevate your craft. Our certification program ensures every Pro provides the highest standard
          of stewardship in the industry.
        </p>
      </section>

      <div className="max-w-5xl mx-auto -mt-10 px-6 pb-24" data-testid="section-academy-content">
        <div className="bg-card rounded-2xl shadow-xl p-8 border border-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 border-b border-border pb-8 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary dark:bg-primary rounded-full flex items-center justify-center text-white font-bold text-2xl">
                0%
              </div>
              <div>
                <h2 className="text-xl font-bold" data-testid="text-cert-progress">Certification Progress</h2>
                <p className="text-sm text-muted-foreground">Complete all 4 modules to unlock your Pro Badge.</p>
              </div>
            </div>
            <Link href="/academy">
              <Button className="bg-primary border-primary" data-testid="button-resume-learning">Resume Learning</Button>
            </Link>
          </div>

          <div className="space-y-12">
            {modules.map((mod, idx) => (
              <div key={idx} className="relative" data-testid={`module-${idx + 1}`}>
                <div className="flex gap-6 items-start">
                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center shrink-0 shadow-sm">
                    {mod.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-4">{mod.title}</h3>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {mod.lessons.map((lesson, lIdx) => (
                        <li
                          key={lIdx}
                          className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border text-sm text-muted-foreground hover-elevate cursor-pointer"
                          data-testid={`lesson-${idx + 1}-${lIdx + 1}`}
                        >
                          <BookOpen className="w-4 h-4 text-muted-foreground shrink-0" />
                          {lesson}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 p-8 bg-blue-900 dark:bg-blue-950 rounded-2xl text-white flex flex-col md:flex-row items-center gap-8" data-testid="section-academy-closing">
          <div className="text-center md:text-left flex-1">
            <h4 className="text-xl font-bold mb-2">Why this matters</h4>
            <p className="text-orange-200 text-sm leading-relaxed">
              &ldquo;The Academy isn&rsquo;t just about learning to use the app. It&rsquo;s about setting a standard. When you wear the
              UpTend badge, you are signaling to the homeowner (or the renter) that you are a professional they can trust.
              We document everything because we take pride in what we do.&rdquo;
            </p>
            <p className="mt-4 font-bold text-white">Alan, Founder</p>
          </div>
          <div className="shrink-0">
            <div className="w-32 h-32 border-4 border-dashed border-orange-400 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-orange-400 text-center uppercase px-4">Earn Your Badge</span>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
