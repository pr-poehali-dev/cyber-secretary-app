/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { taskTypeConfig } from "./types-and-data";
import type { Task, Client, Deadline } from "./types-and-data";
import { fetchTasks, patchTaskDone, fetchClients, fetchDeadlines } from "@/api";

function toTask(r: any): Task {
  return {
    id: r.id, title: r.title, type: r.type, time: r.time,
    client: r.client, done: r.done, urgent: r.urgent,
  };
}

function toClient(r: any): Client {
  return {
    id: r.id, name: r.name, type: r.type, caseNumber: r.case_number,
    status: r.status, nextDate: r.next_date, totalBilled: r.total_billed,
    lastContact: r.last_contact, category: r.category,
    investigator: r.investigator, investigatorPhone: r.investigator_phone,
    investigatorOffice: r.investigator_office, agency: r.agency,
  };
}

function toDeadline(r: any): Deadline {
  return {
    id: r.id, title: r.title, client: r.client,
    daysLeft: r.days_left, type: r.type, date: r.date,
  };
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export function DashboardSection() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchTasks("09.04.2026"),
      fetchClients(),
      fetchDeadlines(),
    ]).then(([t, c, d]) => {
      setTasks(t.map(toTask));
      setClients(c.map(toClient));
      setDeadlines(d.map(toDeadline));
    }).finally(() => setLoading(false));
  }, []);

  const urgentCount = tasks.filter(t => t.urgent && !t.done).length;
  const doneCount = tasks.filter(t => t.done).length;
  const totalBilled = clients.reduce((s, c) => s + c.totalBilled, 0);

  if (loading) return <div className="flex items-center justify-center h-40 text-muted-foreground text-sm font-ibm">Загрузка...</div>;

  return (
    <div className="space-y-4 lg:space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Задач сегодня", value: tasks.length, sub: `${doneCount} выполнено`, icon: "CheckSquare", color: "text-blue-600" },
          { label: "Срочно", value: urgentCount, sub: "требуют внимания", icon: "AlertTriangle", color: "text-red-500" },
          { label: "Доверители", value: clients.length, sub: `${clients.filter(c => c.status === "active").length} активных`, icon: "Users", color: "text-emerald-600" },
          { label: "Счетов выставлено", value: `${(totalBilled / 1000).toFixed(0)}к ₽`, sub: "в этом году", icon: "TrendingUp", color: "text-amber-600" },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border border-border p-3 lg:p-4 card-hover">
            <div className="flex items-start justify-between">
              <div className="min-w-0 mr-2">
                <p className="text-[10px] lg:text-xs text-muted-foreground font-ibm uppercase tracking-wider leading-tight">{s.label}</p>
                <p className="text-xl lg:text-2xl font-golos font-bold text-foreground mt-1">{s.value}</p>
                <p className="text-[10px] lg:text-xs text-muted-foreground mt-0.5">{s.sub}</p>
              </div>
              <Icon name={s.icon as any} size={18} className={`${s.color} shrink-0`} />
            </div>
          </div>
        ))}
      </div>

      {deadlines.filter(d => d.daysLeft <= 2).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 lg:p-4 flex items-start gap-3">
          <Icon name="AlertTriangle" size={16} className="text-red-500 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="font-golos font-semibold text-red-700 text-sm">Критические сроки</p>
            {deadlines.filter(d => d.daysLeft <= 2).map(d => (
              <p key={d.id} className="text-xs lg:text-sm text-red-600 mt-0.5">
                {d.client} — {d.title} ({d.daysLeft === 1 ? "завтра" : "сегодня"})
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-border overflow-hidden">
        <div className="px-4 lg:px-5 py-3 lg:py-3.5 border-b border-border flex items-center justify-between">
          <h3 className="font-golos font-semibold text-sm text-foreground">Расписание · 9 апреля 2026</h3>
          <span className="text-xs text-muted-foreground shrink-0 ml-2">{doneCount}/{tasks.length}</span>
        </div>
        <div className="divide-y divide-border">
          {tasks.map(task => {
            const cfg = taskTypeConfig[task.type];
            return (
              <div key={task.id} className={`px-3 lg:px-5 py-3 lg:py-3.5 ${task.done ? "opacity-50" : ""}`}>
                <div className="flex items-start gap-2">
                  <span className="text-xs font-ibm text-muted-foreground w-10 shrink-0 mt-0.5">{task.time}</span>
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${task.urgent ? "bg-red-500" : "bg-slate-300"}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-ibm leading-snug ${task.done ? "line-through text-muted-foreground" : "text-foreground"}`}>{task.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <p className="text-xs text-muted-foreground">{task.client}</p>
                      <span className="text-xs px-1.5 py-0.5 rounded status-normal">{cfg.label}</span>
                      {task.urgent && !task.done && <span className="text-xs px-1.5 py-0.5 rounded status-urgent">срочно</span>}
                    </div>
                  </div>
                  <Icon name={cfg.icon as any} size={14} className={`${cfg.color} shrink-0 mt-0.5`} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Planning ─────────────────────────────────────────────────────────────────

export function PlanningSection() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks("09.04.2026")
      .then(data => setTasks(data.map(toTask)))
      .finally(() => setLoading(false));
  }, []);

  const toggle = async (id: number, current: boolean) => {
    const updated = await patchTaskDone(id, !current);
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: updated.done } : t));
  };

  const doneCount = tasks.filter(t => t.done).length;

  if (loading) return <div className="flex items-center justify-center h-40 text-muted-foreground text-sm font-ibm">Загрузка...</div>;

  return (
    <div className="space-y-4 lg:space-y-6 animate-fade-in">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-golos font-bold text-xl text-foreground">Планирование дня</h2>
          <p className="text-sm text-muted-foreground mt-0.5">9 апреля 2026 — среда</p>
        </div>
        <Button className="bg-[hsl(var(--primary))] text-white text-sm self-start sm:self-auto">
          <Icon name="Plus" size={15} className="mr-1.5" /> Добавить задачу
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-border p-3 lg:p-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-ibm text-foreground">Выполнение дня</span>
          <span className="font-golos font-semibold gold-text">
            {tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0}%
          </span>
        </div>
        <Progress value={tasks.length ? (doneCount / tasks.length) * 100 : 0} className="h-2" />
      </div>

      {(["court", "investigation", "task", "reminder"] as const).map(type => {
        const group = tasks.filter(t => t.type === type);
        if (!group.length) return null;
        const cfg = taskTypeConfig[type];
        return (
          <div key={type} className="bg-white rounded-lg border border-border overflow-hidden">
            <div className="px-4 lg:px-5 py-3 border-b border-border flex items-center gap-2">
              <Icon name={cfg.icon as any} size={15} className={cfg.color} />
              <span className="font-golos font-semibold text-sm">{cfg.label}</span>
              <span className="ml-auto text-xs text-muted-foreground">{group.filter(t => t.done).length}/{group.length}</span>
            </div>
            <div className="divide-y divide-border">
              {group.map(task => (
                <div key={task.id} className="flex items-start gap-3 px-4 lg:px-5 py-3 lg:py-3.5">
                  <Checkbox
                    checked={task.done}
                    onCheckedChange={() => toggle(task.id, task.done)}
                    className="mt-0.5 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-ibm leading-snug ${task.done ? "line-through text-muted-foreground" : "text-foreground"}`}>{task.title}</p>
                      {task.urgent && <span className="text-xs px-1.5 py-0.5 rounded status-urgent shrink-0">срочно</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{task.client} · {task.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
