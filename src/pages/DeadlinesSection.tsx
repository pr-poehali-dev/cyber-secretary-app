/* eslint-disable @typescript-eslint/no-explicit-any */
// Раздел «Сроки обжалования»: список сроков, мини-календарь, форма добавления нового срока
import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { fetchDeadlines, createDeadline } from "@/api";
import { getRules, subscribeRules } from "./appeal-rules-store";
import type { AppealRule } from "./appeal-rules-store";
import type { Deadline } from "./dia-shared";
import { toDeadline } from "./dia-shared";

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
  const [eventDate, setEventDate] = useState("");
  const [customDays, setCustomDays] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const selectedRule = rules.find(r => r.id === selectedRuleId) ?? rules[0];

  const handleRuleChange = (id: string) => {
    setSelectedRuleId(id);
    setCustomDays("");
  };

  const days = customDays !== "" ? parseInt(customDays) || selectedRule?.days : selectedRule?.days;

  const computedDeadline = (() => {
    if (!eventDate || !days) return null;
    const [d, m, y] = eventDate.split(".").map(Number);
    if (!d || !m || !y) return null;
    const base = new Date(y, m - 1, d);
    const deadline = new Date(base);
    deadline.setDate(deadline.getDate() + days);
    const today = new Date(2026, 3, 9);
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

          <div className="space-y-1">
            <p className={labelCls}>Доверитель *</p>
            <input
              className={inputCls}
              placeholder="Иванов А.В."
              value={client}
              onChange={e => setClient(e.target.value)}
            />
          </div>

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

// ─── DeadlinesSection ─────────────────────────────────────────────────────────

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
                <Button size="sm" variant="outline" disabled className="shrink-0 text-xs h-7 px-2 opacity-40 cursor-not-allowed" title="Напоминания будут доступны в следующей версии">
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