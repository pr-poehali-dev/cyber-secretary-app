 
import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { allClients } from "./types-and-data";
import type { Client } from "./types-and-data";

// ─── Clients ──────────────────────────────────────────────────────────────────

const clientHistory = [
  { date: "08.04.2026", note: "Ознакомился с материалами дела, том 3" },
  { date: "05.04.2026", note: "Судебное заседание — отложено" },
  { date: "02.04.2026", note: "Направлено ходатайство о приобщении доказательств" },
  { date: "28.03.2026", note: "Встреча с доверителем, уточнение позиции" },
];

export function ClientsSection() {
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
        {([
          ["all", "Все", allClients.length],
          ["paid", "Платные", allClients.filter(c => c.type === "paid").length],
          ["article51", "По ст. 51", allClients.filter(c => c.type === "article51").length],
          ["appeal", "Апелляция", allClients.filter(c => c.status === "appeal").length],
        ] as const).map(([key, label, count]) => (
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
                  <div className="col-span-2"><p className="text-muted-foreground">Следователь</p><p className="font-semibold mt-0.5">{selected.investigator}</p></div>
                  <div><p className="text-muted-foreground">Телефон</p><p className="font-semibold mt-0.5">{selected.investigatorPhone}</p></div>
                  <div><p className="text-muted-foreground">Кабинет</p><p className="font-semibold mt-0.5">{selected.investigatorOffice}</p></div>
                  <div className="col-span-2"><p className="text-muted-foreground">Орган, ведущий дело</p><p className="font-semibold mt-0.5">{selected.agency}</p></div>
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

export function PetitionsSection() {
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