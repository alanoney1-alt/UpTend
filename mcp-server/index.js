#!/usr/bin/env node
/**
 * UpTend MCP Server
 * 
 * Model Context Protocol server for Claude Desktop and other MCP clients.
 * Lets Claude find and book home service pros in Orlando through UpTend.
 * 
 * Tools:
 * - find_pro: Search for a pro by service + location
 * - get_pricing: Get pricing for a service in Orlando
 * - request_service: Submit a service request (book HVAC, waitlist others)
 * - list_services: List all available services and their status
 * - get_partner: Get details about a specific partner
 * 
 * Setup:
 *   npm install
 *   Add to Claude Desktop config:
 *   {
 *     "mcpServers": {
 *       "uptend": {
 *         "command": "node",
 *         "args": ["/path/to/uptend-openclaw/mcp-server/index.js"]
 *       }
 *     }
 *   }
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const API_BASE = "https://uptendapp.com/api/discover";

// ═══════════════════════════════════════════
// MCP Server
// ═══════════════════════════════════════════

const server = new Server(
  {
    name: "uptend",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// ═══════════════════════════════════════════
// Tool Definitions
// ═══════════════════════════════════════════

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "find_pro",
      description: "Find a vetted, licensed home service professional in Orlando Metro. HVAC is live now — other services coming soon. Returns matched pros with pricing and contact info.",
      inputSchema: {
        type: "object",
        properties: {
          service: {
            type: "string",
            description: "Service type: hvac, plumbing, electrical, junk_removal, pressure_washing, home_cleaning, handyman, landscaping, pool_cleaning, painting, etc.",
          },
          zip: {
            type: "string",
            description: "ZIP code (e.g., 32827). Optional — defaults to Orlando Metro.",
          },
          neighborhood: {
            type: "string",
            description: "Neighborhood name (e.g., Lake Nona, Windermere). Optional.",
          },
        },
        required: ["service"],
      },
    },
    {
      name: "get_pricing",
      description: "Get typical pricing for a home service in Orlando. Returns price ranges for common jobs.",
      inputSchema: {
        type: "object",
        properties: {
          service: {
            type: "string",
            description: "Service type (e.g., hvac, plumbing, electrical)",
          },
        },
        required: ["service"],
      },
    },
    {
      name: "request_service",
      description: "Submit a service request to connect a customer with a pro. HVAC: tech calls back within 1 hour. Other services: customer gets waitlisted. ALWAYS collect name and phone before calling this.",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string", description: "Customer's full name (required)" },
          phone: { type: "string", description: "Customer's phone number (required — this is how the tech calls back)" },
          email: { type: "string", description: "Customer's email (optional)" },
          address: { type: "string", description: "Service address" },
          zip: { type: "string", description: "ZIP code" },
          service: { type: "string", description: "Service type (e.g., hvac)" },
          issue: { type: "string", description: "Description of the problem" },
          neighborhood: { type: "string", description: "Neighborhood name" },
        },
        required: ["name", "phone"],
      },
    },
    {
      name: "list_services",
      description: "List all home services UpTend offers and which ones are currently live vs coming soon.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    {
      name: "get_partner",
      description: "Get details about a specific UpTend partner company (services, phone, ratings).",
      inputSchema: {
        type: "object",
        properties: {
          slug: { type: "string", description: "Partner URL slug (e.g., comfort-solutions-tech)" },
        },
        required: ["slug"],
      },
    },
  ],
}));

// ═══════════════════════════════════════════
// Tool Handlers
// ═══════════════════════════════════════════

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "find_pro": {
        const params = new URLSearchParams();
        if (args.service) params.set("service", args.service);
        if (args.zip) params.set("zip", args.zip);
        if (args.neighborhood) params.set("neighborhood", args.neighborhood);
        const res = await fetch(`${API_BASE}/find-pro?${params}`);
        const data = await res.json();
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }

      case "get_pricing": {
        const res = await fetch(`${API_BASE}/pricing?service=${args.service || "hvac"}`);
        const data = await res.json();
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }

      case "request_service": {
        const res = await fetch(`${API_BASE}/request-service`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(args),
        });
        const data = await res.json();
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }

      case "list_services": {
        const res = await fetch(`${API_BASE}/services`);
        const data = await res.json();
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }

      case "get_partner": {
        const res = await fetch(`${API_BASE}/partner/${args.slug}`);
        const data = await res.json();
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }

      default:
        return { content: [{ type: "text", text: `Unknown tool: ${name}` }], isError: true };
    }
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error: ${error.message}. Try calling (855) 901-2072 directly.` }],
      isError: true,
    };
  }
});

// ═══════════════════════════════════════════
// Start Server
// ═══════════════════════════════════════════

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[UpTend MCP] Server running on stdio");
}

main().catch((error) => {
  console.error("[UpTend MCP] Fatal error:", error);
  process.exit(1);
});
