/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { InvestigationAction, Deadline, Client } from "./types-and-data";
import { fetchDeadlines, fetchInvestigations, patchInvestigationDone, fetchClients, createDeadline } from "@/api";
import { getRules, subscribeRules } from "./appeal-rules-store";
import type { AppealRule } from "./appeal-rules-store";

function toInvestigation(r: any): InvestigationAction {
  return { id: r.id, client: r.client, action: r.action, date: r.date, location: r.location, done: r.done, type: r.type };
}
function toDeadline(r: any): Deadline {
  return { id: r.id, title: r.title, client: r.client, daysLeft: r.days_left, type: r.type, date: r.date };
}
function toClient(r: any): Client {
  return { id: r.id, name: r.name, type: r.type, caseNumber: r.case_number, status: r.status, nextDate: r.next_date,
    totalBilled: r.total_billed, lastContact: r.last_contact, category: r.category, investigator: r.investigator,
    investigatorPhone: r.investigator_phone, investigatorOffice: r.investigator_office, agency: r.agency };
}

// ─── New Deadline Modal ───────────────────────────────────────────────────────

function NewDeadlineModal({
  rules,
  onClose,
  onCreated,
}: {
  rules: AppealRule[];
  onClose: () => void;
  onCreated: (d: Deadline) => void;
}) {
  const [selectedRuleId, setSelectedRuleId] = useState(rules[0]?.id ?? "");
  const [client, setClient] = useState("");
  const [eventDate, setEventDate] = useState(""); // дата приговора / заключения
  const [customDays, setCustomDays] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const selectedRule = rules.find(r => r.id === selectedRuleId) ?? rules[0];

  // При смене правила — сбрасываем кастомные дни
  const handleRuleChange = (id: string) => {
    setSelectedRuleId(id);
    setCustomDays("");
  };

  // Считаем итоговые дни
  const days = customDays !== "" ? parseInt(customDays) || selectedRule?.days : selectedRule?.days;

  // Вычисляем дату дедлайна и оставшиеся дни
  const computedDeadline = (() => {
    if (!eventDate || !days) return null;
    const [d, m, y] = eventDate.split(".").map(Number);
    if (!d || !m || !y) return null;
    const base = new Date(y, m - 1, d);
    const deadline = new Date(base);
    deadline.setDate(deadline.getDate() + days);
    const today = new Date(2026, 3, 9); // 09.04.2026 — текущая дата системы
    const daysLeft = Math.ceil((deadline.getTime() - today.getTime()) / 86400000);
    const dateStr = `${String(deadline.getDate()).padStart(2, "0")}.${String(deadline.getMonth() + 1).padStart(2, "0")}.${deadline.getFullYear()}`;
    return { date: dateStr, daysLeft };
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client.trim() || !eventDate.trim() || !computedDeadline) return;
    setSaving(true);
    try {
      const raw = await createDeadline({
        title: selectedRule.label,
        client: client.trim(),
        daysLeft: computedDeadline.daysLeft,
        type: selectedRule.deadlineType,
        date: computedDeadline.date,
      });
      onCreated(toDeadline(raw));
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full text-sm text-foreground bg-secondary border border-border rounded px-3 py-2 focus:outline-none focus:border-[hsl(var(--primary))] transition-colors font-ibm";
  const labelCls = "text-xs text-muted-foreground font-semibold uppercase tracking-wider";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-xl overflow-hidden animate-fade-in max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <h3 className="font-golos font-bold text-base text-foreground">Добавить срок обжалования</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <Icon name="X" size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Тип основания */}
          <div className="space-y-1">
            <p className={labelCls}>Основание *</p>
            <select className={inputCls} value={selectedRuleId} onChange={e => handleRuleChange(e.target.value)}>
              {rules.map(r => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
            {selectedRule && (
              <p className="text-[10px] text-muted-foreground italic">{selectedRule.basis}</p>
            )}
          </div>

          {/* Доверитель */}
          <div className="space-y-1">
            <p className={labelCls}>Доверитель *</p>
            <input
              className={inputCls}
              placeholder="Иванов А.В."
              value={client}
              onChange={e => setClient(e.target.value)}
            />
          </div>

          {/* Дата события */}
          <div className="space-y-1">
            <p className={labelCls}>Дата приговора / события *</p>
            <input
              className={inputCls}
              placeholder="09.04.2026"
              value={eventDate}
              onChange={e => setEventDate(e.target.value)}
            />
            <p className="text-[10px] text-muted-foreground">Формат: ДД.ММ.ГГГГ</p>
          </div>

          {/* Срок — из настроек, редактируемый */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <p className={labelCls}>Срок (дней)</p>
              <span className="text-[10px] text-muted-foreground">из настроек: {selectedRule?.days} дн.</span>
            </div>
            <input
              type="number"
              min="1"
              max="365"
              className={inputCls}
              placeholder={String(selectedRule?.days ?? 3)}
              value={customDays}
              onChange={e => setCustomDays(e.target.value)}
            />
            <p className="text-[10px] text-muted-foreground">Оставьте пустым, чтобы использовать значение из настроек</p>
          </div>

          {/* Предпросмотр результата */}
          {computedDeadline && client.trim() && (
            <div className={`rounded-lg p-3 flex items-start gap-2 ${computedDeadline.daysLeft <= 2 ? "bg-red-50 border border-red-200" : computedDeadline.daysLeft <= 7 ? "bg-amber-50 border border-amber-200" : "bg-emerald-50 border border-emerald-200"}`}>
              <Icon name="CalendarCheck" size={15} className={`shrink-0 mt-0.5 ${computedDeadline.daysLeft <= 2 ? "text-red-500" : computedDeadline.daysLeft <= 7 ? "text-amber-600" : "text-emerald-600"}`} />
              <div className="text-xs">
                <p className="font-semibold text-foreground">Срок истекает: {computedDeadline.date}</p>
                <p className="text-muted-foreground mt-0.5">
                  {computedDeadline.daysLeft <= 0
                    ? "Срок уже истёк"
                    : computedDeadline.daysLeft === 1
                    ? "Завтра"
                    : `Осталось ${computedDeadline.daysLeft} дней`}
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button
              type="submit"
              disabled={saving || !client.trim() || !eventDate.trim() || !computedDeadline}
              className="flex-1 bg-[hsl(var(--primary))] text-white text-sm"
            >
              {saving ? "Сохранение..." : "Добавить срок"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 text-sm">Отмена</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Deadlines ────────────────────────────────────────────────────────────────

export function DeadlinesSection() {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [rules, setRulesState] = useState<AppealRule[]>(getRules());
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchDeadlines().then(d => setDeadlines(d.map(toDeadline))).finally(() => setLoading(false));
    return subscribeRules(() => setRulesState(getRules()));
  }, []);

  const urgencyColor = (d: number) => d <= 2 ? "status-urgent" : d <= 7 ? "status-paid" : "status-normal";
  const urgencyLabel = (d: number) => d === 0 ? "Сегодня" : d === 1 ? "Завтра" : `${d} д.`;
  const typeLabel = { appeal: "Апелляция", complaint: "Жалоба", motion: "Ходатайство", response: "Отзыв" };
  const typeIcon = { appeal: "ArrowUpRight", complaint: "FileWarning", motion: "FileText", response: "MessageSquare" };

  if (loading) return <div className="flex items-center justify-center h-40 text-muted-foreground text-sm font-ibm">Загрузка...</div>;

  return (
    <>
    {showForm && (
      <NewDeadlineModal
        rules={rules}
        onClose={() => setShowForm(false)}
        onCreated={d => setDeadlines(prev => [...prev, d])}
      />
    )}
    <div className="space-y-4 lg:space-y-5 animate-fade-in">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-golos font-bold text-xl text-foreground">Сроки обжалования</h2>
        <Button onClick={() => setShowForm(true)} className="bg-[hsl(var(--primary))] text-white text-sm self-start sm:self-auto">
          <Icon name="Plus" size={15} className="mr-1.5" /> Добавить срок
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-border overflow-hidden">
        <div className="px-4 lg:px-5 py-3.5 border-b border-border">
          <h3 className="font-golos font-semibold text-sm">Контроль сроков</h3>
        </div>
        <div className="divide-y divide-border">
          {[...deadlines].sort((a, b) => a.daysLeft - b.daysLeft).map(d => (
            <div key={d.id} className="px-3 lg:px-5 py-3 lg:py-4">
              {/* Mobile: stacked layout */}
              <div className="flex items-start gap-2 lg:gap-4">
                <div className={`shrink-0 w-14 lg:w-16 text-center py-1.5 lg:py-2 rounded text-xs font-golos font-bold ${urgencyColor(d.daysLeft)}`}>
                  {urgencyLabel(d.daysLeft)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-1.5">
                    <Icon name={typeIcon[d.type] as any} size={14} className="text-muted-foreground shrink-0 mt-0.5" />
                    <p className="font-ibm text-sm text-foreground leading-snug">{d.title}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <p className="text-xs text-muted-foreground">{d.client}</p>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">{typeLabel[d.type]}</span>
                    <span className="text-xs font-semibold text-foreground">{d.date}</span>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="shrink-0 text-xs h-7 px-2">
                  <Icon name="Bell" size={12} className="lg:mr-1" />
                  <span className="hidden lg:inline">Напомнить</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mini calendar */}
      <div className="bg-white rounded-lg border border-border p-3 lg:p-5">
        <h3 className="font-golos font-semibold text-sm mb-3 lg:mb-4">Ближайшие 30 дней</h3>
        <div className="grid grid-cols-10 gap-0.5 lg:gap-1">
          {Array.from({ length: 30 }, (_, i) => {
            const day = i + 9;
            const calDay = day > 30 ? day - 30 : day;
            const hasDeadline = deadlines.find(d => parseInt(d.date.split(".")[0]) === calDay && d.daysLeft <= 30);
            return (
              <div key={i} className={`aspect-square rounded flex items-center justify-center text-[10px] lg:text-xs font-ibm relative ${hasDeadline ? (hasDeadline.daysLeft <= 2 ? "bg-red-100 text-red-700 font-bold" : "bg-amber-100 text-amber-700 font-semibold") : "text-muted-foreground hover:bg-secondary"}`}>
                {calDay}
                {hasDeadline && <div className={`absolute bottom-0.5 w-1 h-1 rounded-full ${hasDeadline.daysLeft <= 2 ? "bg-red-500" : "bg-amber-500"}`} />}
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-red-400 inline-block" /> Критично (≤2 дней)</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-amber-400 inline-block" /> Важно</span>
        </div>
      </div>
    </div>
    </>
  );
}

// ─── Investigations ───────────────────────────────────────────────────────────

export function InvestigationsSection() {
  const [actions, setActions] = useState<InvestigationAction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvestigations().then(d => setActions(d.map(toInvestigation))).finally(() => setLoading(false));
  }, []);

  const toggleDone = async (id: number, current: boolean) => {
    const updated = await patchInvestigationDone(id, !current);
    setActions(prev => prev.map(a => a.id === id ? { ...a, done: updated.done } : a));
  };

  const typeColors: Record<string, string> = {
    "допрос": "bg-blue-50 text-blue-700 border-blue-200",
    "обыск": "bg-red-50 text-red-700 border-red-200",
    "очная ставка": "bg-purple-50 text-purple-700 border-purple-200",
    "экспертиза": "bg-emerald-50 text-emerald-700 border-emerald-200",
    "ознакомление": "bg-amber-50 text-amber-700 border-amber-200",
  };

  const pending = actions.filter(a => !a.done);
  const done = actions.filter(a => a.done);

  if (loading) return <div className="flex items-center justify-center h-40 text-muted-foreground text-sm font-ibm">Загрузка...</div>;

  return (
    <div className="space-y-4 lg:space-y-5 animate-fade-in">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-golos font-bold text-xl text-foreground">Следственные действия</h2>
        <Button className="bg-[hsl(var(--primary))] text-white text-sm self-start sm:self-auto">
          <Icon name="Plus" size={15} className="mr-1.5" /> Добавить действие
        </Button>
      </div>

      {/* Stats — 3 cols, compact on mobile */}
      <div className="grid grid-cols-3 gap-2 lg:gap-3">
        {[
          { label: "Всего", value: actions.length, color: "text-foreground" },
          { label: "Предстоит", value: pending.length, color: "text-amber-600" },
          { label: "Завершено", value: done.length, color: "text-emerald-600" },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border border-border p-2.5 lg:p-3 text-center">
            <p className={`font-golos font-bold text-xl lg:text-2xl ${s.color}`}>{s.value}</p>
            <p className="text-[10px] lg:text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Pending */}
      <div className="bg-white rounded-lg border border-border overflow-hidden">
        <div className="px-4 lg:px-5 py-3.5 border-b border-border flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
          <h3 className="font-golos font-semibold text-sm">Предстоящие</h3>
          <span className="ml-auto text-xs text-muted-foreground">{pending.length}</span>
        </div>
        <div className="divide-y divide-border">
          {pending.map(a => (
            <div key={a.id} className="flex items-start gap-3 px-3 lg:px-5 py-3 lg:py-3.5">
              <Checkbox checked={a.done} onCheckedChange={() => toggleDone(a.id, a.done)} className="mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-ibm text-sm text-foreground leading-snug">{a.action}</p>
                  <span className="text-xs font-semibold text-foreground shrink-0">{a.date}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <p className="text-xs text-muted-foreground">{a.client}</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded border ${typeColors[a.type]}`}>{a.type}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{a.location}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Done */}
      {done.length > 0 && (
        <div className="bg-white rounded-lg border border-border overflow-hidden">
          <div className="px-4 lg:px-5 py-3.5 border-b border-border flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <h3 className="font-golos font-semibold text-sm">Завершённые</h3>
            <span className="ml-auto text-xs text-muted-foreground">{done.length}</span>
          </div>
          <div className="divide-y divide-border">
            {done.map(a => (
              <div key={a.id} className="flex items-start gap-3 px-3 lg:px-5 py-3 lg:py-3.5 opacity-55">
                <Checkbox checked={a.done} onCheckedChange={() => toggleDone(a.id, a.done)} className="mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-ibm text-sm line-through text-muted-foreground leading-snug">{a.action}</p>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <p className="text-xs text-muted-foreground">{a.client} · {a.date}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded border ${typeColors[a.type]}`}>{a.type}</span>
                  </div>
                </div>
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
  const [clients, setClients] = useState<Client[]>([]);
  const [investigations, setInvestigations] = useState<InvestigationAction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchClients(), fetchInvestigations()]).then(([c, inv]) => {
      setClients(c.map(toClient));
      setInvestigations(inv.map(toInvestigation));
    }).finally(() => setLoading(false));
  }, []);

  const paidRevenue = clients.filter(c => c.type === "paid").reduce((s, c) => s + c.totalBilled, 0);
  const article51Count = clients.filter(c => c.type === "article51").length;
  const paidWithBill = clients.filter(c => c.type === "paid" && c.totalBilled > 0);
  const avgBill = paidWithBill.length ? Math.round(paidRevenue / paidWithBill.length) : 0;

  const casesByCategory = clients.reduce((acc, c) => {
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

  if (loading) return <div className="flex items-center justify-center h-40 text-muted-foreground text-sm font-ibm">Загрузка...</div>;

  return (
    <div className="space-y-4 lg:space-y-5 animate-fade-in">
      <h2 className="font-golos font-bold text-xl text-foreground">Аналитика практики</h2>

      {/* KPI — 2 cols mobile, 4 cols desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Общий доход", value: `${(paidRevenue / 1000).toFixed(0)}к ₽`, icon: "DollarSign", color: "text-emerald-600" },
          { label: "Средний счёт", value: `${(avgBill / 1000).toFixed(0)}к ₽`, icon: "BarChart2", color: "text-blue-600" },
          { label: "По назначению", value: `${article51Count} чел.`, icon: "UserCheck", color: "text-purple-600" },
          { label: "Действий завершено", value: `${investigations.filter(i => i.done).length}/${investigations.length}`, icon: "Activity", color: "gold-text" },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border border-border p-3 lg:p-4">
            <div className="flex items-center justify-between mb-1.5 lg:mb-2">
              <p className="text-[10px] lg:text-xs text-muted-foreground uppercase tracking-wider leading-tight">{s.label}</p>
              <Icon name={s.icon as any} size={15} className={s.color} />
            </div>
            <p className={`font-golos font-bold text-xl lg:text-2xl ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4 lg:gap-5">
        {/* Bar chart */}
        <div className="bg-white rounded-lg border border-border p-4 lg:p-5">
          <h3 className="font-golos font-semibold text-sm mb-3 lg:mb-4">Доход по месяцам (2026)</h3>
          <div className="flex items-end gap-2 lg:gap-3 h-20 lg:h-28">
            {monthlyData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] lg:text-xs text-muted-foreground">{(d.revenue / 1000).toFixed(0)}к</span>
                <div className="w-full rounded-t transition-all hover:opacity-100 opacity-80" style={{ height: `${(d.revenue / maxRevenue) * (window.innerWidth < 1024 ? 56 : 80)}px`, background: "hsl(var(--primary))" }} />
                <span className="text-[10px] lg:text-xs text-muted-foreground">{d.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div className="bg-white rounded-lg border border-border p-4 lg:p-5">
          <h3 className="font-golos font-semibold text-sm mb-3 lg:mb-4">Дела по категориям</h3>
          <div className="space-y-2.5 lg:space-y-3">
            {Object.entries(casesByCategory).map(([cat, count]) => (
              <div key={cat}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-ibm text-foreground">{cat}</span>
                  <span className="text-muted-foreground">{count} {count === 1 ? "дело" : "дела"}</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(count / (clients.length || 1)) * 100}%`, background: "hsl(var(--primary))" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue by client */}
        <div className="bg-white rounded-lg border border-border p-4 lg:p-5 lg:col-span-2">
          <h3 className="font-golos font-semibold text-sm mb-3 lg:mb-4">Доверители по доходу</h3>
          <div className="space-y-2 lg:space-y-2.5">
            {clients.filter(c => c.totalBilled > 0).sort((a, b) => b.totalBilled - a.totalBilled).map(c => (
              <div key={c.id} className="flex items-center gap-2 lg:gap-3">
                <span className="font-ibm text-xs lg:text-sm text-foreground w-28 lg:w-44 truncate shrink-0">{c.name.split(" ").slice(0, 2).join(" ")}</span>
                <div className="flex-1 h-1.5 lg:h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${(c.totalBilled / 320000) * 100}%`, background: "hsl(var(--accent))" }} />
                </div>
                <span className="font-golos font-semibold text-xs lg:text-sm gold-text w-20 lg:w-24 text-right shrink-0">{c.totalBilled.toLocaleString()} ₽</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}