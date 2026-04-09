/* eslint-disable @typescript-eslint/no-explicit-any */
// Раздел «Аналитика практики»: KPI-карточки, доход по месяцам, дела по категориям, доверители по доходу
import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { fetchClients, fetchInvestigations } from "@/api";
import { LoadError } from "@/components/ui/load-error";
import type { InvestigationAction, Client } from "./dia-shared";
import { toInvestigation, toClient } from "./dia-shared";

export function AnalyticsSection() {
  const [clients, setClients] = useState<Client[]>([]);
  const [investigations, setInvestigations] = useState<InvestigationAction[]>([]);
  const [loading, setLoading] = useState(true);

  const [loadError, setLoadError] = useState(false);

  const loadData = () => {
    setLoading(true);
    setLoadError(false);
    Promise.all([fetchClients(), fetchInvestigations()]).then(([c, inv]) => {
      setClients(c.map(toClient));
      setInvestigations(inv.map(toInvestigation));
    }).catch(() => setLoadError(true)).finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);  

  const paidRevenue = clients.filter(c => c.type === "paid").reduce((s, c) => s + c.totalBilled, 0);
  const article51Count = clients.filter(c => c.type === "article51").length;
  const paidWithBill = clients.filter(c => c.type === "paid" && c.totalBilled > 0);
  const avgBill = paidWithBill.length ? Math.round(paidRevenue / paidWithBill.length) : 0;

  const casesByCategory = clients.reduce((acc, c) => {
    const cat = c.category.split(" ")[0];
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Статические данные по месяцам — в будущем заменить на реальные данные из API
  const monthlyData = [
    { month: "Янв", revenue: 68000 },
    { month: "Фев", revenue: 95000 },
    { month: "Мар", revenue: 127000 },
    { month: "Апр", revenue: 84000 },
  ];
  const maxRevenue = Math.max(...monthlyData.map(d => d.revenue));

  if (loading) return <div className="flex items-center justify-center h-40 text-muted-foreground text-sm font-ibm">Загрузка...</div>;
  if (loadError) return <LoadError onRetry={loadData} />;

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