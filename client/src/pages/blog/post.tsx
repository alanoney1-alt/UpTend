import { useParams, Link } from "wouter";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { Helmet } from "react-helmet";
import NotFound from "@/pages/not-found";

interface BlogPostData {
  slug: string;
  title: string;
  date: string;
  author: string;
  content: string;
}

const posts: Record<string, BlogPostData> = {
  "when-to-replace-water-heater": {
    slug: "when-to-replace-water-heater",
    title: "5 Signs Your Water Heater Is About to Fail (and What to Do)",
    date: "February 24, 2026",
    author: "George",
    content: `Your water heater is one of those appliances you never think about. Until it stops working. Most tank water heaters last 8 to 12 years, but Florida's hard water and high humidity can shorten that lifespan significantly. Here are the five warning signs every Orlando homeowner should watch for.

## 1. Your Water Heater Is Over 10 Years Old

Check the serial number on the manufacturer's label. The first two digits usually indicate the year of manufacture. If your unit is approaching or past the decade mark, it is living on borrowed time. Proactive replacement saves you from emergency failures. Which always seem to happen on a Sunday night.

## 2. Rusty or Discolored Hot Water

If your hot water comes out with a reddish or brownish tint, that typically means the interior of the tank is corroding. Once rust starts, it does not stop. This is especially common in Central Florida where the water mineral content accelerates corrosion.

## 3. Strange Noises: Rumbling, Popping, or Banging

Sediment builds up at the bottom of the tank over time. When the burner heats the water, it has to work through that layer of sediment, causing rumbling or popping sounds. This reduces efficiency and accelerates wear on the tank.

## 4. Water Pooling Around the Base

Any moisture or puddles around the base of your water heater indicate a slow leak. Check the fittings and the temperature/pressure relief valve first, but if those are dry, the tank itself may be cracking. This is an urgent sign. A full tank failure means 40 to 80 gallons of water on your floor.

## 5. Your Hot Water Runs Out Faster Than It Used To

If showers that used to stay hot are now going lukewarm after five minutes, sediment buildup or a failing heating element is likely the cause. For electric heaters, a new element might fix the problem. For gas units near end of life, replacement is usually the better investment.

## What to Do Next

If you are seeing one or more of these signs, do not wait for a catastrophic failure. Get an instant quote through UpTend. George can assess your situation in seconds and connect you with a licensed plumber if needed. Every job is backed by our price ceiling guarantee.`,
  },
  "pressure-washing-guide-orlando": {
    slug: "pressure-washing-guide-orlando",
    title: "Pressure Washing in Orlando: What Every Homeowner Should Know",
    date: "February 24, 2026",
    author: "George",
    content: `Orlando's subtropical climate means your home's exterior takes a beating from humidity, rain, and algae growth year-round. Pressure washing is not just about curb appeal. It protects your investment and keeps your HOA happy.

## What Should You Pressure Wash?

- **Driveway and sidewalks**: Every 6 to 12 months. Florida humidity breeds black algae stains fast.
- **House exterior (siding/stucco)**: Once a year. Mold and mildew accumulate faster than you think.
- **Pool deck**: Every 6 months. Algae on pool decks is a slip hazard.
- **Fence**: Annually. Wood fences in Florida deteriorate quickly without maintenance.
- **Roof**: Soft wash only (low pressure with chemicals). Never high-pressure wash a roof.

## How Much Does It Cost?

For a typical Orlando home, expect to pay $200 to $450 for a full exterior wash. Driveways run $100 to $200 depending on size. UpTend offers transparent pricing with no hidden fees. Ask George for an instant quote.

## Common Mistakes to Avoid

1. **Using too much pressure on soft surfaces.** Wood and vinyl siding can be destroyed by excessive PSI. Always match pressure to the surface.
2. **Skipping the soft wash on roofs.** High pressure will void your shingle warranty and cause leaks.
3. **Ignoring runoff.** Chemical runoff into storm drains violates local environmental regulations.
4. **DIY without safety gear.** Pressure washers can cause serious injury. Wear closed-toe shoes and eye protection at minimum.

## When to Call a Pro

If you have a two-story home, delicate surfaces, or you are not comfortable on a ladder, hire a professional. The cost difference between DIY and pro is smaller than most people think, and the liability risk of damaging your home is real.`,
  },
  "hurricane-prep-home-checklist": {
    slug: "hurricane-prep-home-checklist",
    title: "Hurricane Season Home Prep: The Complete Orlando Checklist",
    date: "February 24, 2026",
    author: "George",
    content: `Hurricane season runs June 1 through November 30 in Florida, and Central Orlando is not immune to major storms. Preparation is not optional. It is the difference between minor inconvenience and major property damage.

## Before the Season (May)

- **Inspect your roof.** Look for missing or damaged shingles, cracked flashing, and deteriorating sealant around vents and pipes.
- **Clean your gutters.** Clogged gutters cause water to back up under your roof during heavy rain. This is damage prevention, not just maintenance.
- **Trim trees and remove dead branches.** Anything within 10 feet of your home or power lines is a projectile in high winds.
- **Test your sump pump and check drainage.** Make sure water flows away from your foundation.
- **Stock hurricane supplies.** Water (1 gallon per person per day for 7 days), non-perishable food, batteries, flashlights, first aid kit, important documents in a waterproof container.

## When a Storm Is Approaching (48-72 Hours Out)

- **Install hurricane shutters or plywood.** If you have impact windows, you are already covered.
- **Secure outdoor furniture, grills, and decorations.** If it can fly, it will fly.
- **Fill your vehicles with gas.** Stations run out fast after an announcement.
- **Photograph your property.** Document the condition of your home for insurance purposes before the storm hits.
- **Charge all devices and portable batteries.**

## After the Storm

- **Do not return until authorities say it is safe.**
- **Document all damage with photos and video before touching anything.** This is critical for insurance claims.
- **Avoid downed power lines and standing water.**
- **Contact your insurance company immediately.**
- **Book cleanup and repair through UpTend.** George can help you assess damage and connect with verified pros for tree removal, roof tarping, and debris cleanup.

Preparation costs a fraction of what recovery costs. Start early and do not wait until the first named storm.`,
  },
  "gutter-cleaning-frequency": {
    slug: "gutter-cleaning-frequency",
    title: "How Often Should You Clean Your Gutters in Florida?",
    date: "February 24, 2026",
    author: "George",
    content: `The short answer: at least twice a year. The real answer depends on your property.

## The Florida Factor

Florida's combination of heavy rainfall (50+ inches annually), fast-growing vegetation, and subtropical pollen means gutters clog faster here than almost anywhere else in the country. Add oak trees, pine needles, or palm fronds to the mix and you might need quarterly cleanings.

## Recommended Schedule

- **Minimum**: Twice a year (once in spring (before rainy season) and once in fall after leaf drop).
- **If you have overhanging trees**: Three to four times per year.
- **After any major storm**: Check and clear gutters within 48 hours.

## What Happens When You Skip It

Clogged gutters are not just an aesthetic problem. They cause:

- **Fascia and soffit rot** from standing water.
- **Foundation damage** from water pooling at the base of your home.
- **Mosquito breeding** in stagnant water.
- **Roof leaks** when water backs up under shingles.
- **Landscape erosion** from uncontrolled water overflow.

In Florida, water damage from clogged gutters is one of the most common, and most preventable, home insurance claims.

## What It Costs

For a typical Orlando home, gutter cleaning runs $150 to $250 depending on home size and gutter accessibility. Two-story homes cost more due to ladder work and safety requirements.

## DIY or Pro?

Single-story homes with accessible gutters can be DIY-friendly if you are comfortable on a ladder and have the right tools. Two-story homes should always be handled by a professional. Ladder falls are the number one cause of home maintenance injuries.

Book a gutter cleaning through UpTend and George will have a certified pro at your door within days. Every job includes downspout flushing and a post-clean photo report.`,
  },
  "first-time-homeowner-mistakes": {
    slug: "first-time-homeowner-mistakes",
    title: "7 Maintenance Mistakes First-Time Homeowners Make",
    date: "February 24, 2026",
    author: "George",
    content: `Buying your first home is exciting. Maintaining it is where reality sets in. Here are the seven most common mistakes first-time Orlando homeowners make. And how to avoid them.

## 1. Ignoring the HVAC Filter

Your AC runs nearly year-round in Florida. A clogged filter makes it work harder, drives up your electric bill, and shortens the system's lifespan. Change it every 30 to 60 days. Set a calendar reminder. This is the single cheapest maintenance task that saves the most money.

## 2. Skipping Gutter Maintenance

Out of sight, out of mind. Until water is pouring down your walls. Clean your gutters twice a year minimum in Florida. Neglected gutters cause fascia rot, foundation problems, and roof leaks.

## 3. Not Knowing Where the Water Shutoff Is

When a pipe bursts at 2 AM, you need to know where the main shutoff valve is. Find it now, not during an emergency. Test it to make sure it actually works.

## 4. Deferring Small Repairs

That small crack in the stucco, that slow drip under the sink, that toilet that runs for 30 seconds after flushing. These are all cheap fixes now and expensive problems later. Fix small issues the week you notice them.

## 5. No Maintenance Calendar

Home maintenance is not something you can wing. Without a schedule, things get missed. Use a calendar app, a spreadsheet, or a platform like UpTend that tracks your home's maintenance history and reminds you when things are due.

## 6. Hiring the Cheapest Contractor

The lowest bid is rarely the best value. Unlicensed, uninsured contractors cut corners and leave you with no recourse when things go wrong. Always verify licensing and insurance before hiring anyone.

## 7. Not Documenting Your Home

Keep records of every repair, every appliance purchase, every service visit. This documentation is invaluable for insurance claims, home resale, and warranty coverage. UpTend's Home DNA feature does this automatically. George tracks every service event and builds a living record of your home.

Start building good habits now and your home will thank you for decades.`,
  },
  "diy-vs-pro-when-to-call": {
    slug: "diy-vs-pro-when-to-call",
    title: "DIY vs. Hiring a Pro: How to Know When It's Time to Call",
    date: "February 24, 2026",
    author: "George",
    content: `There is a time for YouTube tutorials and a time for picking up the phone. Knowing the difference saves you money, time, and potentially your safety.

## Good DIY Projects

These are tasks most homeowners can handle with basic tools and a tutorial:

- **Replacing light fixtures and switches** (with the breaker off)
- **Caulking bathtubs and windows**
- **Patching small drywall holes**
- **Painting interior rooms**
- **Replacing toilet flappers and fill valves**
- **Installing shelving and curtain rods**
- **Basic landscaping and mulching**

## Call a Pro For These

These projects involve safety risks, licensing requirements, or expertise that justifies professional help:

- **Electrical work beyond basic fixtures**. Anything involving your breaker panel, new circuits, or 240V connections requires a licensed electrician.
- **Plumbing beyond simple fixes**. Water heater replacement, re-piping, and slab leak repair are not DIY territory.
- **Roof work**. Falls from roofs are a leading cause of homeowner injuries. Plus, improper repairs void warranties.
- **HVAC repairs**. Refrigerant handling requires EPA certification. DIY AC work often causes more damage.
- **Structural modifications**. Removing walls, adding windows, or modifying load-bearing elements requires engineering assessment.
- **Tree removal**. Anything taller than you can reach from the ground should be handled by a licensed arborist.

## The Cost Calculation

Before going DIY, add up: tool costs, material costs, your time (value it honestly), and the risk cost if you mess it up. Many projects that seem cheaper to DIY end up costing more after a professional has to fix the DIY attempt.

## When in Doubt, Ask George

Not sure if your project is DIY-friendly? Send a photo to George. He will tell you whether it is a weekend project or a call-a-pro situation. and if you need a pro, he will get you a quote in seconds.`,
  },
  "pool-maintenance-basics-florida": {
    slug: "pool-maintenance-basics-florida",
    title: "Pool Maintenance 101: A Florida Homeowner's Guide",
    date: "February 24, 2026",
    author: "George",
    content: `Owning a pool in Florida is practically a lifestyle requirement. Maintaining one is where the work comes in. Here is what every Florida pool owner needs to know.

## Weekly Maintenance

- **Skim the surface** for leaves and debris.
- **Brush the walls and floor** to prevent algae buildup.
- **Vacuum** the pool or run your automatic cleaner.
- **Test water chemistry**: pH (7.2-7.6), chlorine (1-3 ppm), alkalinity (80-120 ppm).
- **Empty skimmer and pump baskets.**

## Monthly Maintenance

- **Shock the pool** with a higher dose of chlorine to kill bacteria and algae spores.
- **Clean the filter** (backwash for sand/DE filters, rinse for cartridge).
- **Check water level**. Florida evaporation and rain can cause significant fluctuations.
- **Inspect equipment** for leaks, unusual noises, or reduced flow.

## Seasonal Considerations

Florida pools run year-round, but summer demands more attention:

- **Summer**: Heavier use means more frequent chemical adjustments. Test twice a week.
- **Hurricane season**: Remove loose items from the pool area before storms. Never drain your pool for a hurricane. the ground pressure can crack an empty shell.
- **Winter**: Reduce pump run time since algae grows slower in cooler water.

## What It Costs

- **DIY chemicals and supplies**: $50 to $100 per month.
- **Professional weekly service**: $99 to $210 per month depending on pool size and service level.
- **Equipment repairs**: Pump replacement runs $400 to $800. Heater repair runs $200 to $600.

## DIY or Service?

If you have the time and discipline for weekly testing and cleaning, DIY pool maintenance is straightforward. If you travel frequently, have a busy schedule, or just want peace of mind, a monthly service plan is worth every dollar.

Need a pool service recommendation? Ask George. he will find a verified pro in your area and get you a quote instantly.`,
  },
  "junk-removal-cost-orlando": {
    slug: "junk-removal-cost-orlando",
    title: "How Much Does Junk Removal Cost in Orlando? (2026 Pricing Guide)",
    date: "February 24, 2026",
    author: "George",
    content: `Whether you are decluttering, moving, or dealing with a property cleanout, knowing what junk removal costs in Orlando helps you budget and avoid overpaying.

## Average Pricing (2026)

- **Single item pickup**: $49 to $99 (couch, mattress, appliance)
- **Quarter truck load**: $99 to $199
- **Half truck load**: $199 to $299
- **Full truck load**: $299 to $499
- **Whole house cleanout**: $500 to $2,000+ depending on volume

## What Affects the Price?

1. **Volume**: The biggest factor. Most companies price by how much space your items take in the truck.
2. **Weight**: Heavy items like concrete, dirt, or appliances may carry surcharges.
3. **Accessibility**: Items on the second floor, in a tight basement, or far from truck access cost more due to labor.
4. **Item type**: Hazardous materials (paint, chemicals), electronics, and tires often have special disposal fees.
5. **Location**: Prices vary slightly across Orlando neighborhoods.

## What Is Typically Included?

- Loading and hauling
- Sorting for recycling and donation
- Responsible disposal with documentation
- Basic sweep of the area after removal

## What Is NOT Included?

- Hazardous waste removal (requires specialized service)
- Demolition (tearing down structures, removing built-ins)
- Hoarding situations (require specialized assessment)

## How to Save Money

- **Consolidate items** in one area before the crew arrives to minimize labor time.
- **Separate recyclables and donations** yourself if you have time.
- **Book during weekdays** when demand is lower.
- **Bundle services**. booking junk removal with pressure washing or cleaning often saves 10 to 15 percent.

## Get an Instant Quote

Skip the phone calls and waiting. Ask George for a junk removal quote. he will price it in seconds based on your description or photos, and every price comes with our price ceiling guarantee.`,
  },
};

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const post = posts[slug || ""];

  if (!post) return <NotFound />;

  // Simple markdown-like rendering: ## headers and paragraphs
  const renderContent = (content: string) => {
    const lines = content.split("\n");
    const elements: React.ReactNode[] = [];
    let currentParagraph: string[] = [];
    let listItems: string[] = [];
    let orderedItems: string[] = [];

    const flushParagraph = () => {
      if (currentParagraph.length > 0) {
        const text = currentParagraph.join(" ");
        elements.push(
          <p key={elements.length} className="text-slate-700 leading-relaxed mb-4" dangerouslySetInnerHTML={{ __html: text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\*(.*?)\*/g, "<em>$1</em>") }} />
        );
        currentParagraph = [];
      }
    };

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={elements.length} className="list-disc pl-6 mb-4 space-y-2">
            {listItems.map((item, i) => (
              <li key={i} className="text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\*(.*?)\*/g, "<em>$1</em>") }} />
            ))}
          </ul>
        );
        listItems = [];
      }
    };

    const flushOrdered = () => {
      if (orderedItems.length > 0) {
        elements.push(
          <ol key={elements.length} className="list-decimal pl-6 mb-4 space-y-2">
            {orderedItems.map((item, i) => (
              <li key={i} className="text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\*(.*?)\*/g, "<em>$1</em>") }} />
            ))}
          </ol>
        );
        orderedItems = [];
      }
    };

    for (const line of lines) {
      if (line.startsWith("## ")) {
        flushParagraph();
        flushList();
        flushOrdered();
        elements.push(
          <h2 key={elements.length} className="text-2xl font-bold text-slate-900 mt-8 mb-4">{line.slice(3)}</h2>
        );
      } else if (line.startsWith("- **") || line.startsWith("- ")) {
        flushParagraph();
        flushOrdered();
        listItems.push(line.slice(2));
      } else if (/^\d+\.\s/.test(line)) {
        flushParagraph();
        flushList();
        orderedItems.push(line.replace(/^\d+\.\s/, ""));
      } else if (line.trim() === "") {
        flushParagraph();
        flushList();
        flushOrdered();
      } else {
        flushList();
        flushOrdered();
        currentParagraph.push(line);
      }
    }
    flushParagraph();
    flushList();
    flushOrdered();

    return elements;
  };

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>{post.title} | UpTend Blog</title>
        <meta name="description" content={post.content.slice(0, 160)} />
        <link rel="canonical" href={`https://uptendapp.com/blog/${post.slug}`} />
      </Helmet>

      <Header />

      <article className="max-w-3xl mx-auto px-4 pt-28 pb-16">
        <nav className="text-sm text-gray-500 mb-8">
          <Link href="/blog" className="hover:text-orange-600">&larr; Back to Blog</Link>
        </nav>

        <time className="text-sm text-gray-500">{post.date}</time>
        <p className="text-sm text-gray-500 mb-2">By {post.author}</p>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-8">{post.title}</h1>

        {renderContent(post.content)}

        <hr className="my-8" />
        <p className="text-sm text-gray-500 italic">
          Have questions about home maintenance in Orlando? Visit{" "}
          <a href="https://uptendapp.com" className="text-orange-600 hover:underline">uptendapp.com</a> and ask George,
          our AI home services assistant.
        </p>
      </article>

      <Footer />
    </div>
  );
}
