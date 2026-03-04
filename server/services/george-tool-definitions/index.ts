/**
 * George Tool Definitions - Index
 * Combines all domain tool name sets for organization and lookup.
 * 
 * The actual TOOL_DEFINITIONS array remains in george-agent.ts for now,
 * but these domain sets allow categorizing tools by domain.
 */
export { CONSUMER_TOOL_NAMES, isConsumerTool } from "./consumer";
export { PARTNER_TOOL_NAMES, isPartnerTool } from "./partner";
export { B2B_TOOL_NAMES, isB2BTool } from "./b2b";

/**
 * Determine which domain a tool belongs to
 */
export function getToolDomain(name: string): "consumer" | "partner" | "b2b" | "unknown" {
  // Import lazily to avoid circular deps
  const { isConsumerTool } = require("./consumer");
  const { isPartnerTool } = require("./partner");
  const { isB2BTool } = require("./b2b");
  
  if (isB2BTool(name)) return "b2b";
  if (isPartnerTool(name)) return "partner";
  if (isConsumerTool(name)) return "consumer";
  return "unknown";
}
