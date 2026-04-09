/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { allDeadlines, allInvestigations, allClients } from "./types-and-data";
import type { InvestigationAction } from "./types-and-data";

// ─── Deadlines ────────────────────────────────────────────────────────────────

export function DeadlinesSection() {
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

export function InvestigationsSection() {
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
        {[
          { label: "Всего действий", value: actions.length, color: "text-foreground" },
          { label: "Предстоит", value: pending.length, color: "text-amber-600" },
          { label: "Завершено", value: done.length, color: "text-emerald-600" },
        ].map((s, i) => (
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

export function AnalyticsSection() {
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
