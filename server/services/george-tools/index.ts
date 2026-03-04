/**
 * George Tools - Domain Module Index
 * Re-exports all tools from domain-specific modules.
 * Single import point: import { ... } from "./george-tools"
 */
export * from "./consumer";
export * from "./home";
export * from "./partner";
export * from "./b2b";

// Also re-export everything from the original file for backward compatibility
export * from "../george-tools";
