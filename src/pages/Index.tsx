/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { DashboardSection, PlanningSection } from "./DashboardPlanning";
import { ClientsSection, PetitionsSection } from "./ClientsPetitions";
import { DeadlinesSection, InvestigationsSection, AnalyticsSection } from "./DeadlinesInvestigationsAnalytics";
import { SettingsSection } from "./Settings";
import type { Section } from "./types-and-data";
import type { User } from "@/auth";
import { apiLogout } from "@/auth";
import { fetchTasks, fetchDeadlines } from "@/api";

// ─── Nav items ────────────────────────────────────────────────────────────────

const navItems = [
  { key: "dashboard", label: "Рабочий стол", icon: "LayoutDashboard" },
  { key: "planning", label: "Планирование дня", icon: "CalendarDays" },
  { key: "clients", label: "Доверители", icon: "Users" },
  { key: "petitions", label: "Ходатайства на оплату", icon: "FileText" },
  { key: "deadlines", label: "Сроки обжалования", icon: "Clock" },
  { key: "investigations", label: "Следственные действия", icon: "Search" },
  { key: "analytics", label: "Аналитика", icon: "BarChart2" },
  { key: "settings", label: "Настройки", icon: "Settings" },
] as const;

// ─── Props ────────────────────────────────────────────────────────────────────

interface IndexProps {
  user: User;
  onLogout: () => void;
  onUserUpdate: (u: User) => void;
}

// ─── Main App ─────────────────────────────────────────────────────────────────

const Index = ({ user, onLogout, onUserUpdate }: IndexProps) => {
  const [section, setSection] = useState<Section>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [urgentCount, setUrgentCount] = useState(0);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    Promise.all([
      fetchTasks("09.04.2026"),
      fetchDeadlines(),
    ]).then(([tasks, deadlines]) => {
      const u = tasks.filter((t: any) => t.urgent && !t.done).length
              + deadlines.filter((d: any) => d.days_left <= 2).length;
      setUrgentCount(u);
    }).catch(() => {});
  }, []);

  const handleNav = (key: Section) => {
    setSection(key);
    setSidebarOpen(false);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await apiLogout();
    onLogout();
  };

  const displayName = user.full_name || user.email.split("@")[0];

  const renderSection = () => {
    switch (section) {
      case "dashboard": return <DashboardSection />;
      case "planning": return <PlanningSection />;
      case "clients": return <ClientsSection />;
      case "petitions": return <PetitionsSection />;
      case "deadlines": return <DeadlinesSection />;
      case "investigations": return <InvestigationsSection />;
      case "analytics": return <AnalyticsSection />;
      case "settings": return <SettingsSection user={user} onUserUpdate={onUserUpdate} />;
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-30
          flex flex-col shrink-0 transition-all duration-200
          ${sidebarOpen ? "w-64 translate-x-0" : "-translate-x-full lg:translate-x-0"}
          lg:w-60
        `}
        style={{ background: "hsl(222 45% 14%)" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-4 border-b" style={{ borderColor: "hsl(222 38% 22%)" }}>
          <div className="w-7 h-7 rounded flex items-center justify-center shrink-0" style={{ background: "hsl(var(--accent))" }}>
            <Icon name="Scale" size={14} style={{ color: "hsl(222 45% 12%)" }} />
          </div>
          <div>
            <p className="font-golos font-bold text-white text-sm leading-tight">LexDesk</p>
            <p className="text-[10px] text-blue-300 font-ibm">Адвокатская практика</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto text-blue-300 hover:text-white transition-colors lg:hidden">
            <Icon name="X" size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 space-y-0.5 px-2 overflow-y-auto">
          {navItems.map(item => (
            <button key={item.key} onClick={() => handleNav(item.key as Section)}
              className={`w-full flex items-center gap-3 px-2.5 py-3 lg:py-2.5 rounded text-sm transition-all nav-item ${section === item.key ? "nav-item-active" : "text-blue-200"}`}>
              <Icon name={item.icon} size={18} className="shrink-0" />
              <span className="font-ibm text-xs leading-tight">{item.label}</span>
              {item.key === "deadlines" && urgentCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">{urgentCount}</span>
              )}
            </button>
          ))}
        </nav>

        {/* User footer */}
        <div className="px-4 py-3 border-t" style={{ borderColor: "hsl(222 38% 22%)" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-golos font-bold text-xs" style={{ background: "hsl(var(--accent))", color: "hsl(222 45% 12%)" }}>
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-white font-semibold font-golos truncate">{displayName}</p>
              <p className="text-[10px] text-blue-300 font-ibm truncate">{user.email}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => handleNav("settings")}
                className={`transition-colors p-1 rounded ${section === "settings" ? "text-[hsl(var(--accent))]" : "text-blue-300 hover:text-white"}`}
                title="Настройки"
              >
                <Icon name="Settings" size={14} />
              </button>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="text-blue-300 hover:text-red-400 transition-colors p-1 rounded"
                title="Выйти"
              >
                <Icon name="LogOut" size={14} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header className="h-12 border-b border-border bg-white flex items-center px-3 lg:px-5 gap-2 shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-muted-foreground hover:text-foreground transition-colors shrink-0">
            <Icon name="Menu" size={20} />
          </button>

          <h1 className="font-golos font-semibold text-sm text-foreground truncate">
            {navItems.find(n => n.key === section)?.label}
          </h1>

          <div className="ml-auto flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="font-ibm">AES-256</span>
            </div>
            {urgentCount > 0 && (
              <div className="flex items-center gap-1 bg-red-50 border border-red-200 text-red-600 text-xs px-2 py-1 rounded">
                <Icon name="Bell" size={12} />
                <span>{urgentCount}</span>
              </div>
            )}
            {/* Logout — header mobile */}
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="lg:hidden text-muted-foreground hover:text-red-500 transition-colors p-1"
              title="Выйти"
            >
              <Icon name="LogOut" size={16} />
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 lg:p-5">
          {renderSection()}
        </div>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden border-t border-border bg-white flex shrink-0" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          {navItems.slice(0, 5).map(item => (
            <button
              key={item.key}
              onClick={() => setSection(item.key as Section)}
              className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-[10px] font-ibm transition-colors relative ${section === item.key ? "text-[hsl(var(--primary))]" : "text-muted-foreground"}`}
            >
              <Icon name={item.icon} size={18} />
              <span className="leading-tight truncate w-full text-center px-0.5">{item.label.split(" ")[0]}</span>
              {item.key === "deadlines" && urgentCount > 0 && (
                <span className="absolute top-1 right-1/4 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
          ))}
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex-1 flex flex-col items-center py-2 gap-0.5 text-[10px] font-ibm text-muted-foreground"
          >
            <Icon name="Menu" size={18} />
            <span>Ещё</span>
          </button>
        </nav>
      </main>
    </div>
  );
};

export default Index;
