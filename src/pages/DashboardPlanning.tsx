/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { todayTasks, allClients, allDeadlines, taskTypeConfig } from "./types-and-data";
import type { Task } from "./types-and-data";

// ─── Dashboard ────────────────────────────────────────────────────────────────

export function DashboardSection() {
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

export function PlanningSection() {
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
