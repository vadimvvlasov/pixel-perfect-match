import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ru } from "@/i18n/ru";
import { Status } from "@/components/fields/FieldsApp";
export const Route = createFileRoute("/_design")({
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw new Error("Unavailable");
  },
  head: () => ({
    meta: [
      { title: ru.design },
      { name: "description", content: ru.design },
      { property: "og:title", content: ru.design },
      { property: "og:description", content: ru.design },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Design,
});
function Design() {
  return (
    <main className="design-page">
      <h1>{ru.design}</h1>
      <h2>{ru.tokens}</h2>
      <div className="token-grid">
        {[
          ["primary", ru.selected],
          ["fields", ru.fieldLayer],
          ["cells", ru.cellLayer],
          ["success", ru.status.done],
        ].map(([token, label]) => (
          <div key={token}>
            <div
              className={`token-sample ${token === "primary" ? "bg-primary" : token === "fields" ? "bg-fields" : token === "cells" ? "bg-cells" : "bg-success"}`}
            />
            {label}
          </div>
        ))}
      </div>
      <h2>{ru.controls}</h2>
      <div className="flex flex-wrap gap-4">
        <Button>{ru.submit}</Button>
        <Button variant="outline">{ru.download}</Button>
        <Status status="running" />
        <Status status="done" />
        <Status status="no_scene" />
      </div>
    </main>
  );
}
