declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username?: string | null;
        email?: string | null;
        role: string;
        firstName?: string | null;
        lastName?: string | null;
        profileImageUrl?: string | null;
        password?: string | null;
        phone?: string | null;
        currentLat?: number | null;
        currentLng?: number | null;
        lastLocationUpdate?: string | null;
        stripeCustomerId?: string | null;
        totalJobsCompleted?: number | null;
        createdAt?: Date | null;
        updatedAt?: Date | null;
      };
    }
  }
}

export {};
