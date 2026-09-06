import { DEFAULT_PERMISSIONS, ROLE_PERMISSIONS } from "../config/permissions.js";
import { Permission } from "../models/Permission.js";
import { Role } from "../models/Role.js";
import { SystemSetting } from "../models/SystemSetting.js";
import { USER_ROLES } from "../types/enums.js";

const ROLE_DESCRIPTIONS: Record<(typeof USER_ROLES)[number], string> = {
  SUPER_ADMIN: "Full system control across all clinics",
  ADMIN: "Clinic operations for assigned clinics only",
  RECEPTION: "Daily patient, visit, follow-up and appointment operations",
  DOCTOR: "Clinical access to assigned clinics via Doctor PWA",
};

export async function seedCatalog(): Promise<void> {
  await Permission.bulkWrite(
    DEFAULT_PERMISSIONS.map((permission) => ({
      updateOne: {
        filter: { key: permission.key },
        update: { $set: permission },
        upsert: true,
      },
    })),
  );

  await Role.bulkWrite(
    USER_ROLES.map((name) => ({
      updateOne: {
        filter: { name },
        update: {
          $set: {
            name,
            description: ROLE_DESCRIPTIONS[name],
            permissions: [...ROLE_PERMISSIONS[name]],
            isSystem: true,
          },
        },
        upsert: true,
      },
    })),
  );

  await SystemSetting.findOneAndUpdate(
    { key: "app.name" },
    { $set: { key: "app.name", value: "MedFlow CRM", description: "Product name" } },
    { upsert: true },
  );
}
