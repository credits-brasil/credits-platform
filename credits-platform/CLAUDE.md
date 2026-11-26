# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Credits Platform client front end: a React SPA (Vite + TypeScript + Tailwind v4 + shadcn/ui). Operators log in, pick a company, and run SPC Brasil credit/risk consultations ("produtos", such as 325 SPC MAXI and 695 SPC MAIS) against the Credits back end (`VITE_API_URL`). The UI and domain vocabulary are Portuguese (insumo, consulta, resultado, grupo econômico, etc.). The admin back office is the sibling repo `../../credits-platform-manager`. See `../../CLAUDE.md` for how the two relate.

The git root is the parent folder (`../`), a pnpm workspace that came from a Replit template. `../lib/*` (api-client-react, api-spec, api-zod, db) and `../scripts` are leftover template packages. The app does not import them. All real work happens in this folder.

## Commands

Run these from this folder. pnpm is required: the root `preinstall` rejects npm and yarn, and dependencies use `catalog:`/`workspace:` specifiers. `../pnpm-workspace.yaml` sets `minimumReleaseAge: 1440`, so packages published less than a day ago won't install.

- `pnpm dev`: Vite dev server on `PORT` from `.env` (`strictPort`, so it fails if the port is busy)
- `pnpm build`: production build to `dist/public`
- `pnpm typecheck`: `tsc --noEmit`. This already reports about 7 implicit-`any` errors in `src/pages/325SpcMaxiResultado.tsx` and `ConsultasRealizadasSection.tsx`. Compare against that baseline and filter the output for the files you touched.
- `pnpm test`: Vitest, run once (45 tests as of Nov 2026)
- Single test: `pnpm vitest run src/utils/formatCPF/formatCPF.test.ts` (or `-t "<test name>"`)

Vitest only picks up `src/**/*.test.ts` (not `.tsx`). Tests live next to the util they cover (`src/utils/<fn>/<fn>.test.ts`) and are excluded from `tsc`. There is no ESLint config.

Deployment is on Vercel (`vercel.json` rewrites every path to `index.html`).

## Architecture

**App shell and auth (`src/App.tsx`, `src/lib/auth.ts`).** Routing uses `wouter`. `App.tsx` handles:
- login (`POST /api/auth/user/login`)
- the terms-of-use gate (`acceptedTerms`, accepted through `/api/auth/user/accept-terms`)
- the route table

The session lives in `localStorage` under `credits-platform-*` keys (token, refresh token, user, selected company, last activity). Make authenticated calls with `apiFetch` from `@/lib/auth`: it adds the Bearer token and retries once after a refresh on 401. `useIdleLogout` logs out after 2h of inactivity (`IDLE_LOGOUT_TIMEOUT_MS`), and activity is shared across tabs through `localStorage`.

**Company context.** `components/layout/CompanySelector.tsx` stores the selected company in `localStorage` (`credits-platform-selected-company`) and dispatches a `credits-platform-company-change` event. Consultation requests send that `companyId`.

