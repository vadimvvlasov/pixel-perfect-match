import { AlertTriangle } from "lucide-react";
import { ru } from "@/i18n/ru";

/** Shown over the map when the browser cannot draw WebGL. */
export function NoWebGLNotice({ title = ru.webgl, help = ru.webglHelp }: { title?: string; help?: string }) {
  return (
    <div className="webgl-notice glass">
      <AlertTriangle />
      <h2>{title}</h2>
      <p>{help}</p>
    </div>
  );
}
