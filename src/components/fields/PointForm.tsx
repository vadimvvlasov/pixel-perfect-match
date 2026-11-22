import type { Ref } from "react";
import { Crosshair, MapPin } from "lucide-react";
import { ru as t } from "@/i18n/ru";

export interface PointFormProps {
  inputRef?: Ref<HTMLInputElement>;
  text: string;
  error: string;
  onText(value: string): void;
  onParse(value: string): void;
}

/** «Где»: the point as "lat, lon" or WKT; paste applies at once, Enter and blur parse. */
export function PointForm({ inputRef, text, error, onText, onParse }: PointFormProps) {
  return (
    <section>
      <h2 className="section-title">
        <MapPin />
        {t.where}
        <span className="section-number">01</span>
      </h2>
      <label htmlFor="point" className="point-label">
        {t.point}
      </label>
      <div className="point-entry">
        <input
          id="point"
          ref={inputRef}
          className="field-input font-mono"
          data-testid="point-input"
          value={text}
          placeholder={t.placeholder}
          onChange={(e) => onText(e.target.value)}
          onBlur={() => onParse(text)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onParse(text);
          }}
          onPaste={(e) => {
            e.preventDefault();
            const v = e.clipboardData.getData("text");
            onText(v);
            onParse(v);
          }}
        />
        <Crosshair className="input-cross" />
      </div>
      {error && <p className="error-text">{error}</p>}
    </section>
  );
}
