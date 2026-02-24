/**
 * SMS Bot Package Recommender
 *
 * Enhances SMS bot with:
 * - Named package recommendations
 * - PolishUp dynamic pricing knowledge
 * - Home DNA Scan two-tier awareness
 * - Multi-service discount prompts
 */

import type { PricingQuote } from "../../client/src/lib/pricing-quote";

export interface PackageRecommendation {
  name: string;
  services: string[];
  description: string;
  estimatedPrice: string;
  savings: string;
  smsMessage: string;
}

/**
 * Detect customer intent from message and recommend packages
 */
export function recommendPackageFromIntent(
  messageBody: string,
  conversationHistory?: string[]
): PackageRecommendation | null {
  const normalized = messageBody.toLowerCase();

  // Moving out? Recommend The Move-Out package
  if (
    /move|moving|move.out|vacancy|vacant|tenant|rent/.test(normalized)
  ) {
    return {
      name: 'The Move-Out',
      services: ['Home DNA Scan Aerial', 'BulkSnap', 'PolishUp Move-Out', 'FreshWash'],
      description: 'Tenant out. Rent-ready in 48 hours.',
      estimatedPrice: '$800-$1,200',
      savings: '10% multi-service discount',
      smsMessage:
        '🏠 Moving out? Try THE MOVE-OUT package:\n\n' +
        '✅ Home DNA Scan Aerial ($249)\n' +
        '✅ BulkSnap (junk removal)\n' +
        '✅ PolishUp Move-Out Clean\n' +
        '✅ FreshWash exterior\n\n' +
        '💰 Get 10% off everything!\n' +
        'Typical total: $800-$1,200\n\n' +
        'Book now: [link]',
    };
  }

  // Home cleanup? Recommend The Refresh
  if (
    /clean|cleaning|junk|clutter|mess|tidy/.test(normalized) &&
    !/exterior|outside|driveway|gutter/.test(normalized)
  ) {
    return {
      name: 'The Refresh',
      services: ['BulkSnap', 'PolishUp Standard'],
      description: 'Clear the clutter. Clean the house.',
      estimatedPrice: '$250-$450',
      savings: 'Add 1 more service for 10% off',
      smsMessage:
        '✨ THE REFRESH package:\n\n' +
        '✅ BulkSnap (clear clutter)\n' +
        '✅ PolishUp Standard Clean\n\n' +
        '💡 Add any service and save 10%!\n' +
        'Total: $250-$450\n\n' +
        'Book now: [link]',
    };
  }

  // Exterior work? Recommend The Curb Appeal
  if (
    /curb|exterior|outside|driveway|gutter|pressure|wash|roof/.test(normalized)
  ) {
    return {
      name: 'The Curb Appeal',
      services: ['FreshWash', 'GutterFlush'],
      description: 'Everything your neighbors see, refreshed.',
      estimatedPrice: '$270-$370',
      savings: 'Add Home DNA Scan for $99 + 10% off total',
      smsMessage:
        '🌟 THE CURB APPEAL package:\n\n' +
        '✅ FreshWash (pressure washing)\n' +
        '✅ GutterFlush (gutter cleaning)\n\n' +
        '💡 Add Home DNA Scan for $99 and get 10% off!\n' +
        'Total: $270-$370\n\n' +
        'Book now: [link]',
    };
  }

  // Complete reset? Recommend The Full Reset
  if (
    /everything|full|complete|whole|entire|reset|refresh|all/.test(normalized)
  ) {
    return {
      name: 'The Full Reset',
      services: ['Home DNA Scan Aerial', 'BulkSnap', 'PolishUp Deep', 'FreshWash', 'GutterFlush'],
      description: 'The complete home reset, inside and out.',
      estimatedPrice: '$1,000-$1,500',
      savings: '15% off (5 services)',
      smsMessage:
        '🎯 THE FULL RESET package:\n\n' +
        '✅ Home DNA Scan Aerial ($249)\n' +
        '✅ BulkSnap (junk removal)\n' +
        '✅ PolishUp Deep Clean\n' +
        '✅ FreshWash (pressure washing)\n' +
        '✅ GutterFlush (gutters)\n\n' +
        '💰 Save 15% with 5 services!\n' +
        'Total: $1,000-$1,500\n\n' +
        'Book now: [link]',
    };
  }

  return null;
}

/**
 * Generate Home DNA Scan tier recommendation for SMS
 */
