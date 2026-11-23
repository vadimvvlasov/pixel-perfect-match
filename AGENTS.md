<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## App architecture
- Keep TanStack routing and a browser-initialized API provider; the fixed template requires TanStack and no app backend is needed.
- All remote service access belongs to src/services/api/http; UI consumes the API context and Query hooks to keep mock and HTTP implementations interchangeable.
- Only MapView imports MapLibre; lazy-load it behind ClientOnly and expose an imperative handle so large GeoJSON stays outside component state.

- Keep supplied API semantics and HTTP files unchanged; the supplied mock has only safe array guards for strict TypeScript, while browser reload recovery delegates through session-storage request replay.
- Define Tailwind v4 tokens in global CSS, not a legacy Tailwind config, because the CSS-first compiler does not load it.
- Keep request date rules and presets in lib/dates.ts and order active history jobs before finished jobs, so UI and service validation agree.
- The API guard excludes the required template server entry because its fetch method is the host handler, not an outgoing network request.
- FieldsApp is a thin container; each view is its own props-driven component under components/fields with tests in src/test/components.test.tsx, so a port is file for file.
- services/api/context.tsx and index.ts are verbatim (HTTP default); mock wiring lives in runtime.tsx/mode.ts so the supplied files stay untouched.
- Coordinates and polygon bounds live only in lib/geo.ts; one-date windows only in lib/window.ts, shared by the mock and UI.
- Only shadcn primitives the app imports are kept; /_design shows the app's own components, not unused primitives.
