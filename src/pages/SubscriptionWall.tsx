 
import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { submitPaymentRequest } from "@/api";

interface Props {
  status: string;           // trial_expired | blocked
  settings: { price_rub: number; period_days: number; payment_info: string };
  onLogout: () => void;
}

export function SubscriptionWall({ status, settings, onLogout }: Props) {
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    setSending(true);
    try {
      await submitPaymentRequest(comment);
      setSent(true);
    } finally {
      setSending(false);
    }
  };

  const isBlocked = status === "blocked";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--accent))" }}>
            <Icon name="Scale" size={18} style={{ color: "hsl(222 45% 12%)" }} />
          </div>
          <div>
            <p className="font-golos font-bold text-foreground text-lg leading-tight">LexDesk</p>
            <p className="text-xs text-muted-foreground font-ibm">Адвокатская практика</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
          {/* Header */}
          <div className="px-6 py-5 border-b border-border text-center">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 ${isBlocked ? "bg-red-50" : "bg-amber-50"}`}>
              <Icon name={isBlocked ? "ShieldOff" : "Clock"} size={28} className={isBlocked ? "text-red-500" : "text-amber-500"} />
            </div>
            <h2 className="font-golos font-bold text-lg text-foreground">
              {isBlocked ? "Доступ заблокирован" : "Пробный период завершён"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1 font-ibm">
              {isBlocked
                ? "Администратор ограничил ваш доступ к системе."
                : "Ваш бесплатный пробный период истёк. Для продолжения работы необходимо оплатить подписку."}
            </p>
          </div>

          {/* Pricing */}
          {!isBlocked && (
            <div className="px-6 py-4 bg-secondary border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-golos font-semibold text-sm text-foreground">Подписка LexDesk</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{settings.period_days} дней полного доступа</p>
                </div>
                <div className="text-right">
                  <p className="font-golos font-bold text-2xl gold-text">{settings.price_rub.toLocaleString()} ₽</p>
                  <p className="text-xs text-muted-foreground">за период</p>
                </div>
              </div>
            </div>
          )}

          {/* Payment info */}
          {!isBlocked && settings.payment_info && (
            <div className="px-6 py-4 border-b border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Реквизиты для оплаты</p>
              <div className="bg-secondary rounded-lg p-3">
                <p className="text-sm font-ibm text-foreground whitespace-pre-wrap">{settings.payment_info}</p>
              </div>
            </div>
          )}

          {/* Notify form */}
          {!isBlocked && (
            <div className="px-6 py-4">
              {sent ? (
                <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 rounded-lg p-3">
                  <Icon name="CheckCircle" size={18} />
                  <p className="text-sm font-ibm">Заявка отправлена! Администратор откроет доступ после проверки оплаты.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Сообщить об оплате</p>
                  <textarea
                    className="w-full text-sm bg-secondary border border-border rounded px-3 py-2 resize-none focus:outline-none focus:border-[hsl(var(--primary))] font-ibm"
                    rows={3}
                    placeholder="Укажите дату и способ оплаты, последние 4 цифры карты..."
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                  />
                  <Button
                    onClick={handleSend}
                    disabled={sending || !comment.trim()}
                    className="w-full bg-[hsl(var(--primary))] text-white text-sm"
                  >
                    {sending ? "Отправка..." : "Отправить заявку"}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border text-center">
            <button onClick={onLogout} className="text-xs text-muted-foreground hover:text-foreground transition-colors font-ibm">
              Выйти из системы
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
