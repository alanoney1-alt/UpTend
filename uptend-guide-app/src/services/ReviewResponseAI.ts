// ReviewResponseAI.ts — AI-powered review response drafting
import { guideChat } from '../api/client';

export type ResponseTone = 'grateful' | 'apologetic' | 'professional' | 'friendly';

export interface Review {
  id: string;
  customerName: string;
  rating: number;
  text: string;
  serviceType: string;
  date: Date;
  response?: string;
  responseDraft?: string;
  responded: boolean;
}

const MOCK_REVIEWS: Review[] = [
  { id: 'r1', customerName: 'Sarah M.', rating: 5, text: 'Amazing job on the yard! Looks better than ever. Will definitely book again.', serviceType: 'Lawn Care', date: new Date(Date.now() - 86400000), responded: false },
  { id: 'r2', customerName: 'James K.', rating: 4, text: 'Good pressure washing, but arrived 20 minutes late. Otherwise great work.', serviceType: 'Pressure Washing', date: new Date(Date.now() - 172800000), responded: false },
  { id: 'r3', customerName: 'Maria L.', rating: 3, text: 'The junk removal was okay but they left some small debris behind. Had to clean up a bit after.', serviceType: 'Junk Removal', date: new Date(Date.now() - 259200000), responded: false },
  { id: 'r4', customerName: 'David W.', rating: 5, text: 'Best handyman service in Orlando! Fixed everything on my list in one visit.', serviceType: 'Handyman', date: new Date(Date.now() - 432000000), responded: true, response: 'Thank you David! It was great working with you. Looking forward to helping again!' },
];

const TONE_PROMPTS: Record<ResponseTone, string> = {
  grateful: 'Write a grateful and warm response',
  apologetic: 'Write an apologetic and empathetic response acknowledging the issue',
  professional: 'Write a professional and courteous response',
  friendly: 'Write a friendly and casual response',
};

class ReviewResponseAIService {
  getReviews(): Review[] {
    return MOCK_REVIEWS;
  }

  getUnrespondedReviews(): Review[] {
    return MOCK_REVIEWS.filter(r => !r.responded);
  }

  async generateResponse(review: Review, tone: ResponseTone): Promise<string> {
    try {
      const prompt = `${TONE_PROMPTS[tone]} to this ${review.rating}-star review for ${review.serviceType} service: "${review.text}". Keep it under 3 sentences. Do not use the customer's full name.`;
      const response = await guideChat(prompt, { context: 'review_response' });
      return response.message || this.getFallbackResponse(review, tone);
    } catch {
      return this.getFallbackResponse(review, tone);
    }
  }

  private getFallbackResponse(review: Review, tone: ResponseTone): string {
    if (review.rating >= 4) {
      if (tone === 'grateful') return `Thank you so much for the kind words! We're thrilled you loved our ${review.serviceType.toLowerCase()} service. Can't wait to work with you again! 🙏`;
      if (tone === 'friendly') return `Hey thanks! Really glad you're happy with the ${review.serviceType.toLowerCase()}. See you next time! 😊`;
      return `Thank you for your positive feedback regarding our ${review.serviceType.toLowerCase()} service. We appreciate your trust in UpTend.`;
    }
    if (tone === 'apologetic') return `We sincerely apologize for the experience. Your feedback about our ${review.serviceType.toLowerCase()} service is noted and we're taking steps to improve. We'd love the chance to make it right.`;
    return `Thank you for your honest feedback. We take all reviews seriously and will use your comments to improve our ${review.serviceType.toLowerCase()} service.`;
  }

  async submitResponse(reviewId: string, response: string): Promise<void> {
    const review = MOCK_REVIEWS.find(r => r.id === reviewId);
    if (review) {
      review.response = response;
      review.responded = true;
    }
  }
}

export const reviewResponseAI = new ReviewResponseAIService();
