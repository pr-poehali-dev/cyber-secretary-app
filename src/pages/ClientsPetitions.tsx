/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { Client } from "./types-and-data";
import { fetchClients, updateClient, createClient, fetchInvestigationsByClient } from "@/api";

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

// ─── New Client Form ──────────────────────────────────────────────────────────

const emptyClientForm = {
  name: "", type: "paid" as Client["type"], caseNumber: "", status: "active" as Client["status"],
  category: "", nextDate: "", investigator: "", investigatorPhone: "", investigatorOffice: "", agency: "",
};

function NewClientModal({ onClose, onCreated }: { onClose: () => void; onCreated: (c: ClientWithHistory) => void }) {
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

  const detailProps = { selected: selected!, editing, draft, statusLabel, onEdit: handleEdit, onSave: handleSave, onCancel: handleCancel, setField };

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
    </>
  );
}

// ─── Document Generators ─────────────────────────────────────────────────────

function generatePetitionPdf(
  client: Client,
  items: PetitionItem[],
  total: number
) {
  const today = new Date();
  const dateStr = today.toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" });
  const rows = items.map((it, idx) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#374151;font-size:13px;">${idx + 1}.</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#111827;font-size:13px;">
        ${it.name}${it.invDate ? ` <span style="color:#6b7280;font-size:11px;">(${it.invDate})</span>` : ""}
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#111827;font-size:13px;text-align:right;white-space:nowrap;">${it.rate.toLocaleString("ru-RU")} руб.</td>
    </tr>`).join("");

  const totalInWords = numberToWords(total);

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Ходатайство об оплате труда адвоката</title>
  <style>
    @page { margin: 20mm 25mm; size: A4; }
    body { font-family: "Times New Roman", Times, serif; font-size: 14px; line-height: 1.6; color: #000; margin: 0; padding: 0; }
    .header-right { text-align: right; margin-bottom: 32px; }
    .header-right p { margin: 2px 0; font-size: 13px; }
    h1 { text-align: center; font-size: 16px; font-weight: bold; text-transform: uppercase; margin: 24px 0 20px; }
    .subtitle { text-align: center; font-size: 13px; margin-bottom: 24px; }
    p { margin: 12px 0; text-align: justify; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th { background: #f3f4f6; padding: 8px 12px; border-bottom: 2px solid #d1d5db; font-size: 12px; text-align: left; font-family: Arial, sans-serif; }
    th:last-child { text-align: right; }
    .total-row td { padding: 10px 12px; font-weight: bold; font-size: 14px; background: #f9fafb; border-top: 2px solid #374151; }
    .total-row td:last-child { text-align: right; }
    .footer { margin-top: 40px; display: flex; justify-content: space-between; }
    .signature { border-top: 1px solid #000; width: 200px; text-align: center; font-size: 12px; padding-top: 4px; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="header-right">
    <p>В суд по уголовному делу № ${client.caseNumber}</p>
    <p>от адвоката, действующего в интересах</p>
    <p><strong>${client.name}</strong></p>
  </div>

  <h1>Ходатайство</h1>
  <div class="subtitle">об оплате труда адвоката по назначению</div>

  <p>В производстве находится уголовное дело по обвинению <strong>${client.name}</strong>
  в совершении преступления, предусмотренного ${client.category}.</p>

  <p>В период предварительного следствия мной были выполнены следующие процессуальные действия:</p>

  <table>
    <thead>
      <tr>
        <th style="width:40px;">№</th>
        <th>Наименование действия</th>
        <th style="width:130px;text-align:right;">Сумма</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
      <tr class="total-row">
        <td colspan="2">ИТОГО к выплате:</td>
        <td>${total.toLocaleString("ru-RU")} руб.</td>
      </tr>
    </tbody>
  </table>

  <p>Общая сумма вознаграждения составляет <strong>${total.toLocaleString("ru-RU")} (${totalInWords}) рублей</strong>.</p>

  <p>На основании изложенного и в соответствии со ст. 50, 51 УПК РФ, Постановлением Правительства РФ
  № 1240 от 01.12.2012, прошу:</p>

  <p><strong>Вынести постановление об оплате труда адвоката в размере ${total.toLocaleString("ru-RU")} рублей.</strong></p>

  <div class="footer">
    <div>
      <p style="margin:0;font-size:13px;">${dateStr}</p>
    </div>
    <div>
      <div class="signature">Адвокат</div>
    </div>
  </div>
</body>
</html>`;

  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:0;";
  document.body.appendChild(iframe);
  const doc = iframe.contentWindow!.document;
  doc.open();
  doc.write(html);
  doc.close();
  iframe.contentWindow!.focus();
  setTimeout(() => {
    iframe.contentWindow!.print();
    setTimeout(() => document.body.removeChild(iframe), 1000);
  }, 300);
}

// Минимальный конвертер числа в слова (рубли)
function numberToWords(n: number): string {
  if (n === 0) return "ноль";
  const ones = ["","один","два","три","четыре","пять","шесть","семь","восемь","девять",
    "десять","одиннадцать","двенадцать","тринадцать","четырнадцать","пятнадцать",
    "шестнадцать","семнадцать","восемнадцать","девятнадцать"];
  const tens = ["","","двадцать","тридцать","сорок","пятьдесят","шестьдесят","семьдесят","восемьдесят","девяносто"];
  const hundreds = ["","сто","двести","триста","четыреста","пятьсот","шестьсот","семьсот","восемьсот","девятьсот"];
  const onesF = ["","одна","две","три","четыре","пять","шесть","семь","восемь","девять",
    "десять","одиннадцать","двенадцать","тринадцать","четырнадцать","пятнадцать",
    "шестнадцать","семнадцать","восемнадцать","девятнадцать"];

  function chunk(num: number, feminine: boolean): string {
    const h = Math.floor(num / 100);
    const t = Math.floor((num % 100) / 10);
    const o = num % 10;
    const rem = num % 100;
    let res = "";
    if (h) res += hundreds[h] + " ";
    if (rem < 20) {
      res += (feminine ? onesF[rem] : ones[rem]);
    } else {
      res += tens[t];
      if (o) res += " " + (feminine ? onesF[o] : ones[o]);
    }
    return res.trim();
  }

  const th = Math.floor(n / 1000);
  const rest = n % 1000;
  let result = "";
  if (th) {
    result += chunk(th, true) + " ";
    const lastTwo = th % 100;
    const lastOne = th % 10;
    if (lastTwo >= 11 && lastTwo <= 19) result += "тысяч ";
    else if (lastOne === 1) result += "тысяча ";
    else if (lastOne >= 2 && lastOne <= 4) result += "тысячи ";
    else result += "тысяч ";
  }
  if (rest) result += chunk(rest, false);
  return result.trim();
}

// Скачивает .doc (HTML-in-Word) — открывается в Word/LibreOffice
function generatePetitionHtml(
  client: Client,
  items: PetitionItem[],
  total: number
) {
  const today = new Date();
  const dateStr = today.toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" });
  const rows = items.map((it, idx) => `
    <tr>
      <td style="border:1px solid #ccc;padding:6px 10px;text-align:center;">${idx + 1}.</td>
      <td style="border:1px solid #ccc;padding:6px 10px;">${it.name}${it.invDate ? ` (${it.invDate})` : ""}</td>
      <td style="border:1px solid #ccc;padding:6px 10px;text-align:right;">${it.rate.toLocaleString("ru-RU")} руб.</td>
    </tr>`).join("");

  const totalInWords = numberToWords(total);

  const content = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>Ходатайство</title>
<style>
  body{font-family:"Times New Roman",Times,serif;font-size:14pt;margin:2cm 3cm;}
  h1{text-align:center;font-size:14pt;text-transform:uppercase;margin:20pt 0 10pt;}
  p{text-align:justify;margin:8pt 0;}
  table{width:100%;border-collapse:collapse;margin:12pt 0;}
  th{background:#f0f0f0;border:1px solid #ccc;padding:6px 10px;font-size:12pt;}
  .right{text-align:right;}
  .bold{font-weight:bold;}
  .footer{margin-top:40pt;display:flex;justify-content:space-between;}
</style></head>
<body>
<div style="text-align:right;margin-bottom:24pt;">
  <p style="margin:2pt 0;">В суд по уголовному делу № ${client.caseNumber}</p>
  <p style="margin:2pt 0;">от адвоката, действующего в интересах</p>
  <p style="margin:2pt 0;font-weight:bold;">${client.name}</p>
</div>
<h1>Ходатайство</h1>
<p style="text-align:center;">об оплате труда адвоката по назначению</p>
<p>В производстве находится уголовное дело по обвинению <b>${client.name}</b> в совершении преступления, предусмотренного ${client.category}.</p>
<p>В период предварительного следствия мной были выполнены следующие процессуальные действия:</p>
<table>
  <thead><tr>
    <th style="width:40px;text-align:center;">№</th>
    <th>Наименование действия</th>
    <th style="width:140px;text-align:right;">Сумма</th>
  </tr></thead>
  <tbody>
    ${rows}
    <tr><td colspan="2" style="border:1px solid #ccc;padding:6px 10px;font-weight:bold;">ИТОГО к выплате:</td>
    <td style="border:1px solid #ccc;padding:6px 10px;text-align:right;font-weight:bold;">${total.toLocaleString("ru-RU")} руб.</td></tr>
  </tbody>
</table>
<p>Общая сумма вознаграждения составляет <b>${total.toLocaleString("ru-RU")} (${totalInWords}) рублей</b>.</p>
<p>На основании изложенного и в соответствии со ст. 50, 51 УПК РФ, Постановлением Правительства РФ № 1240 от 01.12.2012, прошу:</p>
<p><b>Вынести постановление об оплате труда адвоката в размере ${total.toLocaleString("ru-RU")} рублей.</b></p>
<div style="margin-top:40pt;display:flex;justify-content:space-between;align-items:flex-end;">
  <div><p style="margin:0;">${dateStr}</p></div>
  <div style="text-align:center;">
    <div style="border-top:1px solid #000;width:200px;padding-top:4px;font-size:12pt;">Адвокат</div>
  </div>
</div>
</body></html>`;

  const blob = new Blob(["\uFEFF" + content], { type: "application/msword;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Ходатайство_${client.name.split(" ")[0]}_${new Date().toLocaleDateString("ru-RU").replace(/\./g, "-")}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Petitions ────────────────────────────────────────────────────────────────

// Соответствие типа следственного действия → строка ходатайства + ставка
const INV_TYPE_RATES: Record<string, { name: string; rate: number }> = {
  "допрос":       { name: "Участие в следственном действии (допрос)", rate: 3500 },
  "обыск":        { name: "Участие в следственном действии (обыск)", rate: 5000 },
  "очная ставка": { name: "Участие в очной ставке", rate: 4000 },
  "экспертиза":   { name: "Участие в экспертизе", rate: 4500 },
  "ознакомление": { name: "Ознакомление с материалами дела (том)", rate: 2500 },
};

// Дополнительные позиции, доступны вручную
const EXTRA_ITEMS = [
  { name: "Участие в судебном заседании", rate: 5000 },
  { name: "Составление жалобы / ходатайства", rate: 3000 },
  { name: "Консультация (час)", rate: 2000 },
];

interface PetitionItem {
  id: string;
  name: string;
  rate: number;
  fromInv: boolean;
  invDate?: string;
  checked: boolean;
}

export function PetitionsSection() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [items, setItems] = useState<PetitionItem[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingInv, setLoadingInv] = useState(false);

  useEffect(() => {
    fetchClients()
      .then(data => setClients(data.map(toClient)))
      .finally(() => setLoadingClients(false));
  }, []);

  const handleSelectClient = async (clientId: number) => {
    setSelectedClientId(clientId);
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    setLoadingInv(true);
    try {
      const raw = await fetchInvestigationsByClient(client.name);
      const done = raw.filter((r: any) => r.done);
      const invItems: PetitionItem[] = done.map((r: any) => {
        const mapped = INV_TYPE_RATES[r.type] ?? { name: r.action, rate: 3000 };
        return { id: `inv-${r.id}`, name: mapped.name, rate: mapped.rate, fromInv: true, invDate: r.date, checked: true };
      });
      const extraItems: PetitionItem[] = EXTRA_ITEMS.map((e, i) => ({
        id: `extra-${i}`, name: e.name, rate: e.rate, fromInv: false, checked: false,
      }));
      setItems([...invItems, ...extraItems]);
    } finally {
      setLoadingInv(false);
    }
  };

  const toggleItem = (id: string) =>
    setItems(prev => prev.map(it => it.id === id ? { ...it, checked: !it.checked } : it));

  const checkedItems = items.filter(it => it.checked);
  const total = checkedItems.reduce((s, it) => s + it.rate, 0);
  const selectedClient = clients.find(c => c.id === selectedClientId);

  if (loadingClients) return (
    <div className="flex items-center justify-center h-40 text-muted-foreground text-sm font-ibm">Загрузка...</div>
  );

  return (
    <div className="space-y-4 lg:space-y-5 animate-fade-in">
      <h2 className="font-golos font-bold text-xl text-foreground">Ходатайства на оплату</h2>

      {/* Шаг 1: Выбор доверителя */}
      <div className="bg-white rounded-lg border border-border overflow-hidden">
        <div className="px-4 lg:px-5 py-3.5 border-b border-border flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-[hsl(var(--primary))] text-white text-[10px] font-bold flex items-center justify-center shrink-0">1</div>
          <h3 className="font-golos font-semibold text-sm">Выберите доверителя</h3>
        </div>
        <div className="p-4 lg:p-5">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {clients.map(c => (
              <button
                key={c.id}
                onClick={() => handleSelectClient(c.id)}
                className={`text-left p-3 rounded-lg border transition-all ${
                  selectedClientId === c.id
                    ? "border-[hsl(var(--primary))] bg-[hsl(222_45%_18%/5%)] shadow-sm"
                    : "border-border hover:border-muted-foreground"
                }`}
              >
                <p className="font-golos font-semibold text-sm text-foreground truncate">{c.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{c.category}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">дело {c.caseNumber}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Шаг 2: Позиции ходатайства */}
      {selectedClientId && (
        <div className="bg-white rounded-lg border border-border overflow-hidden">
          <div className="px-4 lg:px-5 py-3.5 border-b border-border flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-[hsl(var(--primary))] text-white text-[10px] font-bold flex items-center justify-center shrink-0">2</div>
            <div className="flex-1 min-w-0">
              <h3 className="font-golos font-semibold text-sm">Действия по делу</h3>
              {selectedClient && <p className="text-xs text-muted-foreground mt-0.5">{selectedClient.name}</p>}
            </div>
            {loadingInv && <Icon name="Loader" size={15} className="animate-spin text-muted-foreground shrink-0" />}
          </div>

          {!loadingInv && items.length > 0 && (
            <>
              {items.some(it => it.fromInv) && (
                <>
                  <div className="px-4 lg:px-5 py-2 bg-secondary border-b border-border">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Icon name="Search" size={11} /> Завершённые следственные действия
                    </p>
                  </div>
                  <div className="divide-y divide-border">
                    {items.filter(it => it.fromInv).map(it => (
                      <label key={it.id} className="flex items-center gap-3 px-4 lg:px-5 py-3 cursor-pointer hover:bg-secondary transition-colors">
                        <Checkbox checked={it.checked} onCheckedChange={() => toggleItem(it.id)} />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-ibm text-foreground leading-snug">{it.name}</span>
                          {it.invDate && <p className="text-[10px] text-muted-foreground mt-0.5">{it.invDate}</p>}
                        </div>
                        <span className="text-sm font-golos font-medium text-muted-foreground shrink-0 whitespace-nowrap">{it.rate.toLocaleString()} ₽</span>
                      </label>
                    ))}
                  </div>
                </>
              )}

              <div className="px-4 lg:px-5 py-2 bg-secondary border-y border-border">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Icon name="Plus" size={11} /> Дополнительные позиции
                </p>
              </div>
              <div className="divide-y divide-border">
                {items.filter(it => !it.fromInv).map(it => (
                  <label key={it.id} className="flex items-center gap-3 px-4 lg:px-5 py-3 cursor-pointer hover:bg-secondary transition-colors">
                    <Checkbox checked={it.checked} onCheckedChange={() => toggleItem(it.id)} />
                    <span className="flex-1 text-sm font-ibm leading-snug text-foreground">{it.name}</span>
                    <span className="text-sm font-golos font-medium text-muted-foreground shrink-0 whitespace-nowrap">{it.rate.toLocaleString()} ₽</span>
                  </label>
                ))}
              </div>

              <div className="px-4 lg:px-5 py-3.5 border-t border-border bg-secondary flex items-center justify-between">
                <div>
                  <span className="font-golos font-semibold text-sm">Итого</span>
                  <span className="text-xs text-muted-foreground ml-2">{checkedItems.length} позиций</span>
                </div>
                <span className="font-golos font-bold text-lg gold-text">{total.toLocaleString()} ₽</span>
              </div>
              <div className="px-4 lg:px-5 py-3 flex gap-2">
                <Button
                  disabled={!checkedItems.length}
                  onClick={() => selectedClient && generatePetitionPdf(selectedClient, checkedItems, total)}
                  className="flex-1 bg-[hsl(var(--primary))] text-white text-sm"
                >
                  <Icon name="FileText" size={15} className="mr-1.5" /> Сформировать PDF
                </Button>
                <Button
                  disabled={!checkedItems.length}
                  variant="outline"
                  onClick={() => selectedClient && generatePetitionHtml(selectedClient, checkedItems, total)}
                  className="shrink-0 text-sm"
                  title="Скачать как HTML"
                >
                  <Icon name="Download" size={15} />
                </Button>
              </div>
            </>
          )}

          {!loadingInv && items.length === 0 && (
            <div className="px-4 lg:px-5 py-8 text-center">
              <Icon name="Search" size={28} className="mx-auto mb-2 text-muted-foreground opacity-40" />
              <p className="text-sm text-muted-foreground font-ibm">Нет завершённых следственных действий</p>
              <p className="text-xs text-muted-foreground mt-1">Отметьте действия как выполненные в разделе «Следственные действия»</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}