/**
 * Shopping Assistant Service - compiles shopping lists, manages DIY projects,
 * and creates full project plans with product links and tutorials.
 */

import { pool } from "../db";
import { getSmartRecommendations, searchProduct } from "./product-search.js";
import { findTutorial, getDIYProjectPlan, getSeasonalDIYProjects } from "./tutorial-finder.js";

// ─── Dangerous DIY flags ─────────────────────
const DANGEROUS_TASKS = [
 "electrical", "wiring", "circuit", "gas line", "gas pipe",
 "roof repair", "roofing", "garage door spring", "torsion spring",
 "tree removal", "structural", "load bearing", "asbestos", "lead paint",
];

function getDangerWarning(task: string): string | null {
 const lower = task.toLowerCase();
 for (const d of DANGEROUS_TASKS) {
 if (lower.includes(d)) {
 return ` I found a tutorial, but honestly? This one's dangerous to DIY. Let me get you a pro quote - it's worth the safety.`;
 }
 }
 return null;
}

// ─── Exported functions ──────────────────────

export async function getShoppingList(customerId: string): Promise<object> {
 // 1. Get smart recommendations (overdue maintenance + seasonal)
 const smartRecs = await getSmartRecommendations(customerId) as any;

 // 2. Get active DIY project items
 let projectItems: any[] = [];
 try {
 const result = await pool.query(
 `SELECT * FROM diy_projects WHERE customer_id = $1 AND status IN ('planning', 'shopping') ORDER BY created_at DESC`,
 [customerId]
 );
 for (const project of result.rows) {
 const items = typeof project.items_needed === "string"
 ? JSON.parse(project.items_needed)
 : project.items_needed || [];
 for (const item of items) {
 if (!item.purchased) {
 projectItems.push({
 ...item,
 projectName: project.project_name,
 projectId: project.id,
 });
 }
 }
 }
 } catch {}

 // 3. Compile and sort
 const urgentItems = (smartRecs.recommendations || []).filter((r: any) => r.priority === "urgent");
 const soonItems = (smartRecs.recommendations || []).filter((r: any) => r.priority === "soon");
 const optionalItems = (smartRecs.recommendations || []).filter((r: any) => r.priority === "optional");

 return {
 urgent: urgentItems,
 soon: soonItems,
 optional: optionalItems,
 projectSupplies: projectItems,
 totalItems: urgentItems.length + soonItems.length + optionalItems.length + projectItems.length,
 message: ` **Your Shopping List:**\n${
 urgentItems.length ? `\n **Urgent:**\n${urgentItems.map((i: any) => `• ${i.item} (~${i.estimatedCost})`).join("\n")}` : ""
 }${
 soonItems.length ? `\n **Soon:**\n${soonItems.map((i: any) => `• ${i.item} (~${i.estimatedCost})`).join("\n")}` : ""
 }${
 optionalItems.length ? `\n **Optional:**\n${optionalItems.map((i: any) => `• ${i.item} (~${i.estimatedCost})`).join("\n")}` : ""
 }${
 projectItems.length ? `\n **DIY Project Supplies:**\n${projectItems.map((i: any) => `• ${i.name} for "${i.projectName}" (~$${i.estimatedCost || "?"})`).join("\n")}` : ""
 }${
 urgentItems.length + soonItems.length + optionalItems.length + projectItems.length === 0
 ? "\n Your home is well-stocked! Nothing urgent right now."
 : ""
 }`,
 };
}

export async function startDIYProject(
 customerId: string,
 projectName: string,
 items: Array<{ name: string; specifications?: string; estimatedCost?: number }>,
 tutorials: string[]
): Promise<object> {
 const dangerWarning = getDangerWarning(projectName);

 try {
 const result = await pool.query(
 `INSERT INTO diy_projects (customer_id, project_name, status, items_needed, tutorials_linked, estimated_total_cost, created_at)
 VALUES ($1, $2, $3, $4, $5, $6, NOW())
 RETURNING id`,
 [
 customerId,
 projectName,
 "planning",
 JSON.stringify(items.map(i => ({ ...i, purchased: false }))),
 JSON.stringify(tutorials),
 items.reduce((sum, i) => sum + (i.estimatedCost || 0), 0),
 ]
 );

 return {
 projectId: result.rows[0].id,
 projectName,
 status: "planning",
 items,
 tutorials,
 dangerWarning,
 message: dangerWarning
 ? `${dangerWarning}\n\nI created the project "${projectName}" but strongly recommend getting a pro for this one.`
 : ` Project "${projectName}" created! ${items.length} items on your shopping list. Ready to start shopping?`,
 };
 } catch (err) {
 return { message: `Failed to create project: ${err}` };
 }
}

export async function updateDIYProject(
 projectId: number,
 status?: string,
 notes?: string
): Promise<object> {
 try {
 const updates: string[] = [];
 const values: any[] = [];
 let idx = 1;

 if (status) {
 updates.push(`status = $${idx++}`);
 values.push(status);
 if (status === "in_progress") {
 updates.push(`started_at = NOW()`);
 } else if (status === "completed") {
 updates.push(`completed_at = NOW()`);
 }
 }
 if (notes) {
 updates.push(`notes = $${idx++}`);
 values.push(notes);
 }

 values.push(projectId);
 await pool.query(
 `UPDATE diy_projects SET ${updates.join(", ")} WHERE id = $${idx}`,
 values
 );

 return {
 projectId,
 status,
 message: status === "completed"
 ? ` Nice work! Project marked as completed. How did it go?`
 : ` Project updated${status ? ` - status: ${status}` : ""}${notes ? ` - notes added` : ""}.`,
 };
 } catch (err) {
 return { message: `Failed to update project: ${err}` };
 }
}

export async function getProjectPlan(
 customerId: string,
 description: string
): Promise<object> {
 const dangerWarning = getDangerWarning(description);

 // Get DIY plan with tutorials
 const plan = await getDIYProjectPlan(description) as any;

 // Search for products
 const productSearches = (plan.productsToBuy || []).map((p: any) =>
 searchProduct(p.name).then(r => ({ ...p, searchResults: r.results.slice(0, 3) }))
 );
 const productsWithLinks = await Promise.all(productSearches);

 // Compile items for project creation
 const items = productsWithLinks.map((p: any) => ({
 name: p.name,
 estimatedCost: p.estimatedCost,
 purchased: false,
 purchaseUrl: p.searchResults?.[0]?.affiliateUrl || p.searchResults?.[0]?.url || "",
 }));

 const tutorials = (plan.tutorials || []).map((t: any) => t.videoId).filter(Boolean);

 return {
 description,
 plan,
 productsWithLinks,
 items,
 tutorials,
 dangerWarning: dangerWarning || plan.dangerWarning,
 estimatedTotalCost: items.reduce((s: number, i: any) => s + (i.estimatedCost || 0), 0),
 message: dangerWarning || plan.dangerWarning
 ? `${dangerWarning || plan.dangerWarning}\n\n${plan.message}`
 : plan.message + `\n\n **Estimated total:** ~$${items.reduce((s: number, i: any) => s + (i.estimatedCost || 0), 0)}\n\nWant me to create this as a tracked project?`,
 };
}
