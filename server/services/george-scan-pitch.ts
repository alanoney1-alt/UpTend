/**
 * George Home Scan Sales Pitch & FAQ
 *
 * Educational, value-driven content George uses when introducing
 * the Self-Serve Home Scan to homeowners. Tone: friendly neighbor, not salesman.
 */

export interface HomeScanPitch {
  intro: string;
  valueProps: Array<{ title: string; pitch: string }>;
  closingHook: string;
  creditsBreakdown: string;
}

export interface HomeScanFAQItem {
  question: string;
  answer: string;
}

export function getHomeScanPitch(): HomeScanPitch {
  return {
    intro:
      `Think of it like a medical record for your home. Every system, every appliance — documented with photos, conditions, and maintenance history. Except instead of costing you money, you actually *earn* credits for doing it. Let me explain why thousands of homeowners are scanning their homes with UpTend.`,

    valueProps: [
      {
        title: "Home Health Record",
        pitch:
          "Right now, everything about your home lives in your head — or worse, in a junk drawer full of receipts. A Home Scan gives you a single, organized record of every system in your house: HVAC, water heater, roof, appliances, plumbing, electrical — all documented with photos and condition notes. Like a Carfax, but for your home.",
      },
      {
        title: "Insurance Protection",
        pitch:
          "Here's something most people don't think about until it's too late: when disaster strikes, you need to prove what you had and what condition it was in BEFORE the damage. Your Home Scan gives you timestamped photo evidence of every appliance and system. Insurance companies love documentation — and you'll love having it when you need to file a claim.",
      },
      {
        title: "Warranty Tracking",
        pitch:
          "How many warranties have you lost track of? Most homeowners have thousands of dollars in active warranties they forget about. Once Mr. George knows your appliances, he tracks when warranties expire and alerts you before they do. No more losing $500 on a repair that was still covered.",
      },
      {
        title: "Preventive Savings",
        pitch:
          "Homes with documented maintenance histories save $3,000 to $5,000 a year — that's not a guess, that's what happens when you catch a small roof leak before it becomes a $15,000 problem, or replace an HVAC filter before it burns out your compressor. George watches for the small stuff so you never get hit with the big stuff.",
      },
      {
        title: "Resale Value",
        pitch:
          "When it's time to sell, a fully documented home sells 3-5% higher. Think about that on a $400K home — that's $12,000 to $20,000 more in your pocket. Buyers trust what they can verify, and a complete home health record tells them this house was taken care of.",
      },
      {
        title: "Smart Maintenance",
        pitch:
          "Once Mr. George knows your home, he gets proactive. He'll tell you exactly when your HVAC filter needs changing, when your water heater is approaching end-of-life, when your roof needs attention — all based on YOUR actual equipment, not generic advice. It's like having a building superintendent who never sleeps.",
      },
      {
        title: "Emergency Readiness",
        pitch:
          "If a pipe bursts at 2AM, you don't want to be Googling plumbers in a panic. Mr. George already knows your plumbing system, your shutoff valve locations, and which licensed pro to call. He'll even have your home layout ready so the pro knows what they're walking into.",
      },
      {
        title: "It's FREE + You Earn Credits",
        pitch:
          "This is the part that surprises people: the scan is completely free. And you actually earn $25 just for completing it, plus $1 for every appliance you document. Most homeowners walk away with $40-50 in credits toward their first service. You're literally getting paid to get organized.",
      },
      {
        title: "Takes 15-20 Minutes",
        pitch:
          "Walk room to room, snap photos of your systems and appliances, and Mr. George does the rest. He identifies everything, estimates ages and conditions, and builds your complete home profile. Most people finish in about 15 minutes — less time than a Netflix episode.",
      },
      {
        title: "Privacy-First",
        pitch:
          "Your data is yours. Period. We never sell it. You can delete everything anytime you want. The photos stay in your account, and George only uses them to help YOU take better care of YOUR home.",
      },
    ],

    closingHook:
      "So here's the deal: it's free, it takes 15 minutes, you earn credits, and you'll have the most complete record of your home that exists anywhere. There's really no downside. Want to start your scan?",

    creditsBreakdown:
      "$25 base reward for completing your scan + $1 per appliance/system documented. Most homes have 15-25 documentable items, so you're looking at $40-$50 in credits. Credits go toward any UpTend service — cleaning, handyman, landscaping, you name it.",
  };
}

