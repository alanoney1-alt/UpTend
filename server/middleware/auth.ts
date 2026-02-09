export const requireAuth = (req: any, res: any, next: any) => { next(); };
export const requireAdmin = (req: any, res: any, next: any) => { next(); };
export default { requireAuth, requireAdmin };
