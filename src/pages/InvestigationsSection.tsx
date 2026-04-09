 
// Раздел «Следственные действия»: список с фильтром по доверителю, форма добавления действия
import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { fetchInvestigations, patchInvestigationDone, fetchClients, createInvestigation, fetchInvestigationTypes } from "@/api";
import type { InvestigationAction, Client } from "./dia-shared";
import type { InvestigationType } from "@/api";
import { toInvestigation, toClient } from "./dia-shared";

// ─── New Investigation Modal ──────────────────────────────────────────────────
// Модальное окно с выбором доверителя из базы и заполнением деталей действия

function NewInvestigationModal({
  clients,
  invTypes,
  onClose,
  onCreated,
}: {
  clients: Client[];
  invTypes: InvestigationType[];
  onClose: () => void;
  onCreated: (a: InvestigationAction) => void;
}) {
  const [clientId, setClientId] = useState<string>(clients[0]?.id ? String(clients[0].id) : "");
  const [type, setType] = useState<string>(invTypes[0]?.name ?? "допрос");
  const [action, setAction] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedClient = clients.find(c => String(c.id) === clientId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !action.trim() || !date.trim()) return;
    setSaving(true);
    try {
      const raw = await createInvestigation({
        client: selectedClient.name,
        action: action.trim(),
        date: date.trim(),
        location: location.trim(),
        done: false,
        type,
      });
      onCreated(toInvestigation(raw));
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
          <h3 className="font-golos font-bold text-base text-foreground">Новое следственное действие</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <Icon name="X" size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          <div className="space-y-1">
            <p className={labelCls}>Доверитель *</p>
            <select className={inputCls} value={clientId} onChange={e => setClientId(e.target.value)}>
              {clients.map(c => (
                <option key={c.id} value={String(c.id)}>
                  {c.name} — дело {c.caseNumber}
                </option>
              ))}
            </select>
            {selectedClient && (
              <p className="text-[10px] text-muted-foreground">{selectedClient.category}</p>
            )}
          </div>

          <div className="space-y-1">
            <p className={labelCls}>Тип действия *</p>
            <select className={inputCls} value={type} onChange={e => setType(e.target.value)}>
              {invTypes.map(t => (
                <option key={t.id} value={t.name}>{t.name.charAt(0).toUpperCase() + t.name.slice(1)}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <p className={labelCls}>Описание *</p>
            <input
              className={inputCls}
              placeholder="Допрос обвиняемого по эпизоду №2"
              value={action}
              onChange={e => setAction(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <p className={labelCls}>Дата *</p>
            <input
              className={inputCls}
              placeholder="15.04.2026"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
            <p className="text-[10px] text-muted-foreground">Формат: ДД.ММ.ГГГГ</p>
          </div>

          <div className="space-y-1">
            <p className={labelCls}>Место проведения</p>
            <input
              className={inputCls}
              placeholder="СК по ЦАО, каб. 214"
              value={location}
              onChange={e => setLocation(e.target.value)}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              type="submit"
              disabled={saving || !clientId || !action.trim() || !date.trim()}
              className="flex-1 bg-[hsl(var(--primary))] text-white text-sm"
            >
              {saving ? "Сохранение..." : "Добавить действие"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 text-sm">Отмена</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── InvestigationsSection ────────────────────────────────────────────────────

// Фиксированная палитра цветов для бейджей типов
const TYPE_COLOR_PALETTE = [
  "bg-blue-50 text-blue-700 border-blue-200",
  "bg-red-50 text-red-700 border-red-200",
  "bg-purple-50 text-purple-700 border-purple-200",
  "bg-emerald-50 text-emerald-700 border-emerald-200",
  "bg-amber-50 text-amber-700 border-amber-200",
  "bg-sky-50 text-sky-700 border-sky-200",
  "bg-pink-50 text-pink-700 border-pink-200",
  "bg-teal-50 text-teal-700 border-teal-200",
];

export function InvestigationsSection() {
  const [actions, setActions] = useState<InvestigationAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [invTypes, setInvTypes] = useState<InvestigationType[]>([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    Promise.all([
      fetchInvestigations(),
      fetchClients(),
      fetchInvestigationTypes(),
    ]).then(([inv, cl, types]) => {
      setActions(inv.map(toInvestigation));
      setClients(cl.map(toClient));
      setInvTypes(types);
    }).finally(() => setLoading(false));
  }, []);

  const [filterClientId, setFilterClientId] = useState<number | null>(null);

  const toggleDone = async (id: number, current: boolean) => {
    const updated = await patchInvestigationDone(id, !current);
    setActions(prev => prev.map(a => a.id === id ? { ...a, done: updated.done } : a));
  };

  // Динамически строим словарь цветов из загруженных типов
  const typeColors: Record<string, string> = {};
  invTypes.forEach((t, i) => {
    typeColors[t.name] = TYPE_COLOR_PALETTE[i % TYPE_COLOR_PALETTE.length];
  });

  const filtered = filterClientId
    ? actions.filter(a => {
        const c = clients.find(cl => cl.id === filterClientId);
        return c ? a.client === c.name : true;
      })
    : actions;

  const pending = filtered.filter(a => !a.done);
  const done = filtered.filter(a => a.done);

  if (loading) return <div className="flex items-center justify-center h-40 text-muted-foreground text-sm font-ibm">Загрузка...</div>;

  return (
    <>
    {showForm && (
      <NewInvestigationModal
        clients={clients}
        invTypes={invTypes}
        onClose={() => setShowForm(false)}
        onCreated={a => setActions(prev => [a, ...prev])}
      />
    )}
    <div className="space-y-4 lg:space-y-5 animate-fade-in">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-golos font-bold text-xl text-foreground">Следственные действия</h2>
        <Button onClick={() => setShowForm(true)} className="bg-[hsl(var(--primary))] text-white text-sm self-start sm:self-auto">
          <Icon name="Plus" size={15} className="mr-1.5" /> Добавить действие
        </Button>
      </div>

      {/* Фильтр по доверителю */}
      <div className="flex gap-1.5 flex-wrap">
        <button
          onClick={() => setFilterClientId(null)}
          className={`px-3 py-1.5 rounded text-xs sm:text-sm font-ibm transition-all ${filterClientId === null ? "bg-[hsl(var(--primary))] text-white" : "bg-white border border-border text-foreground hover:bg-secondary"}`}
        >
          Все <span className="ml-1 opacity-60">{actions.length}</span>
        </button>
        {clients
          .filter(c => actions.some(a => a.client === c.name))
          .map(c => {
            const count = actions.filter(a => a.client === c.name).length;
            return (
              <button
                key={c.id}
                onClick={() => setFilterClientId(c.id)}
                className={`px-3 py-1.5 rounded text-xs sm:text-sm font-ibm transition-all ${filterClientId === c.id ? "bg-[hsl(var(--primary))] text-white" : "bg-white border border-border text-foreground hover:bg-secondary"}`}
              >
                {c.name.split(" ")[0]} {c.name.split(" ")[1]?.[0]}.{c.name.split(" ")[2]?.[0] ? c.name.split(" ")[2][0] + "." : ""}
                <span className="ml-1 opacity-60">{count}</span>
              </button>
            );
          })}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 lg:gap-3">
        {[
          { label: "Всего", value: filtered.length, color: "text-foreground" },
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
          {pending.length === 0 && (
            <p className="px-4 lg:px-5 py-6 text-sm text-muted-foreground text-center font-ibm">Нет предстоящих действий</p>
          )}
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
    </>
  );
}