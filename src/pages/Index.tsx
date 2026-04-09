/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";

// ─── Types ────────────────────────────────────────────────────────────────────

type Section =
  | "dashboard"
  | "planning"
  | "clients"
  | "petitions"
  | "deadlines"
  | "investigations"
  | "analytics";

interface Task {
  id: number;
  title: string;
  type: "court" | "investigation" | "task" | "reminder";
  time: string;
  client: string;
  done: boolean;
  urgent?: boolean;
}

interface Client {
  id: number;
  name: string;
  type: "paid" | "article51";
  caseNumber: string;
  status: "active" | "closed" | "appeal";
  nextDate: string;
  totalBilled: number;
  lastContact: string;
  category: string;
}

interface InvestigationAction {
  id: number;
  client: string;
  action: string;
  date: string;
  location: string;
  done: boolean;
  type: "допрос" | "обыск" | "очная ставка" | "экспертиза" | "ознакомление";
}

interface Deadline {
  id: number;
  title: string;
  client: string;
  daysLeft: number;
  type: "appeal" | "complaint" | "motion" | "response";
  date: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const todayTasks: Task[] = [
  { id: 1, title: "Судебное заседание по делу Иванова А.В.", type: "court", time: "09:30", client: "Иванов А.В.", done: false, urgent: true },
  { id: 2, title: "Следственный допрос Петровой М.С.", type: "investigation", time: "11:00", client: "Петрова М.С.", done: false },
  { id: 3, title: "Подготовить ходатайство об изменении меры пресечения", type: "task", time: "13:00", client: "Сидоров К.Н.", done: true },
  { id: 4, title: "Апелляционная жалоба — срок завтра", type: "reminder", time: "15:30", client: "Носова Е.В.", done: false, urgent: true },
  { id: 5, title: "Консультация нового доверителя", type: "task", time: "17:00", client: "Громов П.И.", done: false },
  { id: 6, title: "Ознакомление с материалами дела т.4", type: "investigation", time: "10:00", client: "Кузнецов Р.А.", done: true },
];

const allClients: Client[] = [
  { id: 1, name: "Иванов Алексей Владимирович", type: "paid", caseNumber: "1-245/2024", status: "active", nextDate: "12.04.2026", totalBilled: 185000, lastContact: "08.04.2026", category: "Мошенничество (ст. 159)" },
  { id: 2, name: "Петрова Мария Сергеевна", type: "article51", caseNumber: "1-118/2024", status: "active", nextDate: "15.04.2026", totalBilled: 0, lastContact: "07.04.2026", category: "Кража (ст. 158)" },
  { id: 3, name: "Сидоров Константин Николаевич", type: "paid", caseNumber: "1-302/2024", status: "appeal", nextDate: "20.04.2026", totalBilled: 240000, lastContact: "05.04.2026", category: "Растрата (ст. 160)" },
  { id: 4, name: "Носова Екатерина Васильевна", type: "paid", caseNumber: "1-089/2024", status: "appeal", nextDate: "10.04.2026", totalBilled: 95000, lastContact: "09.04.2026", category: "ДТП (ст. 264)" },
  { id: 5, name: "Громов Павел Игоревич", type: "article51", caseNumber: "1-401/2025", status: "active", nextDate: "18.04.2026", totalBilled: 0, lastContact: "09.04.2026", category: "Грабёж (ст. 161)" },
  { id: 6, name: "Кузнецов Роман Алексеевич", type: "paid", caseNumber: "1-156/2025", status: "closed", nextDate: "—", totalBilled: 320000, lastContact: "01.04.2026", category: "Наркотики (ст. 228)" },
];

const allInvestigations: InvestigationAction[] = [
  { id: 1, client: "Иванов А.В.", action: "Допрос обвиняемого", date: "10.04.2026", location: "СК по ЦАО, каб. 214", done: false, type: "допрос" },
  { id: 2, client: "Петрова М.С.", action: "Допрос подозреваемой", date: "09.04.2026", location: "ОП №3 Москвы", done: false, type: "допрос" },
  { id: 3, client: "Сидоров К.Н.", action: "Обыск по месту жительства", date: "05.04.2026", location: "Ленинский пр., 48", done: true, type: "обыск" },
  { id: 4, client: "Носова Е.В.", action: "Автотехническая экспертиза", date: "03.04.2026", location: "ЭКЦ ГУ МВД", done: true, type: "экспертиза" },
  { id: 5, client: "Громов П.И.", action: "Очная ставка с потерпевшим", date: "12.04.2026", location: "СК по ЮАО, каб. 107", done: false, type: "очная ставка" },
  { id: 6, client: "Кузнецов Р.А.", action: "Ознакомление с материалами дела", date: "08.04.2026", location: "Следственный изолятор №2", done: true, type: "ознакомление" },
  { id: 7, client: "Иванов А.В.", action: "Ознакомление с заключением эксперта", date: "15.04.2026", location: "СК по ЦАО, каб. 214", done: false, type: "ознакомление" },
];

const allDeadlines: Deadline[] = [
  { id: 1, title: "Апелляционная жалоба на приговор", client: "Носова Е.В.", daysLeft: 1, type: "appeal", date: "10.04.2026" },
  { id: 2, title: "Кассационная жалоба", client: "Сидоров К.Н.", daysLeft: 5, type: "complaint", date: "14.04.2026" },
  { id: 3, title: "Ходатайство о прекращении дела", client: "Петрова М.С.", daysLeft: 8, type: "motion", date: "17.04.2026" },
  { id: 4, title: "Отзыв на исковое заявление", client: "Иванов А.В.", daysLeft: 12, type: "response", date: "21.04.2026" },
  { id: 5, title: "Апелляция на постановление об аресте", client: "Громов П.И.", daysLeft: 18, type: "appeal", date: "27.04.2026" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const taskTypeConfig = {
  court: { icon: "Scale", color: "text-blue-600", label: "Суд" },
  investigation: { icon: "Search", color: "text-purple-600", label: "Следственное" },
  task: { icon: "FileText", color: "text-slate-500", label: "Задача" },
  reminder: { icon: "Bell", color: "text-amber-500", label: "Напоминание" },
};

// ─── Dashboard ────────────────────────────────────────────────────────────────

function DashboardSection() {
  const urgentCount = todayTasks.filter(t => t.urgent && !t.done).length;
  const doneCount = todayTasks.filter(t => t.done).length;
  const totalBilled = allClients.reduce((s, c) => s + c.totalBilled, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Задач сегодня", value: todayTasks.length, sub: `${doneCount} выполнено`, icon: "CheckSquare", color: "text-blue-600" },
          { label: "Срочно", value: urgentCount, sub: "требуют внимания", icon: "AlertTriangle", color: "text-red-500" },
          { label: "Доверители", value: allClients.length, sub: `${allClients.filter(c => c.status === "active").length} активных`, icon: "Users", color: "text-emerald-600" },
          { label: "Выставлено счетов", value: `${(totalBilled / 1000).toFixed(0)}к ₽`, sub: "в этом году", icon: "TrendingUp", color: "text-amber-600" },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border border-border p-4 card-hover">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-ibm uppercase tracking-wider">{s.label}</p>
                <p className="text-2xl font-golos font-bold text-foreground mt-1">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
              </div>
              <Icon name={s.icon as any} size={20} className={s.color} />
            </div>
          </div>
        ))}
      </div>

      {allDeadlines.filter(d => d.daysLeft <= 2).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <Icon name="AlertTriangle" size={18} className="text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="font-golos font-semibold text-red-700 text-sm">Критические сроки</p>
            {allDeadlines.filter(d => d.daysLeft <= 2).map(d => (
              <p key={d.id} className="text-sm text-red-600 mt-0.5">
                {d.client} — {d.title} ({d.daysLeft === 1 ? "завтра" : "сегодня"})
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-border overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
          <h3 className="font-golos font-semibold text-foreground">Расписание · 9 апреля 2026</h3>
          <span className="text-xs text-muted-foreground">{doneCount}/{todayTasks.length} выполнено</span>
        </div>
        <div className="divide-y divide-border">
          {todayTasks.map(task => {
            const cfg = taskTypeConfig[task.type];
            return (
              <div key={task.id} className={`flex items-center gap-4 px-5 py-3.5 ${task.done ? "opacity-50" : ""}`}>
                <span className="text-xs font-ibm text-muted-foreground w-12 shrink-0">{task.time}</span>
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${task.urgent ? "bg-red-500" : "bg-slate-300"}`} />
                <Icon name={cfg.icon as any} size={15} className={cfg.color} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-ibm ${task.done ? "line-through text-muted-foreground" : "text-foreground"}`}>{task.title}</p>
                  <p className="text-xs text-muted-foreground">{task.client}</p>
                </div>
                {task.urgent && !task.done && <span className="text-xs px-2 py-0.5 rounded status-urgent shrink-0">срочно</span>}
                <span className="text-xs px-2 py-0.5 rounded status-normal shrink-0">{cfg.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Planning ─────────────────────────────────────────────────────────────────

function PlanningSection() {
  const [tasks, setTasks] = useState<Task[]>(todayTasks);
  const toggle = (id: number) => setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const doneCount = tasks.filter(t => t.done).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-golos font-bold text-xl text-foreground">Планирование дня</h2>
          <p className="text-sm text-muted-foreground mt-0.5">9 апреля 2026 — среда</p>
        </div>
        <Button className="bg-[hsl(var(--primary))] text-white text-sm">
          <Icon name="Plus" size={15} className="mr-1.5" /> Добавить задачу
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-border p-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-ibm text-foreground">Выполнение дня</span>
          <span className="font-golos font-semibold gold-text">{Math.round((doneCount / tasks.length) * 100)}%</span>
        </div>
        <Progress value={(doneCount / tasks.length) * 100} className="h-2" />
      </div>

      {(["court", "investigation", "task", "reminder"] as const).map(type => {
        const group = tasks.filter(t => t.type === type);
        if (!group.length) return null;
        const cfg = taskTypeConfig[type];
        return (
          <div key={type} className="bg-white rounded-lg border border-border overflow-hidden">
            <div className="px-5 py-3 border-b border-border flex items-center gap-2">
              <Icon name={cfg.icon as any} size={15} className={cfg.color} />
              <span className="font-golos font-semibold text-sm">{cfg.label}</span>
              <span className="ml-auto text-xs text-muted-foreground">{group.filter(t => t.done).length}/{group.length}</span>
            </div>
            <div className="divide-y divide-border">
              {group.map(task => (
                <div key={task.id} className="flex items-center gap-4 px-5 py-3.5">
                  <Checkbox checked={task.done} onCheckedChange={() => toggle(task.id)} />
                  <span className="text-xs font-ibm text-muted-foreground w-12 shrink-0">{task.time}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-ibm ${task.done ? "line-through text-muted-foreground" : "text-foreground"}`}>{task.title}</p>
                    <p className="text-xs text-muted-foreground">{task.client}</p>
                  </div>
                  {task.urgent && <span className="text-xs px-2 py-0.5 rounded status-urgent shrink-0">срочно</span>}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Clients ──────────────────────────────────────────────────────────────────

const clientHistory = [
  { date: "08.04.2026", note: "Ознакомился с материалами дела, том 3" },
  { date: "05.04.2026", note: "Судебное заседание — отложено" },
  { date: "02.04.2026", note: "Направлено ходатайство о приобщении доказательств" },
  { date: "28.03.2026", note: "Встреча с доверителем, уточнение позиции" },
];

function ClientsSection() {
  const [filter, setFilter] = useState<"all" | "paid" | "article51" | "appeal">("all");
  const [selected, setSelected] = useState<Client | null>(null);

  const filtered = allClients.filter(c =>
    filter === "all" ? true : filter === "appeal" ? c.status === "appeal" : c.type === filter
  );

  const statusLabel = { active: "Активно", closed: "Закрыто", appeal: "Апелляция" };
  const statusStyle = { active: "status-done", closed: "status-normal", appeal: "status-paid" };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="font-golos font-bold text-xl text-foreground">Управление доверителями</h2>
        <Button className="bg-[hsl(var(--primary))] text-white text-sm">
          <Icon name="UserPlus" size={15} className="mr-1.5" /> Новый доверитель
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {([["all", "Все", allClients.length], ["paid", "Платные", allClients.filter(c => c.type === "paid").length], ["article51", "По ст. 51", allClients.filter(c => c.type === "article51").length], ["appeal", "Апелляция", allClients.filter(c => c.status === "appeal").length]] as const).map(([key, label, count]) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`px-4 py-1.5 rounded text-sm font-ibm transition-all ${filter === key ? "bg-[hsl(var(--primary))] text-white" : "bg-white border border-border text-foreground hover:bg-secondary"}`}>
            {label} <span className="ml-1 opacity-60">{count}</span>
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-2">
          {filtered.map(client => (
            <div key={client.id} onClick={() => setSelected(client)}
              className={`bg-white rounded-lg border cursor-pointer p-4 card-hover transition-all ${selected?.id === client.id ? "border-[hsl(var(--primary))] shadow-sm" : "border-border"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-golos font-semibold text-sm text-foreground truncate">{client.name}</p>
                    {client.type === "article51" && <span className="text-xs px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 shrink-0">ст. 51</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">{client.category} · дело {client.caseNumber}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Следующая дата: {client.nextDate}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded ${statusStyle[client.status]}`}>{statusLabel[client.status]}</span>
                  {client.totalBilled > 0 && <p className="text-xs gold-text font-golos font-semibold mt-1.5">{client.totalBilled.toLocaleString()} ₽</p>}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg border border-border overflow-hidden h-fit">
          {selected ? (
            <>
              <div className="px-4 py-3 border-b border-border" style={{ background: "hsl(var(--primary))" }}>
                <p className="font-golos font-semibold text-white text-sm">{selected.name}</p>
                <p className="text-xs text-blue-200 mt-0.5">{selected.caseNumber}</p>
              </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div><p className="text-muted-foreground">Тип</p><p className="font-semibold mt-0.5">{selected.type === "paid" ? "Платный" : "Ст. 51 УПК"}</p></div>
                  <div><p className="text-muted-foreground">Статус</p><p className="font-semibold mt-0.5">{statusLabel[selected.status]}</p></div>
                  <div><p className="text-muted-foreground">Следующая дата</p><p className="font-semibold mt-0.5">{selected.nextDate}</p></div>
                  <div><p className="text-muted-foreground">Выставлено</p><p className="font-semibold gold-text mt-0.5">{selected.totalBilled > 0 ? `${selected.totalBilled.toLocaleString()} ₽` : "—"}</p></div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-2 font-semibold uppercase tracking-wider">История</p>
                  <div className="space-y-2">
                    {clientHistory.map((h, i) => (
                      <div key={i} className="flex gap-2.5 text-xs">
                        <span className="text-muted-foreground shrink-0">{h.date}</span>
                        <span className="text-foreground">{h.note}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <Button size="sm" variant="outline" className="w-full text-xs">
                  <Icon name="FileText" size={13} className="mr-1.5" /> Сформировать ходатайство
                </Button>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-muted-foreground text-sm">
              <Icon name="User" size={32} className="mx-auto mb-2 opacity-30" />
              Выберите доверителя
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Petitions ────────────────────────────────────────────────────────────────

const petitionHistory = [
  { id: 1, client: "Иванов А.В.", actions: 5, total: 45000, date: "09.04.2026" },
  { id: 2, client: "Петрова М.С.", actions: 3, total: 27000, date: "08.04.2026" },
  { id: 3, client: "Громов П.И.", actions: 8, total: 72000, date: "07.04.2026" },
];

const actionItems = [
  { name: "Участие в судебном заседании", rate: 5000 },
  { name: "Участие в следственном действии (допрос)", rate: 3500 },
  { name: "Участие в следственном действии (обыск)", rate: 5000 },
  { name: "Участие в очной ставке", rate: 4000 },
  { name: "Ознакомление с материалами дела (том)", rate: 2500 },
  { name: "Участие в экспертизе", rate: 4500 },
  { name: "Составление жалобы / ходатайства", rate: 3000 },
  { name: "Консультация (час)", rate: 2000 },
];

function PetitionsSection() {
  const [selected, setSelected] = useState<number[]>([]);
  const total = selected.reduce((s, i) => s + actionItems[i].rate, 0);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="font-golos font-bold text-xl text-foreground">Ходатайства на оплату</h2>
        <Button className="bg-[hsl(var(--primary))] text-white text-sm">
          <Icon name="FilePlus" size={15} className="mr-1.5" /> Новое ходатайство
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-lg border border-border overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border">
            <h3 className="font-golos font-semibold text-sm">Конструктор ходатайства</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Отметьте выполненные действия</p>
          </div>
          <div className="divide-y divide-border">
            {actionItems.map((item, i) => (
              <label key={i} className="flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-secondary transition-colors">
                <Checkbox checked={selected.includes(i)} onCheckedChange={checked =>
                  setSelected(prev => checked ? [...prev, i] : prev.filter(x => x !== i))} />
                <span className="flex-1 text-sm font-ibm">{item.name}</span>
                <span className="text-sm font-golos font-medium text-muted-foreground shrink-0">{item.rate.toLocaleString()} ₽</span>
              </label>
            ))}
          </div>
          <div className="px-5 py-3.5 border-t border-border bg-secondary flex items-center justify-between">
            <span className="font-golos font-semibold text-sm">Итого</span>
            <span className="font-golos font-bold text-lg gold-text">{total.toLocaleString()} ₽</span>
          </div>
          <div className="px-5 py-3">
            <Button disabled={!selected.length} className="w-full bg-[hsl(var(--primary))] text-white text-sm">
              <Icon name="Download" size={15} className="mr-1.5" /> Сформировать документ
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-golos font-semibold text-sm text-foreground">Ранее сформированные</h3>
          {petitionHistory.map(p => (
            <div key={p.id} className="bg-white rounded-lg border border-border p-4 card-hover">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-ibm text-sm font-medium text-foreground">{p.client}</p>
                  <p className="text-xs text-muted-foreground">Ходатайство на оплату труда адвоката</p>
                  <p className="text-xs text-muted-foreground">{p.actions} действий · {p.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-golos font-bold gold-text">{p.total.toLocaleString()} ₽</p>
                  <button className="text-xs text-blue-600 hover:underline mt-1">Скачать</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Deadlines ────────────────────────────────────────────────────────────────

function DeadlinesSection() {
  const urgencyColor = (d: number) => d <= 2 ? "status-urgent" : d <= 7 ? "status-paid" : "status-normal";
  const urgencyLabel = (d: number) => d === 0 ? "Сегодня" : d === 1 ? "Завтра" : `${d} дней`;
  const typeLabel = { appeal: "Апелляция", complaint: "Жалоба", motion: "Ходатайство", response: "Отзыв" };
  const typeIcon = { appeal: "ArrowUpRight", complaint: "FileWarning", motion: "FileText", response: "MessageSquare" };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="font-golos font-bold text-xl text-foreground">Сроки обжалования</h2>
        <Button className="bg-[hsl(var(--primary))] text-white text-sm">
          <Icon name="Plus" size={15} className="mr-1.5" /> Добавить срок
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-border overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border">
          <h3 className="font-golos font-semibold text-sm">Контроль сроков</h3>
        </div>
        <div className="divide-y divide-border">
          {[...allDeadlines].sort((a, b) => a.daysLeft - b.daysLeft).map(d => (
            <div key={d.id} className="flex items-center gap-4 px-5 py-4">
              <div className={`shrink-0 w-16 text-center py-2 rounded text-xs font-golos font-bold ${urgencyColor(d.daysLeft)}`}>
                {urgencyLabel(d.daysLeft)}
              </div>
              <Icon name={typeIcon[d.type] as any} size={16} className="text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-ibm text-sm text-foreground">{d.title}</p>
                <p className="text-xs text-muted-foreground">{d.client}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs text-muted-foreground">{typeLabel[d.type]}</span>
                <p className="text-xs font-semibold text-foreground">{d.date}</p>
              </div>
              <Button size="sm" variant="outline" className="shrink-0 text-xs h-7 px-2">
                <Icon name="Bell" size={12} className="mr-1" /> Напомнить
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-border p-5">
        <h3 className="font-golos font-semibold text-sm mb-4">Ближайшие 30 дней</h3>
        <div className="grid grid-cols-10 gap-1">
          {Array.from({ length: 30 }, (_, i) => {
            const day = i + 9;
            const calDay = day > 30 ? day - 30 : day;
            const hasDeadline = allDeadlines.find(d => parseInt(d.date.split(".")[0]) === calDay && d.daysLeft <= 30);
            return (
              <div key={i} className={`aspect-square rounded flex items-center justify-center text-xs font-ibm relative ${hasDeadline ? (hasDeadline.daysLeft <= 2 ? "bg-red-100 text-red-700 font-bold" : "bg-amber-100 text-amber-700 font-semibold") : "text-muted-foreground hover:bg-secondary"}`}>
                {calDay}
                {hasDeadline && <div className={`absolute bottom-0.5 w-1 h-1 rounded-full ${hasDeadline.daysLeft <= 2 ? "bg-red-500" : "bg-amber-500"}`} />}
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-red-400 inline-block" /> Критично (≤2 дней)</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-amber-400 inline-block" /> Важно</span>
        </div>
      </div>
    </div>
  );
}

// ─── Investigations ───────────────────────────────────────────────────────────

function InvestigationsSection() {
  const [actions, setActions] = useState<InvestigationAction[]>(allInvestigations);
  const toggleDone = (id: number) => setActions(prev => prev.map(a => a.id === id ? { ...a, done: !a.done } : a));

  const typeColors: Record<string, string> = {
    "допрос": "bg-blue-50 text-blue-700 border-blue-200",
    "обыск": "bg-red-50 text-red-700 border-red-200",
    "очная ставка": "bg-purple-50 text-purple-700 border-purple-200",
    "экспертиза": "bg-emerald-50 text-emerald-700 border-emerald-200",
    "ознакомление": "bg-amber-50 text-amber-700 border-amber-200",
  };

  const pending = actions.filter(a => !a.done);
  const done = actions.filter(a => a.done);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="font-golos font-bold text-xl text-foreground">Следственные действия</h2>
        <Button className="bg-[hsl(var(--primary))] text-white text-sm">
          <Icon name="Plus" size={15} className="mr-1.5" /> Добавить действие
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[{ label: "Всего действий", value: actions.length, color: "text-foreground" }, { label: "Предстоит", value: pending.length, color: "text-amber-600" }, { label: "Завершено", value: done.length, color: "text-emerald-600" }].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border border-border p-3 text-center">
            <p className={`font-golos font-bold text-2xl ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-border overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <h3 className="font-golos font-semibold text-sm">Предстоящие</h3>
          <span className="ml-auto text-xs text-muted-foreground">{pending.length}</span>
        </div>
        <div className="divide-y divide-border">
          {pending.map(a => (
            <div key={a.id} className="flex items-center gap-4 px-5 py-3.5">
              <Checkbox checked={a.done} onCheckedChange={() => toggleDone(a.id)} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <p className="font-ibm text-sm text-foreground">{a.action}</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded border shrink-0 ${typeColors[a.type]}`}>{a.type}</span>
                </div>
                <p className="text-xs text-muted-foreground">{a.client} · {a.location}</p>
              </div>
              <p className="text-xs font-semibold text-foreground shrink-0">{a.date}</p>
            </div>
          ))}
        </div>
      </div>

      {done.length > 0 && (
        <div className="bg-white rounded-lg border border-border overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <h3 className="font-golos font-semibold text-sm">Завершённые</h3>
            <span className="ml-auto text-xs text-muted-foreground">{done.length}</span>
          </div>
          <div className="divide-y divide-border">
            {done.map(a => (
              <div key={a.id} className="flex items-center gap-4 px-5 py-3.5 opacity-55">
                <Checkbox checked={a.done} onCheckedChange={() => toggleDone(a.id)} />
                <div className="flex-1 min-w-0">
                  <p className="font-ibm text-sm line-through text-muted-foreground">{a.action}</p>
                  <p className="text-xs text-muted-foreground">{a.client} · {a.date}</p>
                </div>
                <span className={`text-xs px-1.5 py-0.5 rounded border shrink-0 ${typeColors[a.type]}`}>{a.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Analytics ────────────────────────────────────────────────────────────────

function AnalyticsSection() {
  const paidRevenue = allClients.filter(c => c.type === "paid").reduce((s, c) => s + c.totalBilled, 0);
  const article51Count = allClients.filter(c => c.type === "article51").length;
  const paidWithBill = allClients.filter(c => c.type === "paid" && c.totalBilled > 0);
  const avgBill = Math.round(paidRevenue / paidWithBill.length);

  const casesByCategory = allClients.reduce((acc, c) => {
    const cat = c.category.split(" ")[0];
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const monthlyData = [
    { month: "Янв", revenue: 68000 },
    { month: "Фев", revenue: 95000 },
    { month: "Мар", revenue: 127000 },
    { month: "Апр", revenue: 84000 },
  ];
  const maxRevenue = Math.max(...monthlyData.map(d => d.revenue));

  return (
    <div className="space-y-5 animate-fade-in">
      <h2 className="font-golos font-bold text-xl text-foreground">Аналитика практики</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Общий доход", value: `${(paidRevenue / 1000).toFixed(0)}к ₽`, icon: "DollarSign", color: "text-emerald-600" },
          { label: "Средний счёт", value: `${(avgBill / 1000).toFixed(0)}к ₽`, icon: "BarChart2", color: "text-blue-600" },
          { label: "По назначению", value: `${article51Count} чел.`, icon: "UserCheck", color: "text-purple-600" },
          { label: "Действий завершено", value: `${allInvestigations.filter(i => i.done).length}/${allInvestigations.length}`, icon: "Activity", color: "gold-text" },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</p>
              <Icon name={s.icon as any} size={16} className={s.color} />
            </div>
            <p className={`font-golos font-bold text-2xl ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-lg border border-border p-5">
          <h3 className="font-golos font-semibold text-sm mb-4">Доход по месяцам (2026)</h3>
          <div className="flex items-end gap-3 h-28">
            {monthlyData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-muted-foreground">{(d.revenue / 1000).toFixed(0)}к</span>
                <div className="w-full rounded-t transition-all hover:opacity-100 opacity-80" style={{ height: `${(d.revenue / maxRevenue) * 96}px`, background: "hsl(var(--primary))" }} />
                <span className="text-xs text-muted-foreground">{d.month}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-border p-5">
          <h3 className="font-golos font-semibold text-sm mb-4">Дела по категориям</h3>
          <div className="space-y-3">
            {Object.entries(casesByCategory).map(([cat, count]) => (
              <div key={cat}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-ibm text-foreground">{cat}</span>
                  <span className="text-muted-foreground">{count} {count === 1 ? "дело" : "дела"}</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(count / allClients.length) * 100}%`, background: "hsl(var(--primary))" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-border p-5 lg:col-span-2">
          <h3 className="font-golos font-semibold text-sm mb-4">Доверители по доходу</h3>
          <div className="space-y-2.5">
            {allClients.filter(c => c.totalBilled > 0).sort((a, b) => b.totalBilled - a.totalBilled).map(c => (
              <div key={c.id} className="flex items-center gap-3">
                <span className="font-ibm text-sm text-foreground w-44 truncate">{c.name.split(" ").slice(0, 2).join(" ")}</span>
                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${(c.totalBilled / 320000) * 100}%`, background: "hsl(var(--accent))" }} />
                </div>
                <span className="font-golos font-semibold text-sm gold-text w-24 text-right">{c.totalBilled.toLocaleString()} ₽</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Nav items ────────────────────────────────────────────────────────────────

const navItems = [
  { key: "dashboard", label: "Рабочий стол", icon: "LayoutDashboard" },
  { key: "planning", label: "Планирование дня", icon: "CalendarDays" },
  { key: "clients", label: "Доверители", icon: "Users" },
  { key: "petitions", label: "Ходатайства на оплату", icon: "FileText" },
  { key: "deadlines", label: "Сроки обжалования", icon: "Clock" },
  { key: "investigations", label: "Следственные действия", icon: "Search" },
  { key: "analytics", label: "Аналитика", icon: "BarChart2" },
] as const;

// ─── Main App ─────────────────────────────────────────────────────────────────

const Index = () => {
  const [section, setSection] = useState<Section>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const urgentCount = todayTasks.filter(t => t.urgent && !t.done).length + allDeadlines.filter(d => d.daysLeft <= 2).length;

  const renderSection = () => {
    switch (section) {
      case "dashboard": return <DashboardSection />;
      case "planning": return <PlanningSection />;
      case "clients": return <ClientsSection />;
      case "petitions": return <PetitionsSection />;
      case "deadlines": return <DeadlinesSection />;
      case "investigations": return <InvestigationsSection />;
      case "analytics": return <AnalyticsSection />;
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-60" : "w-14"} shrink-0 flex flex-col transition-all duration-200`} style={{ background: "hsl(222 45% 14%)" }}>
        <div className="flex items-center gap-3 px-4 py-4 border-b" style={{ borderColor: "hsl(222 38% 22%)" }}>
          <div className="w-7 h-7 rounded flex items-center justify-center shrink-0" style={{ background: "hsl(var(--accent))" }}>
            <Icon name="Scale" size={14} style={{ color: "hsl(222 45% 12%)" }} />
          </div>
          {sidebarOpen && (
            <div>
              <p className="font-golos font-bold text-white text-sm leading-tight">LexDesk</p>
              <p className="text-[10px] text-blue-300 font-ibm">Адвокатская практика</p>
            </div>
          )}
          <button onClick={() => setSidebarOpen(o => !o)} className="ml-auto text-blue-300 hover:text-white transition-colors">
            <Icon name={sidebarOpen ? "PanelLeftClose" : "PanelLeftOpen"} size={15} />
          </button>
        </div>

        <nav className="flex-1 py-3 space-y-0.5 px-2 overflow-y-auto">
          {navItems.map(item => (
            <button key={item.key} onClick={() => setSection(item.key as Section)}
              className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded text-sm transition-all nav-item ${section === item.key ? "nav-item-active" : "text-blue-200"}`}>
              <Icon name={item.icon as any} size={16} className="shrink-0" />
              {sidebarOpen && <span className="font-ibm text-xs leading-tight">{item.label}</span>}
              {item.key === "deadlines" && urgentCount > 0 && sidebarOpen && (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">{urgentCount}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="px-4 py-3 border-t" style={{ borderColor: "hsl(222 38% 22%)" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: "hsl(var(--accent))" }}>
              <Icon name="User" size={12} style={{ color: "hsl(222 45% 12%)" }} />
            </div>
            {sidebarOpen && (
              <div className="min-w-0">
                <p className="text-xs text-white font-semibold font-golos truncate">Адвокат</p>
                <p className="text-[10px] text-blue-300 font-ibm">Адвокатская палата</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-12 border-b border-border bg-white flex items-center px-5 gap-3 shrink-0">
          <h1 className="font-golos font-semibold text-sm text-foreground">
            {navItems.find(n => n.key === section)?.label}
          </h1>
          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="font-ibm">Данные защищены · AES-256</span>
            </div>
            {urgentCount > 0 && (
              <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-600 text-xs px-2.5 py-1 rounded">
                <Icon name="Bell" size={12} />
                <span>{urgentCount} срочных</span>
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-5">
          {renderSection()}
        </div>
      </main>
    </div>
  );
};

export default Index;