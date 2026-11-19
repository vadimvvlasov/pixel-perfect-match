import { createFileRoute } from "@tanstack/react-router";
import FieldsApp from "@/components/fields/FieldsApp";
import { ApiRuntime } from "@/services/api/context";
import { ru } from "@/i18n/ru";
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${ru.title} — контуры полей Sentinel-2` },
      { name: "description", content: ru.explanation },
      { property: "og:title", content: ru.title },
      { property: "og:description", content: ru.explanation },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});
function Index() {
  return (
    <ApiRuntime>
      <FieldsApp />
    </ApiRuntime>
  );
}
