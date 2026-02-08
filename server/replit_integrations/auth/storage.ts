import { users, type User, type UpsertUser } from "@shared/models/auth";
import { db } from "../../db";
import { eq } from "drizzle-orm";

// Interface for auth storage operations
// (IMPORTANT) These user operations are mandatory for Replit Auth.
export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
}

class AuthStorage implements IAuthStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // Generate username from email or ID if not provided (for legacy schema compatibility)
    const username = (userData as any).username || 
      (userData.email ? userData.email.split('@')[0] : userData.id?.substring(0, 8)) || 
      `user_${Date.now()}`;
    
    const dataWithUsername = {
      ...userData,
      username,
      name: userData.firstName && userData.lastName 
        ? `${userData.firstName} ${userData.lastName}` 
        : username,
      password: (userData as any).password || '',
    };

    const [user] = await db
      .insert(users)
      .values(dataWithUsername as any)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...dataWithUsername,
          updatedAt: new Date(),
        } as any,
      })
      .returning();
    return user;
  }
}

export const authStorage = new AuthStorage();
