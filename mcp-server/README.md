# UpTend MCP Server

Model Context Protocol (MCP) server that lets **Claude Desktop** and other MCP clients find and book home service pros in Orlando through UpTend.

## Setup

```bash
cd mcp-server
npm install
```

### Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "uptend": {
      "command": "node",
      "args": ["/path/to/uptend-openclaw/mcp-server/index.js"]
    }
  }
}
```

Restart Claude Desktop. You'll see UpTend tools available in the tools menu.

### Other MCP Clients

Any MCP-compatible client can connect via stdio transport.

## Available Tools

| Tool | Description |
|------|-------------|
| `find_pro` | Find a vetted pro by service + location |
| `get_pricing` | Get Orlando pricing for any service |
| `request_service` | Submit a service request (HVAC live, others waitlisted) |
| `list_services` | List all services and their status |
| `get_partner` | Get partner company details |

## Example

"Find me an HVAC tech in Lake Nona" →
1. Claude calls `find_pro(service="hvac", neighborhood="Lake Nona")`
2. Returns Comfort Solutions Tech with pricing
3. Claude asks for name + phone
4. Claude calls `request_service(name, phone, service, issue)`
5. Tech calls customer back within 1 hour

## How It Works

The MCP server calls UpTend's public Discovery API (`uptendapp.com/api/discover/*`). No API key needed. All requests are unauthenticated.

HVAC is live now. Other services return a waitlist confirmation.
