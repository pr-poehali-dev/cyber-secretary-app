// ─── Types ────────────────────────────────────────────────────────────────────

export type Section =
  | "dashboard"
  | "planning"
  | "clients"
  | "petitions"
  | "deadlines"
  | "investigations"
  | "analytics"
  | "settings";

export interface Task {
  id: number;
  title: string;
  type: "court" | "investigation" | "task" | "reminder";
  time: string;
  client: string;
  done: boolean;
  urgent?: boolean;
}

export interface Client {
  id: number;
  name: string;
  type: "paid" | "article51";
  caseNumber: string;
  status: "active" | "closed" | "appeal";
  nextDate: string;
  totalBilled: number;
  lastContact: string;
  category: string;
  investigator: string;
  investigatorPhone: string;
  investigatorOffice: string;
  agency: string;
}

export interface InvestigationAction {
  id: number;
  client: string;
  action: string;
  date: string;
  location: string;
  done: boolean;
  type: "допрос" | "обыск" | "очная ставка" | "экспертиза" | "ознакомление";
}

export interface Deadline {
  id: number;
  title: string;
  client: string;
  daysLeft: number;
  type: "appeal" | "complaint" | "motion" | "response";
  date: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

export const todayTasks: Task[] = [
  { id: 1, title: "Судебное заседание по делу Иванова А.В.", type: "court", time: "09:30", client: "Иванов А.В.", done: false, urgent: true },
  { id: 2, title: "Следственный допрос Петровой М.С.", type: "investigation", time: "11:00", client: "Петрова М.С.", done: false },
  { id: 3, title: "Подготовить ходатайство об изменении меры пресечения", type: "task", time: "13:00", client: "Сидоров К.Н.", done: true },
  { id: 4, title: "Апелляционная жалоба — срок завтра", type: "reminder", time: "15:30", client: "Носова Е.В.", done: false, urgent: true },
  { id: 5, title: "Консультация нового доверителя", type: "task", time: "17:00", client: "Громов П.И.", done: false },
  { id: 6, title: "Ознакомление с материалами дела т.4", type: "investigation", time: "10:00", client: "Кузнецов Р.А.", done: true },
];

export const allClients: Client[] = [
  { id: 1, name: "Иванов Алексей Владимирович", type: "paid", caseNumber: "1-245/2024", status: "active", nextDate: "12.04.2026", totalBilled: 185000, lastContact: "08.04.2026", category: "Мошенничество (ст. 159)", investigator: "Соколов Дмитрий Игоревич", investigatorPhone: "+7 (495) 624-11-32", investigatorOffice: "каб. 214", agency: "СК России по ЦАО г. Москвы" },
  { id: 2, name: "Петрова Мария Сергеевна", type: "article51", caseNumber: "1-118/2024", status: "active", nextDate: "15.04.2026", totalBilled: 0, lastContact: "07.04.2026", category: "Кража (ст. 158)", investigator: "Морозова Анна Викторовна", investigatorPhone: "+7 (495) 332-08-55", investigatorOffice: "каб. 107", agency: "ОП №3 УМВД России по г. Москве" },
  { id: 3, name: "Сидоров Константин Николаевич", type: "paid", caseNumber: "1-302/2024", status: "appeal", nextDate: "20.04.2026", totalBilled: 240000, lastContact: "05.04.2026", category: "Растрата (ст. 160)", investigator: "Крылов Павел Сергеевич", investigatorPhone: "+7 (495) 719-44-21", investigatorOffice: "каб. 318", agency: "СК России по ЮЗАО г. Москвы" },
  { id: 4, name: "Носова Екатерина Васильевна", type: "paid", caseNumber: "1-089/2024", status: "appeal", nextDate: "10.04.2026", totalBilled: 95000, lastContact: "09.04.2026", category: "ДТП (ст. 264)", investigator: "Лебедев Игорь Константинович", investigatorPhone: "+7 (495) 246-77-03", investigatorOffice: "каб. 12", agency: "ОМВД России по р-ну Хамовники" },
  { id: 5, name: "Громов Павел Игоревич", type: "article51", caseNumber: "1-401/2025", status: "active", nextDate: "18.04.2026", totalBilled: 0, lastContact: "09.04.2026", category: "Грабёж (ст. 161)", investigator: "Волков Артём Николаевич", investigatorPhone: "+7 (495) 381-90-14", investigatorOffice: "каб. 107", agency: "СК России по ЮАО г. Москвы" },
  { id: 6, name: "Кузнецов Роман Алексеевич", type: "paid", caseNumber: "1-156/2025", status: "closed", nextDate: "—", totalBilled: 320000, lastContact: "01.04.2026", category: "Наркотики (ст. 228)", investigator: "Зайцева Ольга Михайловна", investigatorPhone: "+7 (495) 917-55-88", investigatorOffice: "каб. 205", agency: "УФСКН России по г. Москве" },
];

export const allInvestigations: InvestigationAction[] = [
  { id: 1, client: "Иванов А.В.", action: "Допрос обвиняемого", date: "10.04.2026", location: "СК по ЦАО, каб. 214", done: false, type: "допрос" },
  { id: 2, client: "Петрова М.С.", action: "Допрос подозреваемой", date: "09.04.2026", location: "ОП №3 Москвы", done: false, type: "допрос" },
  { id: 3, client: "Сидоров К.Н.", action: "Обыск по месту жительства", date: "05.04.2026", location: "Ленинский пр., 48", done: true, type: "обыск" },
  { id: 4, client: "Носова Е.В.", action: "Автотехническая экспертиза", date: "03.04.2026", location: "ЭКЦ ГУ МВД", done: true, type: "экспертиза" },
  { id: 5, client: "Громов П.И.", action: "Очная ставка с потерпевшим", date: "12.04.2026", location: "СК по ЮАО, каб. 107", done: false, type: "очная ставка" },
  { id: 6, client: "Кузнецов Р.А.", action: "Ознакомление с материалами дела", date: "08.04.2026", location: "Следственный изолятор №2", done: true, type: "ознакомление" },
  { id: 7, client: "Иванов А.В.", action: "Ознакомление с заключением эксперта", date: "15.04.2026", location: "СК по ЦАО, каб. 214", done: false, type: "ознакомление" },
];

export const allDeadlines: Deadline[] = [
  { id: 1, title: "Апелляционная жалоба на приговор", client: "Носова Е.В.", daysLeft: 1, type: "appeal", date: "10.04.2026" },
  { id: 2, title: "Кассационная жалоба", client: "Сидоров К.Н.", daysLeft: 5, type: "complaint", date: "14.04.2026" },
  { id: 3, title: "Ходатайство о прекращении дела", client: "Петрова М.С.", daysLeft: 8, type: "motion", date: "17.04.2026" },
  { id: 4, title: "Отзыв на исковое заявление", client: "Иванов А.В.", daysLeft: 12, type: "response", date: "21.04.2026" },
  { id: 5, title: "Апелляция на постановление об аресте", client: "Громов П.И.", daysLeft: 18, type: "appeal", date: "27.04.2026" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const taskTypeConfig = {
  court: { icon: "Scale", color: "text-blue-600", label: "Суд" },
  investigation: { icon: "Search", color: "text-purple-600", label: "Следственное" },
  task: { icon: "FileText", color: "text-slate-500", label: "Задача" },
  reminder: { icon: "Bell", color: "text-amber-500", label: "Напоминание" },
};