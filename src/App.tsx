import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/AuthPage";
import { isLoggedIn, apiGetMe, clearToken } from "@/auth";
import type { User } from "@/auth";

const queryClient = new QueryClient();

function AppRoutes() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);

  // При загрузке проверяем сессию
  useEffect(() => {
    if (!isLoggedIn()) {
      setChecking(false);
      return;
    }
    apiGetMe()
      .then(u => setUser(u))
      .catch(() => { clearToken(); })
      .finally(() => setChecking(false));
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(220 20% 96%)" }}>
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto shadow-sm" style={{ background: "hsl(var(--accent))" }}>
            <span style={{ color: "hsl(222 45% 12%)", fontSize: 20 }}>⚖</span>
          </div>
          <p className="text-sm text-muted-foreground font-ibm">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            user
              ? <Index user={user} onLogout={() => { clearToken(); setUser(null); }} onUserUpdate={setUser} />
              : <AuthPage onAuth={setUser} />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppRoutes />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