**Product flow: search page to result page.** Each product has two pages in `src/pages`, named after the product code (`325SpcMaxi.tsx` / `325SpcMaxiResultado.tsx`), routed at `/credito-risco/<code>-<slug>` and `.../resultado`.
- **Search page:** validates the CPF/CNPJ and collects the selected insumos (optional data add-ons). It writes the request into the React Query cache with `queryClient.setQueryData(["<slug>-request"], …)` and navigates to `/resultado`. Nothing goes into the URL or storage, so reloading the result page loses the request.
- **Insumo lists:** `constants/insumo-groups/{cpf,cnpj}InsumoGroups.ts` are shared by every product. Per-product defaults and exclusions live in `constants/<product>.ts`, for example `SPC_RELATORIO_PJ_DEFAULT_INSUMOS = ["49","23"]`, `SPC_AVANCADA_PJ_EXCLUDED_INSUMOS = ["78","5185"]`, and 629 makes `5185` (Gasto Estimado PJ) a default. A default insumo is part of the product and is never offered as an optional one.
- **Result page:** `325SpcMaxiResultado.tsx` is the single shared result implementation. The other products' `*Resultado.tsx` pages are thin wrappers that pass a `product` prop (`slug`, `name`, `endpoint` such as `/api/695-spc-mais`, `defaultInsumos`, `excludedInsumos…`).
- **Cache rules:** the global `QueryClient` uses `staleTime: 0, gcTime: 0`. The result page keeps entries alive with `gcTime: Infinity` observers and keys the result by the **consultation** (`documento + tipo + consultedAt`), not by its insumos. Extra insumos bought later go through `applyExtraConsultationResult`, which updates the same cache entry. Never `invalidateQueries` the result: it refetches, shows the loading screen, and sends a second, possibly **billed**, POST.
- **Report sections** live in `src/containers/SpcMaxiResultado/components/`. Their DOM ids and order are listed in `constants/report-sections.ts`, which drives quick navigation (`QuickNavigationSection`) and the print-section picker.

**Read-only viewer for the manager (`/visualizar-consulta`, `pages/ConsultationViewer.tsx`).**
- **Route:** registered in `App.tsx` before the login gate, without `Layout`. It is only meant to be embedded by credits-platform-manager in an iframe.
- **Protocol** (`lib/consultationViewer.ts`, mirrored in the manager): the page receives a stored order over `postMessage`. It only accepts origins in `VITE_MANAGER_ORIGINS` (any localhost in dev).
- **Framing:** `vercel.json` sends `Content-Security-Policy: frame-ancestors https://controle-sistema.creditsbrasil.com.br` on `/visualizar-consulta`, so browsers only let the manager embed it. A new manager domain (homol, previews) must be added there **and** to `VITE_MANAGER_ORIGINS`. Local `pnpm dev` ignores `vercel.json`.
- **Product:** resolved from the order's `product_name` with `utils/findResultProductCode`, mapped through `constants/result-products.ts` (`RESULT_PRODUCTS`, also used by the `*Resultado.tsx` routes).
- **Rendering:** the result page gets `snapshot={ request, spc }`. In that mode it never queries the API and provides `ReportReadOnlyContext`. That hides "Nova Consulta", "Insumos Opcionais", the magnifier lookups and the paid dialogs. `ExtraInsumoButton` shows "Não consultado". "Ver Score" only reveals a score already in the data.
- **New paid actions:** any new paid or navigating action on the result page must also be hidden when `readOnly`.

**Extra (paid) consultations on the result page.**
- **Single insumo:** the "Consultar" buttons (`ExtraInsumoButton`, `ConsultarInsumoDialog`). "Ver Score" uses the same flow: scores are not default in 325.
- **Bulk:** the "Insumos Opcionais" block (`InsumosAdicionaisSection` + `ConsultarInsumosAdicionaisDialog`). Insumos already consulted show as checked and locked. When the request finishes, the page scrolls to the top without a reload, then `NovasSecoesBanner` lists and highlights the new sections.
- **Time limit:** all of these are only allowed within `EXTRA_CONSULTATION_WINDOW_MS` (5 min) of the consultation. After that the buttons look blocked (`blocked` / `aria-disabled`) but stay clickable, and a click opens `ExtraConsultationExpiredDialog`.
- **Document lookup (magnifier icon):** `ConsultarDocumentoButton` + `ConsultarDocumentoDialog` start a new paid consultation of that CPF/CNPJ in 325 SPC MAXI. PF or PJ is decided by digit count (11 or 14). The button is hidden for anything else and when printing. It appears in the Grupo Econômico tree, the Sócio/Administrador blocks, Participação Empresa, and the Quadro Social tabs.
- **Dialog style:** every confirmation dialog follows the `ConsultarInsumoDialog` visual pattern. The page component remounts on a new consultation.

