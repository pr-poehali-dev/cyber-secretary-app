/* eslint-disable @typescript-eslint/no-explicit-any */
// Раздел «Ходатайства на оплату»: двухшаговый процесс — выбор доверителя → позиции → генерация документа
import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { fetchClients, fetchInvestigationsByClient, fetchInvestigationTypes } from "@/api";
import { LoadError } from "@/components/ui/load-error";
import type { InvestigationType } from "@/api";
import type { ClientWithHistory } from "./client-shared";
import { toClient } from "./client-shared";
import { generatePetitionPdf, generatePetitionHtml } from "./petition-generators";
import type { PetitionItem } from "./petition-generators";

// Дополнительные позиции — не из следственных действий, добавляются вручную
const EXTRA_ITEMS = [
  { name: "Составление жалобы / ходатайства", rate: 3000 },
  { name: "Консультация (час)", rate: 2000 },
];

// ─── PetitionsSection ─────────────────────────────────────────────────────────

export function PetitionsSection() {
  const [clients, setClients] = useState<ClientWithHistory[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [items, setItems] = useState<PetitionItem[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingInv, setLoadingInv] = useState(false);
  const [filter, setFilter] = useState<"all" | "paid" | "article51" | "active" | "appeal">("all");
  const [invTypes, setInvTypes] = useState<InvestigationType[]>([]);

  const [loadError, setLoadError] = useState(false);

  const loadData = () => {
    setLoadingClients(true);
    setLoadError(false);
    Promise.all([fetchClients(), fetchInvestigationTypes()])
      .then(([cl, types]) => {
        setClients(cl.map(toClient));
        setInvTypes(types);
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoadingClients(false));
  };

  useEffect(() => { loadData(); }, []);  

  // Строим маппинг имя_типа → {название_строки, тариф} из данных БД
  const buildRates = (types: InvestigationType[]): Record<string, { name: string; rate: number }> => {
    const map: Record<string, { name: string; rate: number }> = {};
    types.forEach(t => { map[t.name] = { name: t.name.charAt(0).toUpperCase() + t.name.slice(1), rate: t.rate }; });
    return map;
  };

  const handleSelectClient = async (clientId: number) => {
    setSelectedClientId(clientId);
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    setLoadingInv(true);
    try {
      const raw = await fetchInvestigationsByClient(client.name);
      const done = raw.filter((r: any) => r.done);
      const rates = buildRates(invTypes);
      const invItems: PetitionItem[] = done.map((r: any) => {
        const mapped = rates[r.type] ?? { name: r.action, rate: 3000 };
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

  const filteredClients = clients.filter(c => {
    if (filter === "paid") return c.type === "paid";
    if (filter === "article51") return c.type === "article51";
    if (filter === "active") return c.status === "active";
    if (filter === "appeal") return c.status === "appeal";
    return true;
  });

  if (loadingClients) return (
    <div className="flex items-center justify-center h-40 text-muted-foreground text-sm font-ibm">Загрузка...</div>
  );
  if (loadError) return <LoadError onRetry={loadData} />;

  return (
    <div className="space-y-4 lg:space-y-5 animate-fade-in">
      <h2 className="font-golos font-bold text-xl text-foreground">Ходатайства на оплату</h2>

      {/* Шаг 1: Выбор доверителя */}
      <div className="bg-white rounded-lg border border-border overflow-hidden">
        <div className="px-4 lg:px-5 py-3.5 border-b border-border flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-[hsl(var(--primary))] text-white text-[10px] font-bold flex items-center justify-center shrink-0">1</div>
          <h3 className="font-golos font-semibold text-sm">Выберите доверителя</h3>
        </div>
        <div className="px-4 lg:px-5 pt-3 pb-1 flex gap-1.5 flex-wrap border-b border-border">
          {([
            ["all",       "Все",        clients.length],
            ["paid",      "Платные",    clients.filter(c => c.type === "paid").length],
            ["article51", "По ст. 51",  clients.filter(c => c.type === "article51").length],
            ["active",    "Активные",   clients.filter(c => c.status === "active").length],
            ["appeal",    "Апелляция",  clients.filter(c => c.status === "appeal").length],
          ] as const).map(([key, label, count]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded text-xs font-ibm transition-all mb-2 ${filter === key ? "bg-[hsl(var(--primary))] text-white" : "bg-secondary border border-border text-foreground hover:border-muted-foreground"}`}
            >
              {label} <span className="ml-1 opacity-60">{count}</span>
            </button>
          ))}
        </div>
        <div className="p-4 lg:p-5">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {filteredClients.map(c => (
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
            {filteredClients.length === 0 && (
              <p className="col-span-3 text-sm text-muted-foreground text-center py-4 font-ibm">Нет доверителей</p>
            )}
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
                  title="Скачать как DOC"
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