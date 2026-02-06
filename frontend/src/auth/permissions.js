"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.permissions = void 0;
exports.permissions = {
    BUILDING_CREATE: ["OWNER", "ADMIN"],
    FLOOR_CREATE: ["OWNER", "ADMIN"],
    SEAT_CREATE: ["OWNER", "ADMIN"],
    SEAT_LOCK: ["OWNER", "ADMIN"],
    SEAT_ASSIGN_SELF: ["EMPLOYEE", "MANAGER", "HR", "ADMIN", "OWNER"],
    SEAT_ASSIGN_OTHERS: ["OWNER", "ADMIN", "HR"],
    SEAT_REASSIGN: ["OWNER", "ADMIN", "HR"],
    VIEW_AUDIT_LOGS: ["OWNER", "ADMIN"],
    EXPORT_AUDIT: ["OWNER", "ADMIN"],
};
//# sourceMappingURL=permissions.js.map