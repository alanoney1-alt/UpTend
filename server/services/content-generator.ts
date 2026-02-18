/**
 * Content Generator — George-branded DIY review content
 * Creates multi-platform content for UpTend's social media presence
 */

export interface DIYReviewContent {
  videoTitle: string;
  category: string;
  instagram: {
    slides: [string, string, string, string, string]; // Hook, Right, Missed, ProTip, CTA
  };
  tiktok: {
    caption: string;
    hashtags: string[];
  };
  youtubeShorts: {
    description: string;
  };
}

const CTA = 'Too big for DIY? George can book a pro in 60 seconds → uptendapp.com';

interface TopicContent {
  hook: string;
  right: string;
  missed: string;
  proTip: string;
  tiktokCaption: string;
  hashtags: string[];
  youtubeDesc: string;
}

const TOPIC_TEMPLATES: Record<string, TopicContent> = {
  'Running toilet fix': {
    hook: '🚽 Your toilet is literally flushing money down the drain. A running toilet wastes up to 200 gallons a DAY. Let\'s fix that.',
    right: '✅ Most DIY videos nail the basics: check the flapper, adjust the float, inspect the fill valve. These cover 90% of running toilets.',
    missed: '⚠️ What they skip: the flush valve seat. If it\'s corroded or has mineral buildup, a new flapper won\'t seal properly. Also — that hairline crack in the overflow tube? Yeah, that\'ll keep running forever.',
    proTip: '💡 George\'s Pro Tip: Before replacing anything, put food coloring in the tank. Wait 15 min. If color appears in the bowl without flushing, it\'s definitely the flapper. Save yourself a trip to the hardware store.',
    tiktokCaption: 'Your running toilet is wasting 200 gal/day 💸 Here\'s what DIY videos miss',
    hashtags: ['#DIY', '#PlumbingTips', '#HomeRepair', '#RunningToilet', '#UpTend', '#GeorgeKnows', '#SaveWater'],
    youtubeDesc: 'Running toilet? George breaks down what most DIY videos get right — and the one thing they ALL miss. Fix it yourself or let George book a pro.',
  },
  'Clogged drain': {
    hook: '🔧 Before you pour chemicals down that drain, STOP. There\'s a better way, and it won\'t destroy your pipes.',
    right: '✅ Good advice out there: try a plunger first, use a drain snake, and baking soda + vinegar can help with minor clogs.',
    missed: '⚠️ What they miss: chemical drain cleaners eat through old pipes. And if you have a garbage disposal clog, snaking from the wrong end just pushes it deeper.',
    proTip: '💡 George\'s Pro Tip: Wet/dry shop vac on the drain opening. Seal it tight. The suction pulls clogs out instead of pushing them in. Game changer.',
    tiktokCaption: 'PUT DOWN the drain chemicals 🛑 This trick actually works',
    hashtags: ['#DIY', '#CloggedDrain', '#PlumbingHack', '#HomeRepair', '#UpTend', '#GeorgeKnows'],
    youtubeDesc: 'Clogged drain? George shares the pro trick that works better than chemicals — and won\'t wreck your pipes.',
  },
  'Squeaky door hinge': {
    hook: '🚪 That squeaky door is driving everyone crazy. 30-second fix, zero tools needed.',
    right: '✅ WD-40 on the hinge? Sure, it works... for about a week. Most videos show the spray-and-pray method.',
    missed: '⚠️ What they miss: WD-40 is a solvent, not a lubricant. It\'ll dry out and the squeak comes back. Also, if the hinge pin is bent or worn, no amount of lube fixes that.',
    proTip: '💡 George\'s Pro Tip: Pull the hinge pin, coat it in white lithium grease or petroleum jelly, tap it back in. That\'s a permanent fix. Takes 2 minutes.',
    tiktokCaption: 'WD-40 on a squeaky door? WRONG. Here\'s the real fix 🚪',
    hashtags: ['#DIY', '#SqueakyDoor', '#HomeHack', '#QuickFix', '#UpTend', '#GeorgeKnows'],
    youtubeDesc: 'Squeaky door? Stop using WD-40. George shows the 2-minute permanent fix the pros use.',
  },
  'Replace light switch': {
    hook: '⚡ Replacing a light switch is easier than you think. But skip one step and it gets dangerous fast.',
    right: '✅ Good videos show: turn off the breaker, test with a voltage tester, match wires to the new switch. Solid basics.',
    missed: '⚠️ What they miss: ALWAYS test BOTH sides of the switch with a non-contact voltage tester. Mislabeled breaker panels are way more common than you\'d think. Also — backstab connections (push-in) loosen over time. Use the screw terminals.',
    proTip: '💡 George\'s Pro Tip: Take a photo of the old wiring BEFORE you disconnect anything. Future you will thank present you. And wrap your connections with electrical tape over the wire nuts.',
    tiktokCaption: 'Replacing a light switch? This mistake could shock you ⚡',
    hashtags: ['#DIY', '#Electrical', '#LightSwitch', '#HomeSafety', '#UpTend', '#GeorgeKnows'],
    youtubeDesc: 'Light switch replacement made easy — plus the safety step most DIY videos skip. George keeps it real.',
  },
  'Patch drywall hole': {
    hook: '🕳️ That hole in the wall isn\'t going to fix itself. Good news: you don\'t need a contractor for this one.',
    right: '✅ Most tutorials cover it well: California patch method, mesh tape, joint compound, sand and paint. Classic.',
    missed: '⚠️ What they miss: matching the existing texture. A smooth patch on an orange-peel wall screams "I did this myself." Also, most people don\'t prime before painting — and the patch soaks up paint differently.',
    proTip: '💡 George\'s Pro Tip: For small holes, use a setting-type compound (the powder you mix) instead of pre-mixed. It doesn\'t shrink, so you need fewer coats. For texture matching, practice on cardboard first.',
    tiktokCaption: 'Patching drywall? Everyone forgets THIS step 🕳️',
    hashtags: ['#DIY', '#DrywallRepair', '#HomeRepair', '#WallFix', '#UpTend', '#GeorgeKnows'],
    youtubeDesc: 'Drywall hole? George shows you the pro patch method — plus the texture-matching trick most DIYers miss.',
  },
  'Clean dryer vent': {
    hook: '🔥 18,000 house fires a year start in the dryer vent. When\'s the last time you cleaned yours?',
    right: '✅ Good advice: disconnect the vent, use a dryer vent brush kit, clean both ends, check the exterior flap. Basic but important.',
    missed: '⚠️ What they miss: the transition hose (that flexible piece behind the dryer) is where most lint builds up. And if you have a long vent run or multiple elbows, a brush kit won\'t cut it — you need a drill-powered rotary brush.',
    proTip: '💡 George\'s Pro Tip: After cleaning, run the dryer empty on high heat for 10 minutes. Feel the airflow at the exterior vent. If it\'s weak, there\'s still a blockage. Also — replace foil/vinyl transition hoses with rigid aluminum. They don\'t trap lint.',
    tiktokCaption: '18,000 house fires start HERE. Clean your dryer vent 🔥',
    hashtags: ['#DIY', '#DryerVent', '#FireSafety', '#HomeMaintenance', '#UpTend', '#GeorgeKnows'],
    youtubeDesc: 'Dryer vent cleaning: George shows what the basics miss — and why this is the one maintenance task you can\'t skip.',
  },
  'Fix leaky faucet': {
    hook: '💧 Drip. Drip. Drip. That leaky faucet is costing you $20/month in wasted water. Let\'s fix it for $5.',
    right: '✅ Standard advice works: replace the washer or cartridge, check the O-rings, make sure the seat isn\'t damaged. Covers most leaks.',
    missed: '⚠️ What they miss: identifying your faucet type FIRST. Ball, cartridge, disc, or compression — each has different parts. Buying a "universal repair kit" wastes money. Also, if the valve seat is pitted, a new washer will leak again in weeks.',
    proTip: '💡 George\'s Pro Tip: Take the old cartridge to the hardware store to match it exactly. Or snap a photo of the faucet brand/model (usually under the handle or on the base). Most manufacturers will send you parts for free under warranty.',
    tiktokCaption: 'That dripping faucet costs $20/month 💧 $5 fix right here',
    hashtags: ['#DIY', '#LeakyFaucet', '#PlumbingFix', '#SaveMoney', '#UpTend', '#GeorgeKnows'],
    youtubeDesc: 'Leaky faucet? George breaks down the $5 fix — and the mistake that makes it leak again in a month.',
  },
  'Replace toilet flapper': {
    hook: '🚽 The #1 easiest plumbing fix in your house takes 5 minutes and costs $4. No excuses.',
    right: '✅ Turn off water, flush to empty, unhook old flapper, hook on new one. Every video gets this right — because it really is that simple.',
    missed: '⚠️ What they miss: flappers aren\'t universal! Kohler, American Standard, and Toto all use different sizes. A "universal" flapper from the hardware store might not seal properly. Also — clean the flush valve seat with a Scotch-Brite pad before installing.',
    proTip: '💡 George\'s Pro Tip: Write your toilet brand and model inside the tank lid with a Sharpie. Next time you need parts, you\'ll know exactly what to buy without crawling behind the toilet.',
    tiktokCaption: '$4 and 5 minutes saves you hundreds on your water bill 🚽',
    hashtags: ['#DIY', '#ToiletRepair', '#PlumbingTips', '#EasyFix', '#UpTend', '#GeorgeKnows'],
    youtubeDesc: 'Toilet flapper replacement: the easiest $4 fix in plumbing. George shows you the one detail that makes it actually work.',
  },
  'Unclog garbage disposal': {
    hook: '😤 Garbage disposal humming but not spinning? DON\'T stick your hand in there. Here\'s what to do.',
    right: '✅ Good videos show: hit the reset button underneath, use an Allen wrench in the bottom hole to manually turn the blades. Both solid first steps.',
    missed: '⚠️ What they miss: if it\'s a grease clog (not a jam), the Allen wrench trick won\'t help. You need to disconnect the drain and clean the trap. Also — running hot water with grease actually makes it worse. Cold water solidifies grease so the disposal can chop it.',
    proTip: '💡 George\'s Pro Tip: Ice cubes + salt + cold water. Run the disposal with a cup of ice and coarse salt. It scrubs the blades and walls clean. Do this monthly and you\'ll never have a smell problem.',
    tiktokCaption: 'Disposal stuck? Don\'t stick your hand in there 😤 Do THIS instead',
    hashtags: ['#DIY', '#GarbageDisposal', '#KitchenHack', '#HomeRepair', '#UpTend', '#GeorgeKnows'],
    youtubeDesc: 'Garbage disposal jammed? George shares the safe fix — plus the monthly maintenance trick that prevents clogs.',
  },
  'Install smart thermostat': {
    hook: '🌡️ A smart thermostat saves $150/year on energy. But install it wrong and you could fry your HVAC system.',
    right: '✅ Most videos cover: turn off HVAC at breaker, label your wires, match to new thermostat terminals. Good foundation.',
    missed: '⚠️ What they miss: the C-wire problem. Many older homes don\'t have a common wire, and your smart thermostat NEEDS power. Using the fan wire as a workaround can damage your system. Also — if you have a heat pump, the wiring is completely different from standard HVAC.',
    proTip: '💡 George\'s Pro Tip: Before buying, pop off your current thermostat and count the wires. Take a photo. Most smart thermostat brands have a compatibility checker on their website. Five minutes of checking saves a $200 mistake.',
    tiktokCaption: 'Smart thermostat install? Check THIS before you buy 🌡️',
    hashtags: ['#DIY', '#SmartHome', '#Thermostat', '#EnergySaving', '#UpTend', '#GeorgeKnows', '#HVAC'],
    youtubeDesc: 'Smart thermostat installation: George explains the C-wire problem and how to avoid frying your HVAC. Check compatibility first!',
  },
};

