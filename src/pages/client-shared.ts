// Общие типы и утилиты для разделов Доверители и Ходатайства

import type { Client } from "./types-and-data";

export type { Client };

export type EditableFields = Pick<
  Client,
  "investigator" | "investigatorPhone" | "investigatorOffice" | "agency" | "nextDate"
>;

export type ClientWithHistory = Client & {
  history: { id: number; note: string; event_date: string }[];
};

export function toClient(r: any): ClientWithHistory { // eslint-disable-line @typescript-eslint/no-explicit-any
  return {
    id: r.id, name: r.name, type: r.type, caseNumber: r.case_number,
    status: r.status, nextDate: r.next_date, totalBilled: r.total_billed,
    lastContact: r.last_contact, category: r.category,
    investigator: r.investigator, investigatorPhone: r.investigator_phone,
    investigatorOffice: r.investigator_office, agency: r.agency,
    history: r.history || [],
  };
}
