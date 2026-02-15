/**
 * Monday.com Integration
 * API key auth, board/item sync, status push, item creation
 */
import type { Express } from "express";
import { requireConnection, storeConnection, logSync } from "./crm-helpers";
import { upsertContactMapping, mapCrmContact } from "../../services/crm-sync";

const PLATFORM = "monday" as const;
const MONDAY_API = "https://api.monday.com/v2";

async function mondayQuery(apiToken: string, query: string, variables?: Record<string, any>) {
  const resp = await fetch(MONDAY_API, {
    method: "POST",
    headers: { Authorization: apiToken, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  if (!resp.ok) throw new Error(`Monday.com API error ${resp.status}: ${await resp.text()}`);
  const json = await resp.json() as any;
  if (json.errors?.length) throw new Error(`Monday.com GraphQL error: ${JSON.stringify(json.errors)}`);
  return json.data;
}

export function registerMondayRoutes(app: Express) {
  app.post("/api/integrations/monday/connect", async (req, res) => {
    try {
      const { businessAccountId, apiToken } = req.body;
      if (!businessAccountId || !apiToken) return res.status(400).json({ error: "businessAccountId and apiToken required" });

      // Verify token
      const data = await mondayQuery(apiToken, "{ me { id name email } }");
      const connId = await storeConnection(businessAccountId, PLATFORM, { apiToken, userId: data.me.id, userName: data.me.name });
      res.json({ success: true, connectionId: connId, user: data.me });
    } catch (error: any) {
      console.error("[Monday] Connect error:", error);
      res.status(500).json({ error: "Failed to connect Monday.com", message: error.message });
    }
  });

  app.post("/api/integrations/monday/sync-boards", async (req, res) => {
    try {
      const ctx = await requireConnection(req, res, PLATFORM);
      if (!ctx) return;
      const { credentials, connection } = ctx;

      const data = await mondayQuery(credentials.apiToken, `{
        boards(limit: 50) {
          id name description
          items_page(limit: 200) {
            items { id name column_values { id text value } subitems { id name } }
          }
        }
      }`);

      let synced = 0;
      for (const board of data.boards || []) {
        for (const item of board.items_page?.items || []) {
          const mapped = mapCrmContact(PLATFORM, { ...item, boardId: board.id, boardName: board.name });
          await upsertContactMapping(req.body.businessAccountId, PLATFORM, mapped.externalId, { ...item, boardId: board.id });
          synced++;
        }
      }

      await logSync(connection.id, PLATFORM, "sync-boards", "success", synced, { boards: data.boards?.length || 0 });
      res.json({ success: true, synced, boards: (data.boards || []).map((b: any) => ({ id: b.id, name: b.name, itemCount: b.items_page?.items?.length || 0 })) });
    } catch (error: any) {
      console.error("[Monday] Sync error:", error);
      res.status(500).json({ error: "Failed to sync boards", message: error.message });
    }
  });

  app.post("/api/integrations/monday/push-update", async (req, res) => {
    try {
      const ctx = await requireConnection(req, res, PLATFORM);
      if (!ctx) return;
      const { credentials, connection } = ctx;
      const { itemId, body: updateBody } = req.body;
      if (!itemId) return res.status(400).json({ error: "itemId required" });

      const data = await mondayQuery(credentials.apiToken, `mutation { create_update(item_id: ${itemId}, body: "${(updateBody || "Job completed via UpTend").replace(/"/g, '\\"')}") { id } }`);
      await logSync(connection.id, PLATFORM, "push-update", "success", 1);
      res.json({ success: true, updateId: data.create_update?.id });
    } catch (error: any) {
      console.error("[Monday] Push update error:", error);
      res.status(500).json({ error: "Failed to push update", message: error.message });
    }
  });

  app.post("/api/integrations/monday/create-item", async (req, res) => {
    try {
      const ctx = await requireConnection(req, res, PLATFORM);
      if (!ctx) return;
      const { credentials, connection } = ctx;
      const { boardId, itemName, columnValues } = req.body;
      if (!boardId || !itemName) return res.status(400).json({ error: "boardId and itemName required" });

      const colVals = columnValues ? `, column_values: "${JSON.stringify(columnValues).replace(/"/g, '\\"')}"` : "";
      const data = await mondayQuery(credentials.apiToken, `mutation { create_item(board_id: ${boardId}, item_name: "${itemName.replace(/"/g, '\\"')}"${colVals}) { id name } }`);
      await logSync(connection.id, PLATFORM, "create-item", "success", 1);
      res.json({ success: true, item: data.create_item });
    } catch (error: any) {
      console.error("[Monday] Create item error:", error);
      res.status(500).json({ error: "Failed to create item", message: error.message });
    }
  });
}