export function getAIHomeScanSmsMessage(includeAerialUpsell: boolean = true): string {
  if (includeAerialUpsell) {
    return (
      '🏡 Home DNA Scan:\n\n' +
      '📋 STANDARD - $99\n' +
      'Full walkthrough + maintenance report\n\n' +
      '🚁 AERIAL - $249 ⭐ RECOMMENDED\n' +
      'Everything in Standard + drone roof scan\n' +
      '(Drone inspections alone cost $290+ elsewhere)\n\n' +
      'Both include $49 credit toward next service!\n\n' +
      'Book: [link]'
    );
  }

  return (
    '🏡 Home DNA Scan - $99\n\n' +
    '✅ Full interior walkthrough\n' +
    '✅ Exterior assessment\n' +
    '✅ Maintenance report\n' +
    '✅ $49 credit to next service\n\n' +
    'Book: [link]'
  );
}

/**
 * Generate PolishUp SMS message with dynamic pricing note
 */
export function getPolishUpSmsMessage(): string {
  return (
    '✨ PolishUp Home Cleaning:\n\n' +
    '📋 STANDARD - Starting at $99\n' +
    'Regular maintenance cleaning\n\n' +
    '🧽 DEEP - Starting at $179\n' +
    'Baseboards, appliances, grout\n\n' +
    '🏠 MOVE-OUT - Starting at $229\n' +
    'Complete vacant property clean\n\n' +
    '💡 Price based on your home size\n' +
    'Get instant quote: Reply with bedrooms/bathrooms\n' +
    'Example: "3 bed 2 bath 2 story"\n\n' +
    'Or upload photos for AI quote!'
  );
}

/**
 * Parse property details from SMS for PolishUp pricing
 */
export function parsePropertyDetailsFromSms(
  messageBody: string
): {
  bedrooms?: number;
  bathrooms?: number;
  stories?: number;
  cleanType?: 'standard' | 'deep' | 'move_out';
} | null {
  const normalized = messageBody.toLowerCase();

  // Try to extract bedrooms
  const bedroomMatch = normalized.match(/(\d+)\s*(bed|br|bedroom)/);
  const bedrooms = bedroomMatch ? parseInt(bedroomMatch[1]) : undefined;

  // Try to extract bathrooms
  const bathroomMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(bath|ba|bathroom)/);
  const bathrooms = bathroomMatch ? parseFloat(bathroomMatch[1]) : undefined;

  // Try to extract stories
  const storyMatch = normalized.match(/(\d+)\s*(story|stories|floor|level)/);
  const stories = storyMatch ? parseInt(storyMatch[1]) : undefined;

  // Detect clean type
  let cleanType: 'standard' | 'deep' | 'move_out' | undefined;
  if (/deep|thorough|intensive/.test(normalized)) {
    cleanType = 'deep';
  } else if (/move.?out|vacant|tenant/.test(normalized)) {
    cleanType = 'move_out';
  } else if (/standard|regular|basic/.test(normalized)) {
    cleanType = 'standard';
  }

  if (bedrooms || bathrooms) {
    return {
      bedrooms,
      bathrooms,
      stories,
      cleanType,
    };
  }

  return null;
}

/**
 * Generate multi-service discount prompt for SMS
 */
export function getMultiServiceDiscountMessage(serviceCount: number): string {
  if (serviceCount === 2) {
    return '💡 Add 1 more service and get 10% off everything!';
  }
  if (serviceCount >= 3 && serviceCount < 5) {
    return '🎉 You qualify for 10% off! Add 2 more for 15% off.';
  }
  if (serviceCount >= 5) {
    return '🎉 You qualify for 15% off with 5+ services!';
  }
  return '';
}

/**
 * Generate SMS response with pricing quote
 */
export function formatPricingQuoteForSms(quote: PricingQuote): string {
  let message = `💰 Your Quote:\n\n`;
  message += `${quote.serviceBranded}\n`;
  message += `Price: $${quote.finalPrice}\n`;
  message += `Duration: ${quote.estimatedDuration}\n`;
  message += `Team: ${quote.estimatedPros} Pro${quote.estimatedPros > 1 ? 's' : ''}\n\n`;

  if (quote.modifiers.length > 0) {
    message += `Price factors:\n`;
    quote.modifiers.forEach((mod) => {
      if (mod.type === 'multiplicative') {
        const percent = Math.round((mod.value - 1) * 100);
        message += `• ${mod.name} (+${percent}%)\n`;
      } else {
        message += `• ${mod.name} (+$${mod.value})\n`;
      }
    });
    message += '\n';
  }

  message += `Valid for 7 days\n`;
  message += `Book now: [link]\n\n`;
  message += `❓ Questions? Reply here or call (407) 338-3342`;

  return message;
}

/**
 * Detect if customer is asking about pricing
 */
export function isPricingQuestion(messageBody: string): boolean {
  const normalized = messageBody.toLowerCase();
  return /price|cost|how much|quote|estimate|fee/.test(normalized);
}

/**
 * Detect if customer is asking about packages
 */
export function isPackageQuestion(messageBody: string): boolean {
  const normalized = messageBody.toLowerCase();
  return /package|bundle|deal|combo|multiple|together/.test(normalized);
}
