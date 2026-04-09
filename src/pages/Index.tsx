import { useState } from "react";
import Icon from "@/components/ui/icon";
import { DashboardSection, PlanningSection } from "./DashboardPlanning";
import { ClientsSection, PetitionsSection } from "./ClientsPetitions";
import { DeadlinesSection, InvestigationsSection, AnalyticsSection } from "./DeadlinesInvestigationsAnalytics";
import { todayTasks, allDeadlines } from "./types-and-data";
import type { Section } from "./types-and-data";

// ─── Nav items ────────────────────────────────────────────────────────────────

const navItems = [
  { key: "dashboard", label: "Рабочий стол", icon: "LayoutDashboard" },
  { key: "planning", label: "Планирование дня", icon: "CalendarDays" },
  { key: "clients", label: "Доверители", icon: "Users" },
  { key: "petitions", label: "Ходатайства на оплату", icon: "FileText" },
  { key: "deadlines", label: "Сроки обжалования", icon: "Clock" },
  { key: "investigations", label: "Следственные действия", icon: "Search" },
  { key: "analytics", label: "Аналитика", icon: "BarChart2" },
] as const;

// ─── Main App ─────────────────────────────────────────────────────────────────

const Index = () => {
  const [section, setSection] = useState<Section>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const urgentCount = todayTasks.filter(t => t.urgent && !t.done).length + allDeadlines.filter(d => d.daysLeft <= 2).length;

  const renderSection = () => {
    switch (section) {
      case "dashboard": return <DashboardSection />;
      case "planning": return <PlanningSection />;
      case "clients": return <ClientsSection />;
      case "petitions": return <PetitionsSection />;
      case "deadlines": return <DeadlinesSection />;
      case "investigations": return <InvestigationsSection />;
      case "analytics": return <AnalyticsSection />;
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-60" : "w-14"} shrink-0 flex flex-col transition-all duration-200`} style={{ background: "hsl(222 45% 14%)" }}>
        <div className="flex items-center gap-3 px-4 py-4 border-b" style={{ borderColor: "hsl(222 38% 22%)" }}>
          <div className="w-7 h-7 rounded flex items-center justify-center shrink-0" style={{ background: "hsl(var(--accent))" }}>
            <Icon name="Scale" size={14} style={{ color: "hsl(222 45% 12%)" }} />
          </div>
          {sidebarOpen && (
            <div>
              <p className="font-golos font-bold text-white text-sm leading-tight">LexDesk</p>
              <p className="text-[10px] text-blue-300 font-ibm">Адвокатская практика</p>
            </div>
          )}
          <button onClick={() => setSidebarOpen(o => !o)} className="ml-auto text-blue-300 hover:text-white transition-colors">
            <Icon name={sidebarOpen ? "PanelLeftClose" : "PanelLeftOpen"} size={15} />
          </button>
        </div>

        <nav className="flex-1 py-3 space-y-0.5 px-2 overflow-y-auto">
          {navItems.map(item => (
            <button key={item.key} onClick={() => setSection(item.key as Section)}
              className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded text-sm transition-all nav-item ${section === item.key ? "nav-item-active" : "text-blue-200"}`}>
              <Icon name={item.icon} size={16} className="shrink-0" />
              {sidebarOpen && <span className="font-ibm text-xs leading-tight">{item.label}</span>}
              {item.key === "deadlines" && urgentCount > 0 && sidebarOpen && (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">{urgentCount}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="px-4 py-3 border-t" style={{ borderColor: "hsl(222 38% 22%)" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: "hsl(var(--accent))" }}>
              <Icon name="User" size={12} style={{ color: "hsl(222 45% 12%)" }} />
            </div>
            {sidebarOpen && (
              <div className="min-w-0">
                <p className="text-xs text-white font-semibold font-golos truncate">Адвокат</p>
                <p className="text-[10px] text-blue-300 font-ibm">Адвокатская палата</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-12 border-b border-border bg-white flex items-center px-5 gap-3 shrink-0">
          <h1 className="font-golos font-semibold text-sm text-foreground">
            {navItems.find(n => n.key === section)?.label}
          </h1>
          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="font-ibm">Данные защищены · AES-256</span>
            </div>
            {urgentCount > 0 && (
              <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-600 text-xs px-2.5 py-1 rounded">
                <Icon name="Bell" size={12} />
                <span>{urgentCount} срочных</span>
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-5">
          {renderSection()}
        </div>
      </main>
    </div>
  );
};

export default Index;
