 
import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { fetchClients, updateClient, createClient } from "@/api";
import type { Client } from "./types-and-data";
import type { EditableFields, ClientWithHistory } from "./client-shared";
import { toClient } from "./client-shared";

// ─── EditField ────────────────────────────────────────────────────────────────

function EditField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <p className="text-muted-foreground mb-0.5">{label}</p>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full text-xs font-semibold text-foreground bg-secondary border border-border rounded px-2 py-1.5 focus:outline-none focus:border-[hsl(var(--primary))] transition-colors"
      />
    </div>
  );
}

// ─── NewClientModal ───────────────────────────────────────────────────────────
// Модальное окно создания нового доверителя со всеми реквизитами

// Начальное (пустое) состояние формы
const emptyClientForm = {
  name: "", type: "paid" as Client["type"], caseNumber: "", status: "active" as Client["status"],
  category: "", nextDate: "", investigator: "", investigatorPhone: "", investigatorOffice: "", agency: "",
};

export function NewClientModal({ onClose, onCreated }: { onClose: () => void; onCreated: (c: ClientWithHistory) => void }) {
  const [form, setForm] = useState(emptyClientForm);
  const [saving, setSaving] = useState(false);

  const set = (k: keyof typeof emptyClientForm) => (v: string) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.caseNumber.trim()) return;
    setSaving(true);
    try {
      const raw = await createClient({ ...form, totalBilled: 0, lastContact: "" });
      onCreated(toClient(raw));
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full text-sm text-foreground bg-secondary border border-border rounded px-3 py-2 focus:outline-none focus:border-[hsl(var(--primary))] transition-colors font-ibm";
  const labelCls = "text-xs text-muted-foreground font-semibold uppercase tracking-wider";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-xl overflow-hidden animate-fade-in max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <h3 className="font-golos font-bold text-base text-foreground">Новый доверитель</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <Icon name="X" size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          <div className="space-y-1">
            <p className={labelCls}>ФИО доверителя *</p>
            <input className={inputCls} placeholder="Иванов Алексей Владимирович" value={form.name} onChange={e => set("name")(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className={labelCls}>Тип</p>
              <select className={inputCls} value={form.type} onChange={e => set("type")(e.target.value)}>
                <option value="paid">Платный</option>
                <option value="article51">По ст. 51 УПК</option>
              </select>
            </div>
            <div className="space-y-1">
              <p className={labelCls}>Статус</p>
              <select className={inputCls} value={form.status} onChange={e => set("status")(e.target.value)}>
                <option value="active">Активно</option>
                <option value="appeal">Апелляция</option>
                <option value="closed">Закрыто</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className={labelCls}>Номер дела *</p>
              <input className={inputCls} placeholder="1-245/2026" value={form.caseNumber} onChange={e => set("caseNumber")(e.target.value)} />
            </div>
            <div className="space-y-1">
              <p className={labelCls}>Ближайшая дата</p>
              <input className={inputCls} placeholder="15.04.2026" value={form.nextDate} onChange={e => set("nextDate")(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <p className={labelCls}>Статья / категория</p>
            <input className={inputCls} placeholder="Мошенничество (ст. 159)" value={form.category} onChange={e => set("category")(e.target.value)} />
          </div>
          <div className="border-t border-border pt-3 space-y-3">
            <p className="text-xs font-golos font-semibold text-foreground uppercase tracking-wider">Следователь</p>
            <div className="space-y-1">
              <p className={labelCls}>ФИО следователя</p>
              <input className={inputCls} placeholder="Соколов Дмитрий Игоревич" value={form.investigator} onChange={e => set("investigator")(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className={labelCls}>Телефон</p>
                <input className={inputCls} placeholder="+7 (495) 000-00-00" value={form.investigatorPhone} onChange={e => set("investigatorPhone")(e.target.value)} />
              </div>
              <div className="space-y-1">
                <p className={labelCls}>Кабинет</p>
                <input className={inputCls} placeholder="каб. 214" value={form.investigatorOffice} onChange={e => set("investigatorOffice")(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <p className={labelCls}>Орган, ведущий дело</p>
              <input className={inputCls} placeholder="СК России по ЦАО г. Москвы" value={form.agency} onChange={e => set("agency")(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="submit" disabled={saving || !form.name.trim() || !form.caseNumber.trim()}
              className="flex-1 bg-[hsl(var(--primary))] text-white text-sm">
              {saving ? "Сохранение..." : "Добавить доверителя"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 text-sm">Отмена</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── ClientDetail ─────────────────────────────────────────────────────────────
// Панель с деталями выбранного доверителя: просмотр, редактирование, история контактов

export function ClientDetail({
  selected, editing, draft, statusLabel,
  onEdit, onSave, onCancel, setField, onNavigatePetitions,
}: {
  selected: ClientWithHistory;
  editing: boolean;
  draft: EditableFields | null;
  statusLabel: Record<string, string>;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  setField: (key: keyof EditableFields) => (v: string) => void;
  onNavigatePetitions?: () => void;
}) {
  return (
    <>
      <div className="px-4 py-3 border-b border-border flex items-center justify-between" style={{ background: "hsl(var(--primary))" }}>
        <div className="min-w-0 mr-2">
          <p className="font-golos font-semibold text-white text-sm truncate">{selected.name}</p>
          <p className="text-xs text-blue-200 mt-0.5">{selected.caseNumber}</p>
        </div>
        {!editing && (
          <button onClick={onEdit} className="text-blue-200 hover:text-white transition-colors shrink-0">
            <Icon name="Pencil" size={14} />
          </button>
        )}
      </div>
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div><p className="text-muted-foreground">Тип</p><p className="font-semibold mt-0.5">{selected.type === "paid" ? "Платный" : "Ст. 51 УПК"}</p></div>
          <div><p className="text-muted-foreground">Статус</p><p className="font-semibold mt-0.5">{statusLabel[selected.status]}</p></div>
          {editing && draft ? (
            <>
              <div className="col-span-2"><EditField label="Следующая дата" value={draft.nextDate} onChange={setField("nextDate")} /></div>
              <div><p className="text-muted-foreground">Выставлено</p><p className="font-semibold gold-text mt-0.5">{selected.totalBilled > 0 ? `${selected.totalBilled.toLocaleString()} ₽` : "—"}</p></div>
              <div />
              <div className="col-span-2"><EditField label="Следователь" value={draft.investigator} onChange={setField("investigator")} /></div>
              <div className="col-span-2 grid grid-cols-2 gap-3">
                <EditField label="Телефон" value={draft.investigatorPhone} onChange={setField("investigatorPhone")} />
                <EditField label="Кабинет" value={draft.investigatorOffice} onChange={setField("investigatorOffice")} />
              </div>
              <div className="col-span-2"><EditField label="Орган, ведущий дело" value={draft.agency} onChange={setField("agency")} /></div>
            </>
          ) : (
            <>
              <div><p className="text-muted-foreground">Следующая дата</p><p className="font-semibold mt-0.5">{selected.nextDate}</p></div>
              <div><p className="text-muted-foreground">Выставлено</p><p className="font-semibold gold-text mt-0.5">{selected.totalBilled > 0 ? `${selected.totalBilled.toLocaleString()} ₽` : "—"}</p></div>
              <div className="col-span-2"><p className="text-muted-foreground">Следователь</p><p className="font-semibold mt-0.5">{selected.investigator}</p></div>
              <div><p className="text-muted-foreground">Телефон</p><p className="font-semibold mt-0.5">{selected.investigatorPhone}</p></div>
              <div><p className="text-muted-foreground">Кабинет</p><p className="font-semibold mt-0.5">{selected.investigatorOffice}</p></div>
              <div className="col-span-2"><p className="text-muted-foreground">Орган, ведущий дело</p><p className="font-semibold mt-0.5">{selected.agency}</p></div>
            </>
          )}
        </div>

        {editing ? (
          <div className="flex gap-2">
            <Button size="sm" onClick={onSave} className="flex-1 bg-[hsl(var(--primary))] text-white text-xs">
              <Icon name="Check" size={13} className="mr-1" /> Сохранить
            </Button>
            <Button size="sm" variant="outline" onClick={onCancel} className="flex-1 text-xs">Отмена</Button>
          </div>
        ) : (
          <>
            <div>
              <p className="text-xs text-muted-foreground mb-2 font-semibold uppercase tracking-wider">История</p>
              <div className="space-y-2">
                {selected.history.map((h) => (
                  <div key={h.id} className="flex gap-2.5 text-xs">
                    <span className="text-muted-foreground shrink-0">{h.event_date}</span>
                    <span className="text-foreground">{h.note}</span>
                  </div>
                ))}
              </div>
            </div>
            <Button size="sm" variant="outline" className="w-full text-xs" onClick={onNavigatePetitions}>
              <Icon name="FileText" size={13} className="mr-1.5" /> Сформировать ходатайство
            </Button>
          </>
        )}
      </div>
    </>
  );
}

// ─── ClientsSection ───────────────────────────────────────────────────────────
// Главный раздел доверителей: двухколоночный layout (список + детали), фильтры, мобильный оверлей

export function ClientsSection({ onNavigatePetitions }: { onNavigatePetitions?: () => void } = {}) {
  const [filter, setFilter] = useState<"all" | "paid" | "article51" | "appeal">("all");
  const [clients, setClients] = useState<ClientWithHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ClientWithHistory | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<EditableFields | null>(null);
  const [mobileDetail, setMobileDetail] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchClients()
      .then(data => setClients(data.map(toClient)))
      .finally(() => setLoading(false));
  }, []);

  const filtered = clients.filter(c =>
    filter === "all" ? true : filter === "appeal" ? c.status === "appeal" : c.type === filter
  );

  const statusLabel = { active: "Активно", closed: "Закрыто", appeal: "Апелляция" };
  const statusStyle = { active: "status-done", closed: "status-normal", appeal: "status-paid" };

  const handleSelect = (client: ClientWithHistory) => {
    setSelected(client);
    setEditing(false);
    setDraft(null);
    setMobileDetail(true);
  };

  const handleEdit = () => {
    if (!selected) return;
    setDraft({
      investigator: selected.investigator,
      investigatorPhone: selected.investigatorPhone,
      investigatorOffice: selected.investigatorOffice,
      agency: selected.agency,
      nextDate: selected.nextDate,
    });
    setEditing(true);
  };

  const handleSave = async () => {
    if (!selected || !draft) return;
    const raw = await updateClient(selected.id, draft);
    const updated = { ...toClient(raw), history: selected.history };
    setClients(prev => prev.map(c => c.id === selected.id ? updated : c));
    setSelected(updated);
    setEditing(false);
    setDraft(null);
  };

  const handleCancel = () => {
    setEditing(false);
    setDraft(null);
  };

  const setField = (key: keyof EditableFields) => (value: string) =>
    setDraft(prev => prev ? { ...prev, [key]: value } : prev);

  const detailProps = { selected: selected!, editing, draft, statusLabel, onEdit: handleEdit, onSave: handleSave, onCancel: handleCancel, setField, onNavigatePetitions };

  if (loading) return <div className="flex items-center justify-center h-40 text-muted-foreground text-sm font-ibm">Загрузка...</div>;

  return (
    <>
    {showForm && (
      <NewClientModal
        onClose={() => setShowForm(false)}
        onCreated={c => setClients(prev => [...prev, c])}
      />
    )}
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-golos font-bold text-xl text-foreground">Управление доверителями</h2>
        <Button onClick={() => setShowForm(true)} className="bg-[hsl(var(--primary))] text-white text-sm self-start sm:self-auto">
          <Icon name="UserPlus" size={15} className="mr-1.5" /> Новый доверитель
        </Button>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {([
          ["all", "Все", clients.length],
          ["paid", "Платные", clients.filter(c => c.type === "paid").length],
          ["article51", "По ст. 51", clients.filter(c => c.type === "article51").length],
          ["appeal", "Апелляция", clients.filter(c => c.status === "appeal").length],
        ] as const).map(([key, label, count]) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded text-xs sm:text-sm font-ibm transition-all ${filter === key ? "bg-[hsl(var(--primary))] text-white" : "bg-white border border-border text-foreground hover:bg-secondary"}`}>
            {label} <span className="ml-1 opacity-60">{count}</span>
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-3 lg:gap-4">
        <div className="lg:col-span-2 space-y-2">
          {filtered.map(client => (
            <div key={client.id} onClick={() => handleSelect(client)}
              className={`bg-white rounded-lg border cursor-pointer p-3 lg:p-4 card-hover transition-all ${selected?.id === client.id ? "border-[hsl(var(--primary))] shadow-sm" : "border-border"}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="font-golos font-semibold text-sm text-foreground">{client.name}</p>
                    {client.type === "article51" && <span className="text-xs px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 shrink-0">ст. 51</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">{client.category} · дело {client.caseNumber}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Ближайшая дата: {client.nextDate}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded ${statusStyle[client.status]}`}>{statusLabel[client.status]}</span>
                  {client.totalBilled > 0 && <p className="text-xs gold-text font-golos font-semibold mt-1">{client.totalBilled.toLocaleString()} ₽</p>}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop detail panel */}
        <div className="hidden lg:block bg-white rounded-lg border border-border overflow-hidden h-fit">
          {selected ? (
            <ClientDetail {...detailProps} />
          ) : (
            <div className="p-8 text-center text-muted-foreground text-sm">
              <Icon name="User" size={32} className="mx-auto mb-2 opacity-30" />
              Выберите доверителя
            </div>
          )}
        </div>
      </div>

      {/* Mobile detail overlay */}
      {mobileDetail && selected && (
        <div className="fixed inset-0 z-40 lg:hidden flex flex-col" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="mt-auto bg-white rounded-t-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-4 pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 bg-border rounded-full mx-auto" />
            </div>
            <div className="flex items-center justify-between px-4 pb-2 shrink-0">
              <span className="font-golos font-semibold text-sm text-foreground truncate mr-2">{selected.name}</span>
              <button onClick={() => { setMobileDetail(false); setEditing(false); setDraft(null); }} className="text-muted-foreground hover:text-foreground shrink-0">
                <Icon name="X" size={18} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              <ClientDetail {...detailProps} />
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}