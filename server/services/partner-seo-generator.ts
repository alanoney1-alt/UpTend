/**
 * Partner SEO Page Generator Service
 * 
 * Auto-generates neighborhood SEO pages for partner marketing.
 * Uses George AI to create unique, localized content for each neighborhood.
 */

import { pool } from "../db";
import { generateChatResponse } from "./ai-assistant";

interface PartnerInfo {
  id: string;
  company_name: string;
  service_types: string[];
  service_area: string;
  phone: string;
}

interface SEOPageContent {
  title: string;
  meta_description: string;
  hero_headline: string;
  body_content: string;
  faqs: Array<{ question: string; answer: string }>;
  services_highlighted: string[];
}

/**
 * Generate SEO pages for a partner's service areas
 */
export async function generatePartnerSEOPages(
  partnerSlug: string,
  neighborhoods: string[]
): Promise<{ success: boolean; generated: number; errors: string[] }> {
  const result: { success: boolean; generated: number; errors: string[] } = { success: false, generated: 0, errors: [] };

  try {
    // Get partner information  
    const partnerResult = await pool.query(`
      SELECT id, company_name, service_types, service_area, phone
      FROM business_partners 
      WHERE id = $1 OR company_name ILIKE $2
      LIMIT 1
    `, [partnerSlug, `%${partnerSlug}%`]);

    if (partnerResult.rows.length === 0) {
      result.errors.push('Partner not found');
      return result;
    }

    const partner: PartnerInfo = partnerResult.rows[0];

    // Generate pages for each neighborhood
    for (const neighborhood of neighborhoods) {
      try {
        const neighborhoodSlug = neighborhood.toLowerCase()
          .replace(/[^a-z0-9\s]/g, '')
          .replace(/\s+/g, '-');

        // Check if page already exists
        const existingResult = await pool.query(`
          SELECT id FROM partner_seo_pages 
          WHERE partner_slug = $1 AND neighborhood_slug = $2
        `, [partnerSlug, neighborhoodSlug]);

        if (existingResult.rows.length > 0) {
          console.log(`SEO page for ${neighborhood} already exists, skipping`);
          continue;
        }

        // Generate content using George AI
        const seoContent = await generateSEOContent(partner, neighborhood);

        // Insert into database
        await pool.query(`
          INSERT INTO partner_seo_pages (
            partner_slug,
            neighborhood_slug,
            neighborhood_name,
            title,
            meta_description,
            hero_headline,
            body_content,
            faqs,
            services_highlighted
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          partnerSlug,
          neighborhoodSlug,
          neighborhood,
          seoContent.title,
          seoContent.meta_description,
          seoContent.hero_headline,
          seoContent.body_content,
          JSON.stringify(seoContent.faqs),
          seoContent.services_highlighted
        ]);

        result.generated++;
        console.log(`Generated SEO page for ${partner.company_name} in ${neighborhood}`);

      } catch (neighborhoodError: any) {
        result.errors.push(`Error generating page for ${neighborhood}: ${neighborhoodError.message}`);
        console.error(`Error generating SEO page for ${neighborhood}:`, neighborhoodError);
      }
    }

    result.success = result.generated > 0;

  } catch (error: any) {
    result.errors.push(`Generator error: ${error.message}`);
    console.error('Partner SEO generation error:', error);
  }

  return result;
}

/**
 * Generate SEO content using George AI
 */
async function generateSEOContent(partner: PartnerInfo, neighborhood: string): Promise<SEOPageContent> {
  const services = Array.isArray(partner.service_types) ? partner.service_types : [];
  const primaryService = services[0] || 'home services';

  const prompt = `Generate SEO-optimized content for a local home service business page.

Business Details:
- Company: ${partner.company_name}
- Primary Service: ${primaryService}
- All Services: ${services.join(', ')}
- Location: ${neighborhood}
- Description: Professional home services

Generate content for a landing page targeting "${primaryService} in ${neighborhood}". Include:

1. SEO Title (60 chars max, include service + location)
2. Meta Description (160 chars max, compelling + local)
3. Hero Headline (engaging, mentions neighborhood)
4. Body Content (2-3 paragraphs, 200-300 words, naturally mention neighborhood 2-3 times)
5. 3-5 FAQs specific to the service and neighborhood
6. Top 3 services to highlight

Make it sound natural, professional, and locally relevant. Avoid keyword stuffing.
Focus on trust, expertise, and local knowledge.

Respond in this exact JSON format:
{
  "title": "SEO title here",
  "meta_description": "Meta description here", 
  "hero_headline": "Hero headline here",
  "body_content": "Full body content here with natural paragraphs",
  "faqs": [
    {"question": "FAQ question?", "answer": "FAQ answer"}
  ],
  "services_highlighted": ["Service 1", "Service 2", "Service 3"]
}`;

  try {
    const response = await generateChatResponse(prompt, []);

    // Parse JSON response from AI
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('AI response does not contain valid JSON');
    }

    const aiContent = JSON.parse(jsonMatch[0]);

    // Validate and return content
    return {
      title: aiContent.title || `${primaryService} in ${neighborhood} | ${partner.company_name}`,
      meta_description: aiContent.meta_description || `Professional ${primaryService.toLowerCase()} in ${neighborhood}. Call ${partner.company_name} for fast, reliable service.`,
      hero_headline: aiContent.hero_headline || `${neighborhood}'s Trusted ${primaryService} Experts`,
      body_content: aiContent.body_content || `${partner.company_name} provides professional ${primaryService.toLowerCase()} throughout ${neighborhood}. Our experienced team delivers quality results you can trust.`,
      faqs: aiContent.faqs || [
        {
          question: `How quickly can you provide ${primaryService.toLowerCase()} in ${neighborhood}?`,
          answer: "We typically respond within 24 hours and can often provide same-day service for urgent needs."
        }
      ],
      services_highlighted: aiContent.services_highlighted || services.slice(0, 3)
    };

  } catch (error) {
    console.error('Error generating AI content:', error);
    
    // Fallback content if AI fails
    return {
      title: `${primaryService} in ${neighborhood} | ${partner.company_name}`,
      meta_description: `Professional ${primaryService.toLowerCase()} in ${neighborhood}. Call ${partner.company_name} for fast, reliable service.`,
      hero_headline: `${neighborhood}'s Trusted ${primaryService} Experts`,
      body_content: `${partner.company_name} provides professional ${primaryService.toLowerCase()} throughout ${neighborhood}. Our experienced team knows the area well and delivers quality results you can trust. Whether you need routine service or emergency help, we're here to serve the ${neighborhood} community with honest, reliable work.`,
      faqs: [
        {
          question: `Do you provide ${primaryService.toLowerCase()} in ${neighborhood}?`,
          answer: `Yes, we serve ${neighborhood} and surrounding areas with professional ${primaryService.toLowerCase()}.`
        },
        {
          question: "How quickly can you respond?",
          answer: "We typically respond within 24 hours and can often provide same-day service for urgent needs."
        },
        {
          question: "Are you licensed and insured?",
          answer: "Yes, we are fully licensed and insured for your protection and peace of mind."
        }
      ],
      services_highlighted: services.slice(0, 3)
    };
  }
}

/**
 * Get all SEO pages for a partner
 */
export async function getPartnerSEOPages(partnerSlug: string): Promise<any[]> {
  const result = await pool.query(`
    SELECT * FROM partner_seo_pages
    WHERE partner_slug = $1 AND published = true
    ORDER BY neighborhood_name ASC
  `, [partnerSlug]);

  return result.rows;
}

/**
 * Get specific SEO page content
 */
export async function getSEOPageContent(partnerSlug: string, neighborhoodSlug: string): Promise<any | null> {
  const result = await pool.query(`
    SELECT psp.*, bp.company_name, bp.phone
    FROM partner_seo_pages psp
    JOIN business_partners bp ON psp.partner_slug = bp.id
    WHERE psp.partner_slug = $1 
    AND psp.neighborhood_slug = $2 
    AND psp.published = true
  `, [partnerSlug, neighborhoodSlug]);

  return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * Update existing SEO page
 */
export async function updateSEOPage(
  partnerSlug: string,
  neighborhoodSlug: string,
  updates: Partial<SEOPageContent>
): Promise<boolean> {
  try {
    const setClause = Object.keys(updates).map((key, index) => 
      `${key} = $${index + 3}`
    ).join(', ');
    
    const values = Object.values(updates).map(value => 
      typeof value === 'object' ? JSON.stringify(value) : value
    );

    const result = await pool.query(`
      UPDATE partner_seo_pages 
      SET ${setClause}, updated_at = NOW()
      WHERE partner_slug = $1 AND neighborhood_slug = $2
      RETURNING id
    `, [partnerSlug, neighborhoodSlug, ...values]);

    return result.rows.length > 0;

  } catch (error) {
    console.error('Error updating SEO page:', error);
    return false;
  }
}

/**
 * Delete SEO page
 */
export async function deleteSEOPage(partnerSlug: string, neighborhoodSlug: string): Promise<boolean> {
  try {
    const result = await pool.query(`
      DELETE FROM partner_seo_pages
      WHERE partner_slug = $1 AND neighborhood_slug = $2
      RETURNING id
    `, [partnerSlug, neighborhoodSlug]);

    return result.rows.length > 0;

  } catch (error) {
    console.error('Error deleting SEO page:', error);
    return false;
  }
}

/**
 * Bulk generate SEO pages for all partner service areas
 */
export async function generateAllPartnerSEOPages(partnerSlug: string): Promise<{
  success: boolean;
  generated: number;
  errors: string[];
}> {
  try {
    // Get partner's service area
    const partnerResult = await pool.query(`
      SELECT service_area FROM business_partners WHERE id = $1
    `, [partnerSlug]);

    if (partnerResult.rows.length === 0) {
      return { success: false, generated: 0, errors: ['Partner not found'] };
    }

    const serviceAreaString = partnerResult.rows[0].service_area || '';
    const serviceAreas = serviceAreaString.split(',').map((area: string) => area.trim()).filter(Boolean);
    
    if (serviceAreas.length === 0) {
      return { success: false, generated: 0, errors: ['No service areas defined for partner'] };
    }

    return await generatePartnerSEOPages(partnerSlug, serviceAreas);

  } catch (error: any) {
    return { 
      success: false, 
      generated: 0, 
      errors: [`Error generating all SEO pages: ${error.message}`] 
    };
  }
}