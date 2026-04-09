// Общие маперы для Deadlines / Investigations / Analytics
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { InvestigationAction, Deadline, Client } from "./types-and-data";

export type { InvestigationAction, Deadline, Client };

export function toInvestigation(r: any): InvestigationAction {
  return { id: r.id, client: r.client, action: r.action, date: r.date, location: r.location, done: r.done, type: r.type };
}

export function toDeadline(r: any): Deadline {
  return { id: r.id, title: r.title, client: r.client, daysLeft: r.days_left, type: r.type, date: r.date };
}

export function toClient(r: any): Client {
  return {
    id: r.id, name: r.name, type: r.type, caseNumber: r.case_number, status: r.status, nextDate: r.next_date,
    totalBilled: r.total_billed, lastContact: r.last_contact, category: r.category, investigator: r.investigator,
    investigatorPhone: r.investigator_phone, investigatorOffice: r.investigator_office, agency: r.agency,
  };
}