/**
 * Generate George-branded review content for a DIY video topic
 */
export function generateDIYReview(videoTitle: string, category: string): DIYReviewContent {
  const template = TOPIC_TEMPLATES[videoTitle];

  if (template) {
    return {
      videoTitle,
      category,
      instagram: {
        slides: [
          template.hook,
          template.right,
          template.missed,
          template.proTip,
          `📱 ${CTA}\n\nSave this for later — your home will thank you. 🏠`,
        ],
      },
      tiktok: {
        caption: template.tiktokCaption,
        hashtags: template.hashtags,
      },
      youtubeShorts: {
        description: `${template.youtubeDesc}\n\n${CTA}`,
      },
    };
  }

  // Fallback for unknown topics
  return {
    videoTitle,
    category,
    instagram: {
      slides: [
        `🔧 DIY "${videoTitle}"? Let's talk about what the internet gets right — and what they miss.`,
        `✅ The basics are solid: most tutorials walk you through the standard approach. Good starting point for beginners.`,
        `⚠️ But here's what they skip: the edge cases, the "what if it doesn't work" scenarios, and the parts that need a trained eye.`,
        `💡 George's Pro Tip: When in doubt, take photos before you start, buy quality parts (not the cheapest option), and know your limits.`,
        `📱 ${CTA}\n\nSave this for later — your home will thank you. 🏠`,
      ],
    },
    tiktok: {
      caption: `DIY ${videoTitle}? Here's what they don't tell you 🔧`,
      hashtags: ['#DIY', '#HomeRepair', '#UpTend', '#GeorgeKnows', `#${category}`],
    },
    youtubeShorts: {
      description: `${videoTitle} — George reviews the top DIY advice and shares what the pros actually do.\n\n${CTA}`,
    },
  };
}
