import type { ReactNode } from "react";
import { PanelLeftClose, PanelLeftOpen, Plus, ScanLine, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ru as t } from "@/i18n/ru";

export type Snap = "peek" | "half" | "full";

export interface SidePanelProps {
  collapsed: boolean;
  snap: Snap;
  email: string;
  onSnap(snap: Snap): void;
  onCollapse(collapsed: boolean): void;
  onNew(): void;
  children: ReactNode;
}

/** The floating left panel (a bottom sheet on a phone) or, collapsed, the icon rail. */
export function SidePanel({ collapsed, snap, email, onSnap, onCollapse, onNew, children }: SidePanelProps) {
  if (collapsed)
    return (
      <nav className="rail glass">
        <div className="brand-symbol">
          <ScanLine />
        </div>
        <Button variant="ghost" size="icon" aria-label={t.expand} title={t.expand} onClick={() => onCollapse(false)}>
          <PanelLeftOpen />
        </Button>
        <Button variant="ghost" size="icon" aria-label={t.newRequest} title={t.newRequest} onClick={onNew}>
          <Plus />
        </Button>
      </nav>
    );
  return (
    <aside className={`side-panel glass snap-${snap}`}>
      <Button
        variant="ghost"
        className="mobile-handle"
        onPointerDown={(e) => {
          e.currentTarget.dataset["startY"] = String(e.clientY);
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerUp={(e) => {
          const delta = e.clientY - Number(e.currentTarget.dataset["startY"]);
          if (Math.abs(delta) > 25) {
            onSnap(delta < 0 ? "full" : "peek");
            e.preventDefault();
          }
        }}
        aria-label={t.expand}
        onClick={() => onSnap(snap === "half" ? "full" : snap === "full" ? "peek" : "half")}
      >
        <span />
      </Button>
      <header className="panel-header">
        <div className="brand">
          <div className="brand-symbol">
            <ScanLine strokeWidth={1.5} />
          </div>
          <div>
            <h1>{t.title}</h1>
            <div className="brand-subtitle">{t.subtitle}</div>
          </div>
          <Button variant="ghost" size="icon" className="panel-collapse" title={t.collapse} aria-label={t.collapse} onClick={() => onCollapse(true)}>
            <PanelLeftClose />
          </Button>
        </div>
      </header>
      <div className="panel-content">{children}</div>
      <footer className="panel-footer">
        <div className="avatar">
          <UserRound />
        </div>
        <div>
          <div className="account-email" data-testid="user-email">
            {email}
          </div>
          <div className="account-role">{t.account}</div>
        </div>
        <span className="connection-dot" />
      </footer>
    </aside>
  );
}
