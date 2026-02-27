import { usePageTitle } from "@/hooks/use-page-title";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  ShieldCheck, DollarSign, TrendingUp, AlertTriangle,
  ArrowRight, ArrowLeft, CheckCircle, GraduationCap, Lock,
  Droplets, Home as HomeIcon, Hammer, Move, Trash2,
  Search, UserCheck, Star, Clock, Shield, MessageCircle,
} from "lucide-react";
import { useLocation, Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

interface AcademyModule {
  id: string;
  skillType: string;
  title: string;
  icon: any;
  iconColor: string;
  required: boolean;
  description: string;
  lessons: string[];
  quiz: QuizQuestion[];
}

const MODULES: AcademyModule[] = [
  {
    id: "core_safety",
    skillType: "core_safety",
    title: "Customer Safety (Core)",
    icon: ShieldCheck,
    iconColor: "text-primary",
    required: true,
    description: "Required for all Pros. Learn professional standards, safety codes, customer interaction protocols, and how to use George. your AI co-pilot.",
    lessons: [
      "Always wear a collared shirt or UpTend gear. Introduce yourself by name.",
      "Display your Safety Code to the customer before starting any work.",
      "Never negotiate cash. All payments go through the app.",
      "Zero tolerance: No harassment, no illegal dumping, no sharing personal contact info.",
      "Use the app's tracking and photo documentation features on every job. they protect you.",
      "If the scope of work changes, always submit a scope adjustment through the app before proceeding.",
      "George is your AI co-pilot. Ask him pricing questions, job tips, or customer communication help anytime.",
      "Use George to generate professional messages to customers about delays, scope changes, or completion updates.",
      "After completing a job, ask George to help you document the work for your ESG impact record.",
    ],
    quiz: [
      {
        question: "A customer opens the door. What is the correct professional greeting?",
        options: [
          "Where's the stuff?",
          "Hi, I'm [Name] with UpTend. Here's my Safety Code. I'm here to help today.",
          "Hey, someone called about a job?",
          "Start working without introducing yourself to save time",
        ],
        correct: 1,
        explanation: "First impressions matter. Introduce yourself by name, mention UpTend, and display your Safety Code before starting any work.",
      },
      {
        question: "The customer offers to pay you $200 cash directly to skip the platform fee. What do you do?",
        options: [
          "Accept the cash. it's more money for you",
          "Accept but report it in the app later",
          "Politely decline and explain all payments must go through the app",
          "Ask them to Venmo you instead",
        ],
        correct: 2,
        explanation: "Cash deals void your insurance coverage, remove payout protection, and result in an instant permanent ban from the platform. All payments must go through the app.",
      },
      {
        question: "You're running 20 minutes late to a job. What's the correct protocol?",
        options: [
          "Just show up late and apologize when you arrive",
          "Use the app to notify the customer immediately with an updated ETA",
          "Call the customer's personal phone number",
          "Cancel the job to avoid a bad review",
        ],
        correct: 1,
        explanation: "Always communicate delays through the app immediately. Customers can see your ETA, and proactive communication prevents negative reviews and builds trust.",
      },
      {
        question: "A customer disputes the quality of your work and demands a partial refund on the spot. What do you do?",
        options: [
          "Give them cash back from your own pocket",
          "Argue with the customer about the work quality",
          "Stay professional, document the work with photos, and direct them to resolve it through the app's dispute process",
          "Leave immediately without responding",
        ],
        correct: 2,
        explanation: "Never handle refunds yourself. Stay calm, take photos documenting your work, and let the customer know they can open a dispute through the app. The platform mediates all disputes fairly.",
      },
      {
        question: "What does the Green Guarantee badge mean for customers?",
        options: [
          "You only use green-colored equipment",
          "You've verified sustainable disposal practices. documenting where items go for recycling, donation, or proper disposal",
          "You plant a tree after every job",
          "You only work on eco-friendly properties",
        ],
        correct: 1,
        explanation: "The Green Guarantee means you document the full disposal chain. what was recycled, donated, or properly disposed of. This builds customer trust and contributes to your ESG impact record.",
      },
      {
        question: "You're on a job and the customer asks about adding pressure washing to their gutter cleaning booking. What do you do?",
        options: [
          "Quote them a price yourself based on what seems fair",
          "Tell them to book separately through the website",
          "Ask George for the current pricing and scope change process, then walk the customer through it in the app",
          "Call the UpTend office to ask what to charge",
        ],
        correct: 2,
        explanation: "George knows all current pricing and can walk you through the scope change flow. This keeps everything documented and ensures the customer gets the right price.",
      },
    ],
  },
  {
    id: "app_and_george",
    skillType: "app_and_george",
    title: "Using George & The App",
    icon: MessageCircle,
    iconColor: "text-cyan-600 dark:text-cyan-400",
    required: true,
    description: "Required for all Pros. Learn how to use real-time tracking, SafeComms, photo documentation, scope changes, and George. your AI assistant.",
    lessons: [
      "How to use real-time GPS tracking. customers can see your location once you start a job by marking 'On My Way'.",
      "SafeComms chat: All messages go through the app. Phone numbers are auto-redacted for safety.",
      "Photo documentation: Take before/after photos on every job. This protects YOU from disputes.",
      "Scope changes: If the job is bigger than expected, use the app to send a scope adjustment. Customer must approve before you proceed.",
      "George can help you: draft customer messages, check pricing, understand job requirements, track your ESG impact, and troubleshoot issues.",
    ],
    quiz: [
      {
        question: "How does the customer track your arrival to the job site?",
        options: [
          "They can't. they just wait until you knock",
          "GPS tracking starts automatically when you mark 'On My Way' in the app",
          "You text them your location manually",
          "The customer has to call you to ask where you are",
        ],
        correct: 1,
        explanation: "When you tap 'On My Way', real-time GPS tracking activates and the customer can see your live location and ETA. This builds trust and reduces no-show anxiety.",
      },
      {
        question: "You try to send your personal phone number to a customer through the app's chat. What happens?",
        options: [
          "The message sends normally",
          "The message is auto-redacted by SafeComms. phone numbers are blocked for safety",
          "Your account is immediately suspended",
          "The customer receives the number but gets a warning",
        ],
        correct: 1,
        explanation: "SafeComms automatically redacts phone numbers, email addresses, and other personal contact info from chat messages. This protects both you and the customer from off-platform contact.",
      },
      {
        question: "When should you take photos during a job?",
        options: [
          "Only if the customer asks you to",
          "Only after the job is complete",
          "Before AND after every job. documenting initial conditions and finished work",
          "Only when there's visible damage",
        ],
        correct: 2,
        explanation: "Always take before AND after photos on every job. Before photos document pre-existing conditions (protecting you from false damage claims), and after photos verify your work quality.",
      },
      {
        question: "You arrive at a junk removal job and discover there's twice as much stuff as quoted. What do you do?",
        options: [
          "Do the extra work and hope you get tipped well",
          "Refuse to do the job and leave",
          "Submit a scope adjustment through the app and wait for the customer to approve before proceeding",
          "Charge the customer extra cash on the spot",
        ],
        correct: 2,
        explanation: "Always use the app's scope adjustment feature. The customer sees the updated price and must approve before you do additional work. This protects your payout and keeps insurance active.",
      },
      {
        question: "How do you ask George for help while you're on a job?",
        options: [
          "Call the UpTend support hotline and ask for George",
          "Send an email to george@uptend.com",
          "Click the George chat bubble. it's available on every page in the app",
          "You can only access George from a desktop computer",
        ],
        correct: 2,
        explanation: "George is always available via the chat bubble on every page of the app. Ask him about pricing, job tips, customer communication, scope changes, or anything else you need help with.",
      },
      {
        question: "What does your Green Guarantee badge communicate to customers?",
        options: [
          "You completed an environmental science degree",
          "You only accept jobs in eco-friendly neighborhoods",
          "You practice verified sustainable disposal. documenting where every item goes",
          "You use only electric vehicles for transport",
        ],
        correct: 2,
        explanation: "The Green Guarantee means you document the full disposal chain for every job. what was recycled, donated, or properly disposed of. This builds customer trust and differentiates you from competitors.",
      },
    ],
  },
  {
    id: "junk_removal",
    skillType: "junk_removal",
    title: "Junk Removal",
    icon: Trash2,
    iconColor: "text-emerald-600 dark:text-emerald-400",
    required: false,
    description: "Hazardous materials identification, load estimation, recycling/donation sorting, and responsible disposal documentation.",
    lessons: [
      "Lift with your legs, not your back. Use a dolly for items over 50lbs.",
      "Sort items into categories: Donate, Recycle, E-Waste, or Landfill. Upload disposal receipts for ESG bonuses.",
      "Check for hazardous materials (paint, batteries, chemicals, asbestos, fluorescent bulbs) before loading. these require special disposal.",
      "Most trucks have a Gross Vehicle Weight Rating (GVWR). Never exceed it. overloaded trucks are illegal and dangerous.",
      "Prohibited items include: medical waste, explosives, radioactive materials, and certain industrial chemicals. Refuse these and report in the app.",
    ],
    quiz: [
      {
        question: "You find 15 cans of old latex and oil-based paint during a garage cleanout. What do you do?",
        options: [
          "Toss them in the truck with everything else. paint isn't that dangerous",
          "Set them aside as hazardous waste, document in the app, and arrange proper HazMat disposal",
          "Pour the paint out in the yard to lighten the load",
          "Only separate the oil-based paint; latex is fine in regular trash",
        ],
        correct: 1,
        explanation: "Both latex and oil-based paint require special disposal in most jurisdictions. Set them aside, photograph and document in the app, and take them to an approved HazMat facility. Improper disposal is illegal and a liability risk.",
      },
      {
        question: "You estimated 1/4 truck load but the actual job is closer to 3/4 truck. What's the correct process?",
        options: [
          "Just do the extra work. the customer will be happy",
          "Refuse to take the extra items",
          "Submit a scope adjustment through the app with the updated load estimate, wait for customer approval, then proceed",
          "Take cash from the customer for the difference",
        ],
        correct: 2,
        explanation: "Always use the scope adjustment tool for any significant change. This updates the price transparently, ensures the customer approves, keeps your insurance active, and guarantees your full payout.",
      },
      {
        question: "You find a box of fluorescent tubes, old batteries, and a container of antifreeze. How do you categorize these?",
        options: [
          "Regular landfill waste. they're small items",
          "Recyclables. they all contain reusable materials",
          "Hazardous waste / E-waste requiring separate, specialized disposal",
          "Donation items. give them to a thrift store",
        ],
        correct: 2,
        explanation: "Fluorescent tubes contain mercury, batteries contain heavy metals, and antifreeze is toxic. All require specialized disposal channels. Never mix these with regular waste or recycling.",
      },
      {
        question: "A customer asks you to take a large amount of construction debris including drywall, nails, and broken concrete. Your truck's GVWR limit is close. What do you do?",
        options: [
          "Pack it all in. a little over the weight limit won't matter",
          "Estimate the weight, and if it would exceed your GVWR, explain the limit, take what you safely can, and schedule a second trip via the app",
          "Refuse the entire job since it involves construction materials",
          "Remove other items from the truck to make room, even if those belong to another customer's job",
        ],
        correct: 1,
        explanation: "Never exceed your GVWR. it's illegal, voids insurance, and is dangerous. Be transparent with the customer, take what you can safely carry, and use the app to schedule additional trips.",
      },
      {
        question: "You arrive at a cleanout and find used syringes and medical waste bags. What's the correct action?",
        options: [
          "Use heavy gloves and add them to the truck",
          "Put them in a separate bag and take them to regular disposal",
          "Refuse to handle the medical waste, document it with photos in the app, and inform the customer these are prohibited items requiring licensed medical waste disposal",
          "Throw them in the customer's regular trash bin",
        ],
        correct: 2,
        explanation: "Medical waste (syringes, biohazard materials) is a prohibited item. Never handle it. Document with photos, explain to the customer that licensed medical waste removal is required, and note it in the app.",
      },
      {
        question: "After completing a junk removal job, what disposal documentation is required?",
        options: [
          "No documentation needed. just mark the job complete",
          "A selfie at the dump",
          "Upload receipts/photos showing where each category of items went (landfill, recycling center, donation center) to maintain your Green Guarantee",
          "Just write a note saying 'disposed properly'",
        ],
        correct: 2,
        explanation: "Proper disposal documentation with receipts and photos for each disposal category (landfill, recycling, donation) is required for your Green Guarantee badge and ESG impact record. It also protects you legally.",
      },
    ],
  },
  {
    id: "pressure_washing",
    skillType: "pressure_washing",
    title: "Pressure Washing",
    icon: Droplets,
    iconColor: "text-blue-600 dark:text-blue-400",
    required: false,
    description: "PSI by surface type, chemical selection, surface protection, and water runoff management.",
    lessons: [
      "Concrete: 3,000-4,000 PSI. Wood decks: 500-600 PSI. Vinyl siding: 1,300-1,600 PSI. Always match PSI to the surface.",
      "Always test a small inconspicuous area first. Start from the top and work down to prevent streaking.",
      "Use sodium hypochlorite (bleach solution) for mold/mildew. Use sodium hydroxide for heavy grease/oil. NEVER mix chemicals.",
      "Maintain 6-12 inches from the surface for most applications. Closer distance = more damage risk.",
      "Protect landscaping by pre-wetting plants and covering delicate areas before applying chemicals.",
      "Manage water runoff. direct it away from storm drains when using chemicals. Know your local regulations.",
    ],
    quiz: [
      {
        question: "A customer wants you to pressure wash their cedar wood deck. What PSI setting do you use?",
        options: [
          "3,000+ PSI to blast off years of grime quickly",
          "1,300-1,600 PSI. same as vinyl siding",
          "500-600 PSI with appropriate wood-safe detergent",
          "The highest PSI your machine can produce for the best results",
        ],
        correct: 2,
        explanation: "Wood requires low pressure (500-600 PSI) to avoid destroying the grain, splintering, and causing permanent damage. Use proper detergent and let it do the work, not raw pressure.",
      },
      {
        question: "You encounter heavy black mold on vinyl siding. Which chemical is appropriate?",
        options: [
          "Mix bleach and ammonia for maximum cleaning power",
          "Sodium hydroxide (lye). it's the strongest option",
          "Sodium hypochlorite (bleach solution) at the correct dilution ratio",
          "Muriatic acid to dissolve the mold",
        ],
        correct: 2,
        explanation: "Sodium hypochlorite is the correct treatment for mold and mildew. NEVER mix bleach with ammonia (creates toxic chloramine gas). Sodium hydroxide is for grease, not mold. Muriatic acid can damage siding.",
      },
      {
        question: "What distance should you maintain between the pressure washer nozzle and the surface for most residential work?",
        options: [
          "As close as possible for maximum cleaning power",
          "6-12 inches from the surface",
          "3-4 feet away to be safe",
          "It doesn't matter. pressure is pressure regardless of distance",
        ],
        correct: 1,
        explanation: "6-12 inches is the standard working distance for most surfaces. Too close causes etching, gouging, or paint removal. Too far reduces effectiveness. Always test first and adjust.",
      },
      {
        question: "Before pressure washing a house, the flower beds and shrubs are directly below the work area. What should you do?",
        options: [
          "Nothing. plants are resilient enough to handle it",
          "Pre-wet all plants with fresh water and cover delicate landscaping with tarps before applying any chemicals",
          "Skip those sections entirely to avoid the plants",
          "Just work faster so less chemical reaches the plants",
        ],
        correct: 1,
        explanation: "Pre-wetting plants with fresh water helps them resist chemical absorption, and covering delicate landscaping with tarps provides additional protection. Responsible pros protect the entire property.",
      },
      {
        question: "You're washing a concrete driveway and chemical-laden water is flowing toward a storm drain. What do you do?",
        options: [
          "Keep working. it'll dilute in the drain system",
          "Use a berm or dam to redirect runoff away from the storm drain, and recover/contain chemical runoff per local regulations",
          "Switch to a higher PSI so you can skip chemicals entirely",
          "Finish quickly before anyone notices",
        ],
        correct: 1,
        explanation: "Chemical runoff into storm drains violates environmental regulations in most areas and can result in significant fines. Use berms, dams, or recovery systems to contain and properly dispose of chemical runoff.",
      },
    ],
  },
  {
    id: "gutter_cleaning",
    skillType: "gutter_cleaning",
    title: "Gutter Cleaning",
    icon: HomeIcon,
    iconColor: "text-amber-600 dark:text-amber-400",
    required: false,
    description: "Ladder safety, multi-story protocols, downspout testing, and damage identification.",
    lessons: [
      "Always use a stabilizer bar on extension ladders. Follow the 4-to-1 rule: 1 foot out from the wall for every 4 feet up.",
      "Maintain 3-point contact at all times when on a ladder (two hands + one foot, or two feet + one hand).",
      "For 2-story homes, use a ladder standoff and never lean more than arm's reach. Reposition the ladder instead.",
      "Check downspouts for clogs. Flush with a garden hose after clearing debris to confirm proper flow.",
      "Document and report any damage you find: cracked gutters, loose fascia, missing hangers, or roof damage. Take photos.",
      "If a customer asks about gutter guards, you can recommend they book a consultation. but never upsell services not in your scope.",
    ],
    quiz: [
      {
        question: "You're setting up an extension ladder for a 2-story gutter job. What is the correct setup?",
        options: [
          "Lean the ladder directly against the gutter and start climbing",
          "Attach a stabilizer bar, follow the 4-to-1 rule, and ensure the base is on firm level ground",
          "Have the customer hold the bottom of the ladder",
          "Use any angle that feels stable enough to you",
        ],
        correct: 1,
        explanation: "Always use a stabilizer bar (protects gutters from crushing and provides stability), follow the 4-to-1 ratio for the correct angle, and ensure the base is on firm, level ground. Never lean directly on gutters.",
      },
      {
        question: "While on the ladder, you need to reach a section about 3 feet to your left. What do you do?",
        options: [
          "Lean over as far as you can while holding on with one hand",
          "Shift your weight and stretch. it's only 3 feet",
          "Climb down, reposition the ladder to that section, then climb back up",
          "Ask the homeowner to push the ladder over while you're on it",
        ],
        correct: 2,
        explanation: "Never overreach on a ladder. The rule is: if you can't reach it within arm's length while maintaining 3-point contact, climb down and move the ladder. Falls from ladders are the #1 cause of injury in this trade.",
      },
      {
        question: "After clearing all debris from the gutters, what's the final required step?",
        options: [
          "Pack up your tools and mark the job complete",
          "Take an after photo of the gutters",
          "Flush all downspouts with a garden hose to confirm proper water flow, then document with photos",
          "Sweep the debris off the ground",
        ],
        correct: 2,
        explanation: "Clogged downspouts make clean gutters useless. Always flush every downspout with a hose, confirm water flows freely at the bottom, and document the flow with photos for your completion record.",
      },
      {
        question: "While cleaning gutters, you notice the fascia board behind the gutter is soft and rotting. What's the correct action?",
        options: [
          "Ignore it. it's not part of your job scope",
          "Try to repair it yourself to impress the customer",
          "Document the damage with photos in the app and inform the customer, recommending they get it repaired",
          "Pull the gutter off to get a better look at the damage",
        ],
        correct: 2,
        explanation: "Always document and report damage you discover. rotted fascia, loose hangers, cracked gutters, or roof issues. Take photos in the app and let the customer know. Never attempt repairs outside your scope.",
      },
      {
        question: "You arrive at a 3-story home but your equipment only safely reaches 2 stories. What do you do?",
        options: [
          "Use your longest ladder and stretch to reach. the customer is expecting the job done",
          "Stand on the roof to access the 3rd story gutters",
          "Inform the customer through the app that the job exceeds your safe working height, and that specialized equipment is needed",
          "Stack two ladders together for extra height",
        ],
        correct: 2,
        explanation: "Never exceed your equipment's safe working limits. 3-story work requires specialized equipment. Be honest with the customer, document the situation, and let the platform help find the right Pro for the job.",
      },
      {
        question: "A customer asks if they should install gutter guards. What's the appropriate response?",
        options: [
          "Sell them a set from your truck for extra money",
          "Tell them guards are a waste of money",
          "Let them know gutter guards can help reduce debris buildup, and suggest they book a consultation through the app for professional recommendations",
          "Install some you have lying around as a favor",
        ],
        correct: 2,
        explanation: "You can share general knowledge, but never upsell products or services outside your booked scope. Direct them to book a proper consultation through the app for tailored recommendations.",
      },
    ],
  },
  {
    id: "moving_labor",
    skillType: "moving_labor",
    title: "Moving Labor",
    icon: Move,
    iconColor: "text-violet-600 dark:text-violet-400",
    required: false,
    description: "Loading order, furniture protection, damage documentation, dolly techniques, and fragile item handling.",
    lessons: [
      "Load heavy items first (bottom/back of truck), lighter items on top. Last in, first out for unloading.",
      "Wrap ALL furniture in moving blankets. Use stretch wrap on drawers, doors, and loose components.",
      "Photograph high-value items and any pre-existing damage before moving. Document in the app.",
      "Use a dolly for anything over 50lbs. Tilt back, keep center of gravity low, and take ramps slowly.",
      "For narrow doorways: remove doors from hinges if needed, turn furniture diagonally, and use furniture sliders to protect floors.",
      "Fragile items get double-wrapped with bubble wrap inside blankets. Label boxes 'FRAGILE' and always load them last (top of stack).",
    ],
    quiz: [
      {
        question: "What's the correct loading order for a moving truck?",
        options: [
          "Load whatever is closest to the truck first to save trips",
          "Light items first so they're easy to move, heavy items last",
          "Heavy items on the bottom and against the back wall, lighter items on top, fill gaps to prevent shifting",
          "It doesn't matter as long as everything fits",
        ],
        correct: 2,
        explanation: "Heavy items go on the bottom and back for stability and weight distribution. Lighter items stack on top. Fill all gaps with blankets or small items to prevent shifting during transport. Last in, first out for efficient unloading.",
      },
      {
        question: "You notice a large scratch on a customer's antique dresser before you touch it. What do you do?",
        options: [
          "Don't mention it. hopefully they won't blame you",
          "Photograph the scratch, document it in the app with a note, and point it out to the customer before moving it",
          "Try to buff it out before they notice",
          "Only mention it if the customer asks later",
        ],
        correct: 1,
        explanation: "Always document pre-existing damage with photos AND written notes in the app, and communicate it to the customer. This protects you from false damage claims and builds trust through transparency.",
      },
      {
        question: "You need to move a 300lb upright piano through a narrow hallway. What's the correct approach?",
        options: [
          "Drag it across the floor. it has wheels",
          "Tip it on its side and carry it with one other person",
          "Use a heavy-duty dolly, keep it upright, protect the floor with furniture sliders/plywood, and have adequate help (3-4 people minimum)",
          "Tell the customer pianos aren't included in moving labor",
        ],
        correct: 2,
        explanation: "Heavy items like pianos require proper equipment (heavy-duty dolly), floor protection, and adequate manpower. Never drag furniture or take shortcuts that risk injury or property damage.",
      },
      {
        question: "A customer has a box labeled 'FRAGILE. crystal glasses.' How should you handle it during loading?",
        options: [
          "Stack it at the bottom where it's most stable",
          "Toss it on top of the pile at the end",
          "Verify it's properly packed (double-wrapped), load it last so it goes on top of the stack, and ensure nothing can shift onto it",
          "Refuse to move fragile items. they're the customer's responsibility",
        ],
        correct: 2,
        explanation: "Fragile items should be verified as properly packed, loaded last (so they're on top), and positioned where nothing can shift onto them. Handle with extra care and ensure they're the first items unloaded.",
      },
      {
        question: "You're moving a large sectional sofa through a doorway that's too narrow. What's the best approach?",
        options: [
          "Force it through. a little pressure won't hurt",
          "Remove the door from its hinges, disassemble the sectional into its separate pieces, and move each piece through individually",
          "Leave it behind and tell the customer it won't fit",
          "Flip it upside down and shove it through",
        ],
        correct: 1,
        explanation: "For narrow doorways: first try removing the door from its hinges for extra clearance. Disassemble sectionals into individual pieces. Turn pieces diagonally if needed. Use furniture sliders to protect floors and door frames.",
      },
    ],
  },
  {
    id: "home_cleaning",
    skillType: "home_cleaning",
    title: "Home Cleaning",
    icon: HomeIcon,
    iconColor: "text-pink-600 dark:text-pink-400",
    required: false,
    description: "Professional cleaning order, chemical safety, checklist protocols, and deep clean standards.",
    lessons: [
      "Always follow the cleaning checklist in the app. Complete ALL tasks marked for the service type (standard/deep/move-in-out).",
      "Take BEFORE photos when you arrive (every room, all surfaces). Take AFTER photos when done. Our AI verifies cleanliness quality.",
      "Work systematically: Start high (ceiling fans, light fixtures), then surfaces, then floors. Work from back of room toward the door.",
      "NEVER mix bleach (sodium hypochlorite) with ammonia-based products. this creates toxic chloramine gas that can be fatal.",
      "Deep clean includes inside appliances, baseboards, window tracks, and behind furniture. Standard clean does not. Know the difference.",
      "Handle customer belongings with care. Never move valuables without permission. If something breaks, document and report immediately.",
    ],
    quiz: [
      {
        question: "You arrive at a home for a standard clean. What's your very first step?",
        options: [
          "Start cleaning the kitchen since it's usually the dirtiest",
          "Take before photos of all areas on the checklist, then review the task list in the app",
          "Ask the customer what they want cleaned first",
          "Immediately start vacuuming to show you're working hard",
        ],
        correct: 1,
        explanation: "Before photos document the initial state and protect both you and the customer. They're also required for AI verification. Then review your checklist so you know exactly what's expected for this service type.",
      },
      {
        question: "You're cleaning a bathroom and want to remove tough soap scum and also kill mold. You have bleach and an ammonia-based glass cleaner. What do you do?",
        options: [
          "Mix them together for a powerful all-purpose cleaner",
          "Use them at the same time on different surfaces to save time",
          "Use ONE product at a time, thoroughly rinse the surface between products, and ensure adequate ventilation",
          "Use both but open a window. that's enough ventilation",
        ],
        correct: 2,
        explanation: "NEVER mix or simultaneously use bleach and ammonia-based products. even residue from one can react with the other, creating toxic chloramine gas. Use one, rinse completely, ventilate, then use the other if needed.",
      },
      {
        question: "What is the correct order for cleaning a room?",
        options: [
          "Floors first so you have a clean surface to stand on",
          "Whatever order is fastest",
          "Top to bottom (ceiling, lights → surfaces → floors), back to front (farthest wall → toward the door)",
          "Clean whatever looks dirtiest first",
        ],
        correct: 2,
        explanation: "Top-to-bottom ensures dust and debris fall to areas you haven't cleaned yet. Back-to-front means you don't walk over areas you've already cleaned. This systematic approach prevents re-work.",
      },
      {
        question: "You're 80% through the standard clean checklist but running 30 minutes late for your next job. What do you do?",
        options: [
          "Skip the remaining tasks and mark the job complete",
          "Rush through the remaining items without full attention to detail",
          "Notify the customer of the delay through the app, complete ALL remaining checklist items properly, then update your next customer about your revised ETA",
          "Leave and come back tomorrow to finish",
        ],
        correct: 2,
        explanation: "Incomplete checklists result in payment disputes and lower ratings. Always communicate delays and finish ALL the work to standard. Then notify your next customer proactively about your updated timing.",
      },
      {
        question: "A customer booked a standard clean but asks you to clean inside the oven and behind the refrigerator. What do you do?",
        options: [
          "Do it for free to get a better tip",
          "Tell them you can't do that under any circumstances",
          "Explain that those are deep clean tasks, use the 'Update Scope' tool to add them as an add-on, and proceed once the customer approves the adjusted price",
          "Do it but take extra long so the hourly rate balances out",
        ],
        correct: 2,
        explanation: "Inside appliances and behind furniture are deep clean tasks. The scope adjustment tool ensures you get paid for the extra work, the customer sees transparent pricing, and everything stays documented.",
      },
      {
        question: "While cleaning a living room, you accidentally knock over a small decorative vase and it chips. What's the correct response?",
        options: [
          "Glue it back together and hope they don't notice",
          "Hide it behind other items on the shelf",
          "Immediately photograph the damage, document it in the app, and honestly inform the customer about what happened",
          "Replace it with a similar one from a store on your way home",
        ],
        correct: 2,
        explanation: "Honesty and documentation are always the right call. Photograph the damage, report it in the app immediately, and tell the customer. The platform's insurance covers accidental damage. hiding it risks your entire account.",
      },
    ],
  },
];

function AcademyPublicLanding() {
  const [badgeId, setBadgeId] = useState("");
  const [verifyResult, setVerifyResult] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  const handleVerify = async () => {
    if (!badgeId.trim()) return;
    setVerifying(true);
    try {
      const res = await fetch(`/api/verify-badge/${encodeURIComponent(badgeId.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setVerifyResult(`Verified: ${data.name} is Active and Certified in ${data.specialty || "General Services"}.`);
      } else {
        setVerifyResult("Badge not found. Please check the ID and try again.");
      }
    } catch {
      setVerifyResult("Unable to verify at this time. Please try again later.");
    }
    setVerifying(false);
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <Header />
      <div className="max-w-5xl mx-auto px-4 py-16 mt-16">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4 text-sm">
            <GraduationCap className="w-4 h-4 mr-1" /> The Pro Academy
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Every Pro on Our Platform is{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              Certified
            </span>
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-4">
            Our Pros complete mandatory safety certification, background checks, and skill verification
            before they ever set foot on your property.
          </p>
          <p className="text-base text-slate-400 max-w-xl mx-auto mb-8">
            92% of homeowners say they prefer certified service professionals. Every UpTend Pro earns their badge.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
            <Link href="/book">
              <Button size="lg" className="font-bold text-lg" data-testid="button-academy-book">
                Book a Certified Pro
              </Button>
            </Link>
            <Link href="/pro/signup">
              <Button variant="outline" size="lg" className="text-lg border-slate-600 text-slate-300" data-testid="button-academy-apply">
                Apply to Become a Pro
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {[
            {
              icon: ShieldCheck,
              title: "Background Checked",
              desc: "Every Pro undergoes identity verification and background screening before activation.",
            },
            {
              icon: GraduationCap,
              title: "Academy Certified",
              desc: "Mandatory certification modules covering safety protocols, customer interaction, and proper handling.",
            },
            {
              icon: Star,
              title: "Performance Rated",
              desc: "Real-time ratings and reviews from verified customers. Low performers are automatically flagged.",
            },
          ].map((item) => (
            <Card key={item.title} className="p-6 bg-slate-800/50 border-slate-700">
              <item.icon className="w-10 h-10 text-cyan-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
              <p className="text-sm text-slate-300">{item.desc}</p>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {[
            { icon: Shield, label: "$1M Insurance", desc: "Every job covered by comprehensive liability insurance" },
            { icon: Clock, label: "GPS Tracked", desc: "Real-time location tracking for every active job" },
            { icon: UserCheck, label: "Safety Codes", desc: "Unique verification codes confirm your Pro's identity" },
            { icon: CheckCircle, label: "Photo Documentation", desc: "Before/after photos create a verifiable record" },
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-4 p-4 rounded-lg bg-slate-800/30 border border-slate-700/50">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0">
                <item.icon className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="font-semibold text-white">{item.label}</p>
                <p className="text-sm text-slate-300">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <Card className="p-6 bg-slate-800/50 border-slate-700 max-w-lg mx-auto" data-testid="card-verify-badge">
          <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
            <Search className="w-5 h-5 text-cyan-400" />
            Verify a Pro
          </h3>
          <p className="text-sm text-slate-300 mb-4">
            Enter a badge ID to verify your Pro's certification status.
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="e.g. PRO-492"
              value={badgeId}
              onChange={(e) => setBadgeId(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white"
              data-testid="input-badge-id"
            />
            <Button onClick={handleVerify} disabled={verifying || !badgeId.trim()} data-testid="button-verify-badge">
              {verifying ? "Checking..." : "Verify"}
            </Button>
          </div>
          {verifyResult && (
            <p
              className={`mt-3 text-sm ${verifyResult.startsWith("Verified") ? "text-green-400" : "text-red-400"}`}
              data-testid="text-verify-result"
            >
              {verifyResult.startsWith("Verified") ? (
                <><CheckCircle className="w-4 h-4 inline mr-1" />{verifyResult}</>
              ) : verifyResult}
            </p>
          )}
        </Card>
      </div>
      <Footer />
    </div>
  );
}

export default function PyckerAcademy() {
  usePageTitle("Pro Academy | UpTend");
  const { user, isAuthenticated } = useAuth();

  if (isAuthenticated && (user?.role === "hauler" || user?.role === "pro")) {
    return <ProAcademyDashboard />;
  }

  return <AcademyPublicLanding />;
}

function ProAcademyDashboard() {
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [phase, setPhase] = useState<"lesson" | "quiz">("lesson");
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [completedModules, setCompletedModules] = useState<Set<string>>(new Set());
  const [moduleScores, setModuleScores] = useState<Record<string, number>>({});
  const [certifying, setCertifying] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const currentModule = MODULES[currentModuleIndex];
  const currentQuiz = currentModule.quiz[currentQuizIndex];
  const coreComplete = completedModules.has("core_safety");
  const appGeorgeComplete = completedModules.has("app_and_george");
  const requiredComplete = coreComplete && appGeorgeComplete;
  const totalCompleted = completedModules.size;
  const overallProgress = (totalCompleted / MODULES.length) * 100;

  const handleAnswer = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
    setShowResult(true);
  };

  const handleNextQuiz = () => {
    if (selectedAnswer !== currentQuiz.correct) {
      toast({
        title: "Incorrect Answer",
        description: "Review the lesson and try again.",
        variant: "destructive",
      });
      setSelectedAnswer(null);
      setShowResult(false);
      return;
    }

    const newScore = (moduleScores[currentModule.id] || 0) + 1;
    setModuleScores((prev) => ({ ...prev, [currentModule.id]: newScore }));

    if (currentQuizIndex < currentModule.quiz.length - 1) {
      setCurrentQuizIndex((i) => i + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      const scorePercent = (newScore / currentModule.quiz.length) * 100;
      if (scorePercent >= 80) {
        setCompletedModules((prev) => {
          const next = new Set<string>();
          prev.forEach((v) => next.add(v));
          next.add(currentModule.id);
          return next;
        });
        toast({
          title: `${currentModule.title} Passed!`,
          description: `Score: ${newScore}/${currentModule.quiz.length}. Badge unlocked.`,
        });
      } else {
        toast({
          title: "Certification Failed",
          description: `You scored ${scorePercent.toFixed(0)}%. You need 80% to pass. Retake the quiz.`,
          variant: "destructive",
        });
        setModuleScores((prev) => ({ ...prev, [currentModule.id]: 0 }));
        setCurrentQuizIndex(0);
        setSelectedAnswer(null);
        setShowResult(false);
        setPhase("lesson");
        return;
      }
      setPhase("lesson");
      setCurrentQuizIndex(0);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  const isModuleComplete = (id: string) => completedModules.has(id);
  const isModuleLocked = (mod: AcademyModule) => {
    if (mod.id === "core_safety") return false;
    if (mod.id === "app_and_george") return !coreComplete;
    // Service modules require both core_safety AND app_and_george
    return !requiredComplete;
  };

  const startQuiz = () => {
    if (isModuleLocked(currentModule)) {
      const missing = !coreComplete ? "Core Safety" : "Using George & The App";
      toast({
        title: "Prerequisites Required",
        description: `You must pass ${missing} first.`,
        variant: "destructive",
      });
      return;
    }
    setPhase("quiz");
    setCurrentQuizIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setModuleScores((prev) => ({ ...prev, [currentModule.id]: 0 }));
  };

  const completeCertification = async () => {
    setCertifying(true);
    try {
      const skills: string[] = [];
      completedModules.forEach((s) => skills.push(s));
      await apiRequest("POST", "/api/academy/certify", {
        skills,
        scores: moduleScores,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/pro/career"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pro/certifications"] });
      toast({ title: "Certification Complete", description: "Your badges are active. You can now receive matching jobs." });
      setLocation("/pro/dashboard");
    } catch {
      toast({ title: "Error", description: "Could not complete certification. Try again.", variant: "destructive" });
    } finally {
      setCertifying(false);
    }
  };

  const Icon = currentModule.icon;

  if (requiredComplete && totalCompleted >= 2) {
    const allDone = totalCompleted === MODULES.length;
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4" data-testid="page-academy-progress">
        <Card className="w-full max-w-lg">
          <CardContent className="pt-6 pb-6 space-y-6">
            <div className="flex items-center gap-3">
              <GraduationCap className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold" data-testid="text-academy-title">Pro Academy</h2>
            </div>

            <div className="p-4 rounded-lg bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800">
              <p className="text-sm font-medium text-cyan-800 dark:text-cyan-200">
                 Need help? George is here! Click the chat bubble anytime during your training.
                He can explain concepts, answer questions about UpTend policies, or help you prepare for quizzes.
              </p>
            </div>

            <Progress value={overallProgress} className="h-2" data-testid="progress-academy" />

            <div className="space-y-2">
              {MODULES.map((mod, i) => {
                const ModIcon = mod.icon;
                const done = isModuleComplete(mod.id);
                const locked = isModuleLocked(mod);
                return (
                  <div
                    key={mod.id}
                    className={`flex items-center justify-between gap-4 p-3 rounded-md border ${done ? "border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-900/10" : locked ? "opacity-50" : "border-border"}`}
                    data-testid={`module-row-${mod.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <ModIcon className={`w-5 h-5 ${mod.iconColor}`} />
                      <div>
                        <p className="text-sm font-medium">{mod.title}</p>
                        {mod.required && <Badge variant="secondary" className="text-[10px] mt-0.5">Required</Badge>}
                      </div>
                    </div>
                    {done ? (
                      <Badge variant="default" className="bg-emerald-600 text-white gap-1" data-testid={`badge-complete-${mod.id}`}>
                        <CheckCircle className="w-3 h-3" /> Passed
                      </Badge>
                    ) : locked ? (
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setCurrentModuleIndex(i);
                          setPhase("lesson");
                        }}
                        data-testid={`button-start-${mod.id}`}
                      >
                        Start
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>

            {allDone && (
              <div className="text-center space-y-4 pt-2">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mx-auto">
                  <GraduationCap className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="font-bold text-lg" data-testid="text-all-complete">All Modules Complete</p>
              </div>
            )}

            <Button
              className="w-full gap-2"
              onClick={completeCertification}
              disabled={!requiredComplete || certifying}
              data-testid="button-activate-account"
            >
              {certifying ? "Activating..." : `Activate My Account (${totalCompleted} badge${totalCompleted !== 1 ? "s" : ""})`}
              <ArrowRight className="w-4 h-4" />
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Core Safety and Using George & The App are required. Additional badges unlock higher-paying job types.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" data-testid="page-academy">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 pb-6 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" />
              <h2 className="font-bold text-lg" data-testid="text-academy-title">Pro Academy</h2>
            </div>
            <div className="flex items-center gap-2">
              {!isModuleComplete(currentModule.id) && (
                <Badge variant="secondary" data-testid="badge-module-name">
                  {currentModule.title}
                </Badge>
              )}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800">
            <p className="text-sm font-medium text-cyan-800 dark:text-cyan-200">
               Need help? George is here! Click the chat bubble anytime during your training.
              He can explain concepts, answer questions about UpTend policies, or help you prepare for quizzes.
            </p>
          </div>

          {phase === "lesson" && !isModuleComplete(currentModule.id) && (
            <>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
                    <Icon className={`w-5 h-5 ${currentModule.iconColor}`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold" data-testid="text-module-title">
                      {currentModule.title}
                    </h3>
                    {currentModule.required && <Badge variant="secondary" className="text-[10px]">Required</Badge>}
                  </div>
                </div>

                <p className="text-sm text-muted-foreground" data-testid="text-module-description">
                  {currentModule.description}
                </p>

                <div className="space-y-2">
                  {currentModule.lessons.map((lesson, i) => (
                    <div key={i} className="flex items-start gap-2 p-3 rounded-md bg-muted text-sm">
                      <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <p>{lesson}</p>
                    </div>
                  ))}
                </div>
              </div>

              <Button className="w-full gap-2" onClick={startQuiz} data-testid="button-start-quiz">
                Take the Quiz
                <ArrowRight className="w-4 h-4" />
              </Button>

              <div className="flex items-center gap-2 flex-wrap">
                {MODULES.map((mod, i) => (
                  <Button
                    key={mod.id}
                    variant={i === currentModuleIndex ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setCurrentModuleIndex(i);
                      setPhase("lesson");
                    }}
                    disabled={isModuleLocked(mod) && !isModuleComplete(mod.id)}
                    data-testid={`button-nav-${mod.id}`}
                    className="text-xs gap-1"
                  >
                    {isModuleComplete(mod.id) && <CheckCircle className="w-3 h-3" />}
                    {isModuleLocked(mod) && !isModuleComplete(mod.id) && <Lock className="w-3 h-3" />}
                    {mod.title.split(" ")[0]}
                  </Button>
                ))}
              </div>
            </>
          )}

          {phase === "quiz" && (
            <>
              <Progress
                value={((currentQuizIndex + (showResult ? 1 : 0)) / currentModule.quiz.length) * 100}
                className="h-2"
                data-testid="progress-quiz"
              />

              <div className="border-t pt-4 space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-semibold text-sm" data-testid="text-quiz-label">
                    Quiz: {currentModule.title}
                  </p>
                  <Badge variant="secondary" data-testid="badge-quiz-progress">
                    {currentQuizIndex + 1} / {currentModule.quiz.length}
                  </Badge>
                </div>
                <p className="text-sm italic text-muted-foreground" data-testid="text-quiz-question">
                  {currentQuiz.question}
                </p>

                <div className="space-y-2">
                  {currentQuiz.options.map((opt, i) => {
                    let extraClass = "";
                    if (showResult && i === currentQuiz.correct) {
                      extraClass = "border-emerald-500 dark:border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-200";
                    } else if (showResult && i === selectedAnswer && i !== currentQuiz.correct) {
                      extraClass = "border-destructive bg-destructive/10 text-destructive";
                    }
                    return (
                      <Button
                        key={i}
                        variant="outline"
                        className={`w-full justify-start text-left h-auto py-3 whitespace-normal ${extraClass}`}
                        onClick={() => handleAnswer(i)}
                        disabled={showResult}
                        data-testid={`button-answer-${i}`}
                      >
                        <span className="font-semibold mr-2 shrink-0">{String.fromCharCode(65 + i)}.</span>
                        {opt}
                      </Button>
                    );
                  })}
                </div>

                {showResult && (
                  <div className="p-3 rounded-md bg-muted text-sm" data-testid="text-explanation">
                    <p className="font-medium mb-1">
                      {selectedAnswer === currentQuiz.correct ? (
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" /> Correct
                        </span>
                      ) : (
                        <span className="text-destructive flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4" /> Incorrect
                        </span>
                      )}
                    </p>
                    <p className="text-muted-foreground">{currentQuiz.explanation}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setPhase("lesson");
                    setSelectedAnswer(null);
                    setShowResult(false);
                  }}
                  data-testid="button-back-to-lesson"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" /> Lesson
                </Button>
                <Button
                  className="flex-1 gap-2"
                  onClick={handleNextQuiz}
                  disabled={!showResult}
                  data-testid="button-next-quiz"
                >
                  {currentQuizIndex === currentModule.quiz.length - 1 ? "Submit" : "Next Question"}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
