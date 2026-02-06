"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.can = can;
const permissions_1 = require("./permissions");
function can(role, permission) {
    if (!role)
        return false;
    return permissions_1.permissions[permission].includes(role);
}
//# sourceMappingURL=can.js.map