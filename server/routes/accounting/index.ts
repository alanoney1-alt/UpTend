import type { Express } from "express";
import { registerLedgerRoutes } from "./ledger.routes";
import { registerInvoicingRoutes } from "./invoicing.routes";
import { registerTaxRoutes } from "./tax.routes";
import { registerExpensesRoutes } from "./expenses.routes";
import { registerReportsRoutes } from "./reports.routes";

export function registerAccountingRoutes(app: Express): void {
  registerLedgerRoutes(app);
  registerInvoicingRoutes(app);
  registerTaxRoutes(app);
  registerExpensesRoutes(app);
  registerReportsRoutes(app);
}
