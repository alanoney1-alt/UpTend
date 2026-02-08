/**
 * Storage Module - Main Entry Point
 *
 * This module provides the unified storage interface for the entire application.
 * It exports:
 * - DatabaseStorage class: The composition layer that implements IStorage
 * - IStorage interface: The type definition for storage operations
 * - storage singleton: A pre-instantiated DatabaseStorage instance for convenience
 *
 * Usage:
 * ```typescript
 * // Import the singleton instance (recommended for most use cases)
 * import { storage } from "./storage";
 * const user = await storage.getUser("123");
 *
 * // Import the interface for type definitions
 * import type { IStorage } from "./storage";
 *
 * // Import the class to create custom instances (testing, etc.)
 * import { DatabaseStorage } from "./storage";
 * const customStorage = new DatabaseStorage();
 * ```
 *
 * This maintains backward compatibility with existing code that imports
 * `storage` from `./storage` while providing the new modular architecture.
 */

// Export the composition class
export { DatabaseStorage } from "./impl/database-storage";

// Export the interface for type checking
export type { IStorage } from "./interface";

// Create and export singleton instance for backward compatibility
import { DatabaseStorage } from "./impl/database-storage";
export const storage = new DatabaseStorage();