export function getHomeScanFAQ(): HomeScanFAQItem[] {
  return [
    {
      question: "What exactly is a Home Scan?",
      answer:
        "It's a self-guided walkthrough of your home where you take photos of your major systems and appliances — HVAC, water heater, electrical panel, appliances, roof (from the ground), plumbing fixtures, etc. Mr. George's AI analyzes everything and builds a complete home health profile with estimated ages, conditions, and maintenance recommendations.",
    },
    {
      question: "How much does it cost?",
      answer:
        "The self-serve scan is completely free. You just walk around and take photos with your phone. We also offer a Pro Scan ($99) where a certified pro comes to your home and does a thorough in-person scan, and a Drone Scan ($249) that adds aerial roof and exterior photography with an FAA-licensed drone operator.",
    },
    {
      question: "How long does it take?",
      answer:
        "Most homeowners complete the self-serve scan in 15-20 minutes. Just walk room to room and follow Mr. George's prompts. He'll tell you exactly what to photograph in each area. The Pro Scan takes about 60-90 minutes, and the Drone Scan adds about 30 minutes on top of that.",
    },
    {
      question: "How do the credits work?",
      answer:
        "You earn $25 just for completing your scan, plus $1 for every appliance or system you document. Most homes have 15-25 items, so you'll typically earn $40-50 in credits. Credits can be used toward any UpTend service and are valid for 12 months.",
    },
    {
      question: "How accurate is the AI analysis?",
      answer:
        "Mr. George's AI is pretty good at identifying equipment and estimating ages and conditions from photos, but it's not perfect — and we're upfront about that. Think of it as a knowledgeable friend giving you their best assessment, not a certified inspection. For big decisions, we always recommend getting a professional evaluation.",
    },
    {
      question: "Is this a home inspection?",
      answer:
        "No — and that's an important distinction. A Home Scan is an informational tool that documents your home's visible systems and provides AI-assisted analysis. It's not a licensed home inspection and shouldn't be used as a substitute for one, especially for real estate transactions. Think of it as your home's ongoing health record, not a one-time inspection report.",
    },
    {
      question: "What happens to my photos and data?",
      answer:
        "Your photos and scan data are stored securely in your UpTend account. We use them to build your home profile, provide maintenance recommendations, and match you with the right service providers when you need help. We never sell your data. You can request full deletion at any time through your account settings or by contacting support.",
    },
    {
      question: "Can I scan a home I'm renting?",
      answer:
        "You can scan a rental with the property owner's permission. The scan is tied to your UpTend account, so it follows you — which is actually great for keeping track of the condition when you moved in. Just make sure you have the right to photograph the property.",
    },
    {
      question: "What if George gets something wrong?",
      answer:
        "You can correct any of Mr. George's assessments directly in your home profile. If he misidentifies an appliance or gets the age wrong, just tap to edit. The more you correct, the smarter he gets — both for your home and for future scans. And remember, all AI estimates are approximate. For anything critical, we'll connect you with a pro.",
    },
    {
      question: "Do I need to scan everything at once?",
      answer:
        "Nope! You can start a scan, save your progress, and pick it back up whenever you want. Some people do the whole house in one go, others do a few rooms at a time over a couple of days. You'll earn your credits once you've completed the full scan. Mr. George will keep track of what you've covered and what's left.",
    },
  ];
}

/**
 * Combined pitch + FAQ for Mr. George's tool response.
 */
export function getHomeScanInfo(): { pitch: HomeScanPitch; faq: HomeScanFAQItem[] } {
  return {
    pitch: getHomeScanPitch(),
    faq: getHomeScanFAQ(),
  };
}
