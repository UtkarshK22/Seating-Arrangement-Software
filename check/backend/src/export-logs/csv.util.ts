import { stringify } from "csv-stringify/sync";

export function seatAuditToCSV(rows: any[]) {
  return stringify(rows, {
    header: true,
    columns: [
      "seatCode",
      "action",
      "userEmail",
      "actorEmail",
      "createdAt",
    ],
  });
}
