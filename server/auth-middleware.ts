import type { Request, Response, NextFunction, RequestHandler } from "express";

interface AuthUser {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  [key: string]: any;
}

export const requireAuth: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as AuthUser | undefined;
  if (!user) {
    return res.status(401).json({ 
      error: "Authentication required",
      message: "You must be logged in to access this resource"
    });
  }
  next();
};

export const requireAdmin: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as AuthUser | undefined;
  if (!user) {
    return res.status(401).json({ 
      error: "Authentication required",
      message: "You must be logged in to access this resource"
    });
  }
  
  if (user.role !== "admin") {
    return res.status(403).json({ 
      error: "Admin access required",
      message: "You do not have permission to access this resource"
    });
  }
  
  next();
};

export const requireHauler: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as AuthUser | undefined;
  if (!user) {
    return res.status(401).json({ 
      error: "Authentication required",
      message: "You must be logged in to access this resource"
    });
  }
  
  if (user.role !== "hauler" && user.role !== "admin") {
    return res.status(403).json({ 
      error: "Hauler access required",
      message: "You must be a PYCKER to access this resource"
    });
  }
  
  next();
};

export const requireCustomer: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as AuthUser | undefined;
  if (!user) {
    return res.status(401).json({ 
      error: "Authentication required",
      message: "You must be logged in to access this resource"
    });
  }
  
  if (user.role !== "customer" && user.role !== "admin") {
    return res.status(403).json({ 
      error: "Customer access required",
      message: "You must be a customer to access this resource"
    });
  }
  
  next();
};

export function requireOwnership(paramName: string): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as AuthUser | undefined;
    if (!user) {
      return res.status(401).json({ 
        error: "Authentication required",
        message: "You must be logged in to access this resource"
      });
    }
    
    const resourceUserId = req.params[paramName];
    
    if (user.role === "admin") {
      return next();
    }
    
    if (user.id !== resourceUserId) {
      return res.status(403).json({ 
        error: "Access denied",
        message: "You can only access your own resources"
      });
    }
    
    next();
  };
}

export const requireHaulerOwnership: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as AuthUser | undefined;
  if (!user) {
    return res.status(401).json({ 
      error: "Authentication required",
      message: "You must be logged in to access this resource"
    });
  }
  
  if (user.role === "admin") {
    return next();
  }
  
  if (user.role !== "hauler") {
    return res.status(403).json({ 
      error: "Hauler access required",
      message: "You must be a PYCKER to access this resource"
    });
  }
  
  next();
};

export const optionalAuth: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  next();
};
