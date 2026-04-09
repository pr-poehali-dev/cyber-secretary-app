import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";

// Блок ошибки загрузки с кнопкой «Повторить»
export function LoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground">
      <Icon name="WifiOff" size={28} className="opacity-40" />
      <p className="text-sm font-ibm">Не удалось загрузить данные</p>
      <Button variant="outline" size="sm" onClick={onRetry} className="text-xs">
        <Icon name="RefreshCw" size={13} className="mr-1.5" /> Повторить
      </Button>
    </div>
  );
}
