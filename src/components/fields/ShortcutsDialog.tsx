import { Keyboard, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ru as t } from "@/i18n/ru";

export function ShortcutsDialog({ open, onClose }: { open: boolean; onClose(): void }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="command-modal glass" role="dialog" aria-modal="true" aria-label={t.shortcuts} onClick={(e) => e.stopPropagation()}>
        <div className="command-header">
          <Keyboard />
          <h2>{t.shortcuts}</h2>
          <Button variant="ghost" size="icon" aria-label={t.close} onClick={onClose}>
            <X />
          </Button>
        </div>
        <div className="command-body">
          {[[t.helpNew, "N"], [t.helpSearch, "⌘ K / /"], [t.helpClose, "Esc"]].map(([label, key]) => (
            <div className="shortcut-row" key={key}>
              <span>{label}</span>
              <kbd>{key}</kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
