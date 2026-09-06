import type { UserRole } from "./enums.js";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  permissions: string[];
  clinicIds: string[];
};

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthUser;
    }
  }
}

export {};
