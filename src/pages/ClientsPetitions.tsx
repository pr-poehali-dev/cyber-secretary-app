/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { Client } from "./types-and-data";
import { fetchClients, updateClient } from "@/api";

function toClient(r: any): Client & { history: {id: number; note: string; event_date: string}[] } {
  return {
    id: r.id, name: r.name, type: r.type, caseNumber: r.case_number,
    status: r.status, nextDate: r.next_date, totalBilled: r.total_billed,
    lastContact: r.last_contact, category: r.category,
    investigator: r.investigator, investigatorPhone: r.investigator_phone,
    investigatorOffice: r.investigator_office, agency: r.agency,
    history: r.history || [],
  };
}

// ─── Clients ──────────────────────────────────────────────────────────────────



type EditableFields = Pick<Client, "investigator" | "investigatorPhone" | "investigatorOffice" | "agency" | "nextDate">;

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

type ClientWithHistory = Client & { history: {id: number; note: string; event_date: string}[] };

// Detail panel — shared between inline (desktop) and modal (mobile)
function ClientDetail({
  selected, editing, draft, statusLabel,
  onEdit, onSave, onCancel, setField,
}: {
  selected: ClientWithHistory;
  editing: boolean;
  draft: EditableFields | null;
  statusLabel: Record<string, string>;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  setField: (key: keyof EditableFields) => (v: string) => void;
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
            <Button size="sm" variant="outline" className="w-full text-xs">
              <Icon name="FileText" size={13} className="mr-1.5" /> Сформировать ходатайство
            </Button>
          </>
        )}
      </div>
    </>
  );
}

export function ClientsSection() {
  const [filter, setFilter] = useState<"all" | "paid" | "article51" | "appeal">("all");
  const [clients, setClients] = useState<ClientWithHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ClientWithHistory | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<EditableFields | null>(null);
  const [mobileDetail, setMobileDetail] = useState(false);

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

  const detailProps = { selected: selected!, editing, draft, statusLabel, onEdit: handleEdit, onSave: handleSave, onCancel: handleCancel, setField };

  if (loading) return <div className="flex items-center justify-center h-40 text-muted-foreground text-sm font-ibm">Загрузка...</div>;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-golos font-bold text-xl text-foreground">Управление доверителями</h2>
        <Button className="bg-[hsl(var(--primary))] text-white text-sm self-start sm:self-auto">
          <Icon name="UserPlus" size={15} className="mr-1.5" /> Новый доверитель
        </Button>
      </div>

      {/* Filter tabs */}
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
        {/* Client list */}
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
            {/* Drag handle + close */}
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

export function PetitionsSection() {
  const [selected, setSelected] = useState<number[]>([]);
  const total = selected.reduce((s, i) => s + actionItems[i].rate, 0);

  return (
    <div className="space-y-4 lg:space-y-5 animate-fade-in">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-golos font-bold text-xl text-foreground">Ходатайства на оплату</h2>
        <Button className="bg-[hsl(var(--primary))] text-white text-sm self-start sm:self-auto">
          <Icon name="FilePlus" size={15} className="mr-1.5" /> Новое ходатайство
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 lg:gap-5">
        {/* Constructor */}
        <div className="bg-white rounded-lg border border-border overflow-hidden">
          <div className="px-4 lg:px-5 py-3.5 border-b border-border">
            <h3 className="font-golos font-semibold text-sm">Конструктор ходатайства</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Отметьте выполненные действия</p>
          </div>
          <div className="divide-y divide-border">
            {actionItems.map((item, i) => (
              <label key={i} className="flex items-center gap-3 px-4 lg:px-5 py-3 cursor-pointer hover:bg-secondary transition-colors">
                <Checkbox checked={selected.includes(i)} onCheckedChange={checked =>
                  setSelected(prev => checked ? [...prev, i] : prev.filter(x => x !== i))} />
                <span className="flex-1 text-sm font-ibm leading-snug">{item.name}</span>
                <span className="text-sm font-golos font-medium text-muted-foreground shrink-0 whitespace-nowrap">{item.rate.toLocaleString()} ₽</span>
              </label>
            ))}
          </div>
          <div className="px-4 lg:px-5 py-3.5 border-t border-border bg-secondary flex items-center justify-between">
            <span className="font-golos font-semibold text-sm">Итого</span>
            <span className="font-golos font-bold text-lg gold-text">{total.toLocaleString()} ₽</span>
          </div>
          <div className="px-4 lg:px-5 py-3">
            <Button disabled={!selected.length} className="w-full bg-[hsl(var(--primary))] text-white text-sm">
              <Icon name="Download" size={15} className="mr-1.5" /> Сформировать документ
            </Button>
          </div>
        </div>

        {/* History */}
        <div className="space-y-3">
          <h3 className="font-golos font-semibold text-sm text-foreground">Ранее сформированные</h3>
          {petitionHistory.map(p => (
            <div key={p.id} className="bg-white rounded-lg border border-border p-3 lg:p-4 card-hover">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-ibm text-sm font-medium text-foreground">{p.client}</p>
                  <p className="text-xs text-muted-foreground">Ходатайство на оплату труда адвоката</p>
                  <p className="text-xs text-muted-foreground">{p.actions} действий · {p.date}</p>
                </div>
                <div className="text-right shrink-0">
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