**Section ↔ insumo rules (decided with the user).**
- **Quadro Social Mais Completo** (`QuadroSocialSection`, insumo `5186`) holds the Controle Societário and Quadro Administrativo tabs.
- **Governança** (`GovernancaSection`) holds Participação Empresa (`24`), Sócio (`23`, `spcData.socio`), Administrador (`49`) and Grupo Econômico (`5241`, CNPJ only; offered in every product).
- A block appears only when its insumo was requested. If it was requested but came back empty, show only the counter card (0) and no table. A block that returns data always shows.
- The tab cards (`ReportTabCards`) always use a 4-column grid.
- **Grupo Econômico** (`GrupoEconomicoBlock`) is a recursive tree built from `socios.socio[].gruposEconomicosAssociados.grupoEconomicoAssociado`. It has colored level bars and its card shows only the first-level partner count.
- **Hide empty things:** no empty tables, charts or summaries (Negativos Consolidados groups, Consultas Realizadas, Administrador, contact rows made only of dashes). The Negativos chart needs at least 2 distinct dates. Apply the same rule to the print output.
- **Negativos Consolidados CCF table** also lists `spcData.cotumacia` (contumácia / cheque contra-ordem) records, using these columns: Data Inclusão, Banco (`codigo - nome`), Agência, Conta Corrente, Cheque Inicial / Final, Motivo, Origem.
- **Mensagem Complementar alert:** shows `spcData["mensagem-complemento"]` with the `S===`/`===S` wrappers removed.

**SPC payload quirks.** Keys are kebab-case. Lists with a single entry often arrive as a **single object instead of an array**: always normalize with `toArray` (exported from `GrupoEconomicoBlock.tsx`) before calling `.map`/`.length`. "Has data" checks must look inside nested groups (see `hasHistoricoScrData`, `hasGovernancaData`), not only test for the object's presence. Several field paths were guessed without a real sample. Ask the user for a JSON sample rather than guessing again.

**Printing / PDF.**
- `index.css` has `@page` margin boxes: the logo header uses `public/partner-logos/cdl-spc-positivo.svg` (both SVGs merged, because layered backgrounds break in Chrome's print margin), plus "Página X de Y".
- `useIsPrinting` (uses `flushSync`) opens collapsed accordions while printing. The Informações Cadastrais accordions start closed on screen but print open.
- Elements marked `data-print-hidden` are hidden on paper. `PrintCover` and `PrintSectionsDialog` live in `src/components`.

**External calls from the browser.**
- ViaCEP (`hooks/useViaCep.ts`) supplies the street name in the Endereço field.
- `utils/getGoogleMapsUrl` + `GoogleMapsButton` open the address in Google Maps, without the complemento or CEP.

**Adding a product** touches four places:
- the search and result pages in `src/pages`
- the routes in `App.tsx`
- `SEARCH_PATHS` in `components/layout/Layout.tsx`
- the menu entry in `components/layout/Sidebar.tsx`

**Conventions.** Use the `@/` alias for `src/`. Formatting and validation helpers (CPF/CNPJ/CEP/phone/currency/date) are in `src/utils/<name>/`; reuse them. `src/components/ui` is shadcn-generated. Theme color: primary `#243871` (`hsl(224 52% 29%)`). Use `text-primary`/`bg-primary`, not hardcoded hex.

## Known open questions (unconfirmed with the back end)

- Field names in `spcData.socio["detalhe-socio"]` were copied from the administrador format.
- In contumácia records, the Data Inclusão and Motivo field paths are guesses.
- `"PENDENTE DE REGULARIZACAO"` is compared without accents. If the API sends `REGULARIZAÇÃO`, it never matches.
- Grupo Econômico CNPJs in the sample were masked (`/0000-00`). If the real API masks them too, the document lookup sends an invalid CNPJ.
- Insumos `5264` (CPF suspeito) and `5239` (Classificação de Risco) have no section on the result page.
