# Remove Legacy `App` Module — Step-by-Step Checklist

This document tracks the work required to delete `packages/trader/src/App/` and `packages/trader/src/Modules/Trading/` (the V1 trade form).

**Why both?** `Modules/Trading/` is the V1 trade form only rendered by `App/`. AppV2 uses `AppV2/Containers/Trade/` instead. Deleting both together eliminates ~90% of cross-module dependencies.

**What stays:**

- `Modules/Contract/` — serves desktop contract details via `AppV2/Routes/ContractDetailsSwitch.tsx`
- `Stores/Modules/Trading/trade-store.ts` — the main trading state machine used by AppV2
- `Stores/Modules/Trading/Helpers/` — AppV2 **already imports directly from here**; do NOT move these

---

## Dependency map (external consumers only)

| What to move/delete                                     | Current location                                      | Used by                                                                                                                                                                                         | Destination                                                                                                      |
| ------------------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `init-store.ts`                                         | `App/`                                                | `AppV2/app.tsx`                                                                                                                                                                                 | `Stores/`                                                                                                        |
| `PositionsDrawer/helpers/positions-helper.ts`           | `App/Components/Elements/`                            | `AppV2/Hooks/useOrderDetails.ts`, `AppV2/Containers/Chart/trade-chart.tsx`, `Modules/SmartChart/.../accumulators-chart-elements.tsx`, `Modules/Contract/.../ContractAudit/contract-details.tsx` | `Modules/Contract/Components/ContractAudit/` (co-locate with only remaining consumer after Modules/Trading dies) |
| `Animations/` (Bounce, SlideIn)                         | `App/Components/`                                     | `Modules/Contract/Components/Digits/`, `InfoBox/`, `LastDigitPrediction/`                                                                                                                       | `Modules/Contract/Components/Animations/`                                                                        |
| `chart-loader.tsx`                                      | `App/Components/Elements/`                            | `Modules/Contract/Containers/contract-replay.tsx`                                                                                                                                               | `Modules/Contract/Components/`                                                                                   |
| `ContentLoader/` (PositionsCardLoader)                  | `App/Components/Elements/`                            | `App/Components/Elements/ContractDrawer/contract-drawer.tsx`                                                                                                                                    | `Modules/Contract/Components/ContentLoader/`                                                                     |
| `ContractDrawer/`                                       | `App/Components/Elements/`                            | `Modules/Contract/Containers/contract-replay.tsx`                                                                                                                                               | `Modules/Contract/Components/ContractDrawer/`                                                                    |
| `ContractAudit/`                                        | `App/Components/Elements/`                            | `App/Components/Elements/ContractDrawer/contract-drawer.tsx`                                                                                                                                    | `Modules/Contract/Components/ContractAudit/`                                                                     |
| `Errors/`                                               | `App/Components/Elements/`                            | `Modules/Contract/Containers/contract.tsx`                                                                                                                                                      | `Modules/Contract/Components/Errors/`                                                                            |
| `Sidebar/` + `PositionsDrawer/` (component)             | `App/Components/Layout/` + `App/Components/Elements/` | `AppV2/Containers/AppShell/app-shell.tsx`                                                                                                                                                       | `AppV2/Components/Layout/Sidebar/`                                                                               |
| `Modules/Trading/Helpers/contract-type.tsx`             | `Modules/Trading/Helpers/`                            | `AppV2/Utils/trade-types-utils.tsx`                                                                                                                                                             | `AppV2/Utils/`                                                                                                   |
| `Modules/Trading/Helpers/digits.ts`                     | `Modules/Trading/Helpers/`                            | `AppV2/Utils/layout-utils.tsx`, `AppV2/Containers/Trade/trade-mobile.tsx`, `Stores/Modules/Trading/trade-store.ts`                                                                              | `AppV2/Utils/`                                                                                                   |
| `Modules/Trading/Helpers/video-config.ts`               | `Modules/Trading/Helpers/`                            | 5 AppV2 files, `Modules/Contract/.../accumulators-stats-manual-modal.tsx`, `Assets/Trading/...`                                                                                                 | `AppV2/Utils/`                                                                                                   |
| `Modules/Trading/Components/Form/ContractType/types.ts` | `Modules/Trading/`                                    | `AppV2/Components/MarketSelector/market-selector.tsx`, `AppV2/Hooks/useContractsFor.ts`, `Modules/Trading/Helpers/contract-type.tsx`                                                            | `AppV2/Types/`                                                                                                   |

---

## Step 1 — Move `init-store.ts` to `Stores/`

`AppV2/app.tsx` imports `App/init-store`. Move it to `Stores/` where it logically belongs (it instantiates the trader's `RootStore`).

- [ ] Move `packages/trader/src/App/init-store.ts` → `packages/trader/src/Stores/init-store.ts`
- [ ] Move `packages/trader/src/App/__tests__/init-store.spec.ts` → `packages/trader/src/Stores/__tests__/init-store.spec.ts`
- [ ] Update import in `AppV2/app.tsx`: `from 'App/init-store'` → `from 'Stores/init-store'`
- [ ] Remove the `App` alias from jest `moduleNameMapper` only AFTER all other steps are done (alias must remain during the migration)
- [ ] Run `npm run test:jest -- --testPathPattern="Stores/__tests__/init-store"` — confirm passes

---

## Step 2 — Move `ContractType/types.ts` to `AppV2/Types/`

This pure TypeScript type file has no imports from the codebase (only from `react`). Move it first so steps 3 and 6 can reference it correctly.

- [ ] Create `packages/trader/src/AppV2/Types/` directory if it doesn't exist
- [ ] Copy `Modules/Trading/Components/Form/ContractType/types.ts` → `AppV2/Types/contract-type.ts`
    - **Do NOT delete the original yet** — it's still imported by `Modules/Trading/` internals which die in Step 8
- [ ] Update import in `AppV2/Components/MarketSelector/market-selector.tsx`: `from 'Modules/Trading/Components/Form/ContractType/types'` → `from 'AppV2/Types/contract-type'`
- [ ] Update import in `AppV2/Hooks/useContractsFor.ts`: same change
- [ ] Run `npm run test:jest -- --testPathPattern="AppV2"` — confirm passes

---

## Step 3 — Move `Modules/Trading/Helpers/` files used by AppV2

AppV2 imports from `Modules/Trading/Helpers/` (3 files). These must be relocated before `Modules/Trading/` can be deleted. Note: `Stores/Modules/Trading/Helpers/` is **separate** and stays untouched — AppV2 already imports directly from there.

### 3a — `video-config.ts`

- [ ] Move `Modules/Trading/Helpers/video-config.ts` → `AppV2/Utils/video-config.ts`
- [ ] Update imports (7 files):
    - [ ] `AppV2/Utils/contract-description-utils.tsx`
    - [ ] `AppV2/Components/AccumulatorStats/accumulator-stats.tsx`
    - [ ] `AppV2/Components/AccumulatorStats/accumulator-stats-description.tsx`
    - [ ] `AppV2/Components/OnboardingGuide/TradeTypesSelectionGuide/trade-types-selection-guide.tsx`
    - [ ] `AppV2/Components/OnboardingGuide/GuideForPages/onboarding-video.tsx`
    - [ ] `Modules/Contract/Components/AccumulatorsStats/accumulators-stats-manual-modal.tsx`
    - [ ] `Assets/Trading/Categories/contract-type-description-video.tsx`

### 3b — `digits.ts`

- [ ] Move `Modules/Trading/Helpers/digits.ts` → `AppV2/Utils/digits.ts`
- [ ] Update imports (3 files):
    - [ ] `AppV2/Utils/layout-utils.tsx`
    - [ ] `AppV2/Containers/Trade/trade-mobile.tsx`
    - [ ] `Stores/Modules/Trading/trade-store.ts` (imports `isDigitTradeType` from `Modules/Trading/Helpers/digits`)

### 3c — `contract-type.tsx` (the Modules/Trading one, not the Stores one)

- [ ] Move `Modules/Trading/Helpers/contract-type.tsx` → `AppV2/Utils/trading-contract-type-helpers.tsx`
    - **Note:** Rename to `trading-contract-type-helpers` to avoid confusion with `Stores/Modules/Trading/Helpers/contract-type.ts`
    - [ ] Update its internal import: `from '../Components/Form/ContractType/types'` → `from 'AppV2/Types/contract-type'` (moved in Step 2)
- [ ] Update imports (1 file):
    - [ ] `AppV2/Utils/trade-types-utils.tsx`: update `from 'Modules/Trading/Helpers/contract-type'`

- [ ] Run `npm run test:jest -- --testPathPattern="AppV2"` — confirm passes

---

## Step 4 — Move `Animations/` to `Modules/Contract/`

`Bounce` and `SlideIn` are only consumed by `Modules/Contract/Components/`.

- [ ] Create `packages/trader/src/Modules/Contract/Components/Animations/`
- [ ] Move `App/Components/Animations/bounce.tsx`, `slide-in.tsx`, `index.ts` → `Modules/Contract/Components/Animations/`
- [ ] Update import in `Modules/Contract/Components/Digits/digits.tsx`: `from 'App/Components/Animations'` → `from '../Animations'`
- [ ] Update import in `Modules/Contract/Components/InfoBox/info-box.tsx`: `from 'App/Components/Animations'` → `from '../Animations'`
- [ ] Update import in `Modules/Contract/Components/LastDigitPrediction/digit-display.tsx`: `from 'App/Components/Animations'` → `from '../Animations'`
- [ ] Run `npm run test:jest -- --testPathPattern="Modules/Contract"` — confirm passes

---

## Step 5 — Move `ContractAudit/`, `ContractDrawer/`, `ContentLoader/`, `chart-loader.tsx`, and `Errors/` to `Modules/Contract/`

These components are all consumed exclusively within `Modules/Contract/Containers/`. Do them together since `ContractDrawer` depends on `ContractAudit` and `ContentLoader`.

**Order matters within this step — bottom-up:**

### 5a — `Errors/`

- [ ] Move `App/Components/Elements/Errors/error-component.tsx`, `Errors/index.ts`, and `Errors/__tests__/` → `Modules/Contract/Components/Errors/`
- [ ] Update import in `Modules/Contract/Containers/contract.tsx`: `from 'App/Components/Elements/Errors'` → `from '../Components/Errors'`

### 5b — `chart-loader.tsx`

- [ ] Move `App/Components/Elements/chart-loader.tsx` and `App/Components/Elements/__tests__/chart-loader.spec.tsx` → `Modules/Contract/Components/`
- [ ] Update import in `Modules/Contract/Containers/contract-replay.tsx`: `from 'App/Components/Elements/chart-loader'` → `from '../Components/chart-loader'`

### 5c — `ContentLoader/`

- [ ] Move `App/Components/Elements/ContentLoader/` (positions-card.tsx, trade-params.tsx, index.ts) → `Modules/Contract/Components/ContentLoader/`
    - **Note:** `TradeParamsLoader` from `ContentLoader` is only used by `Modules/Trading/screen-large.tsx` (dying in Step 8). Only `PositionsCardLoader` is used by `ContractDrawer`.
- [ ] No import updates needed yet — `ContractDrawer` still uses `App/Components/Elements/ContentLoader` path; update in next sub-step

### 5d — `ContractAudit/`

- [ ] Move `App/Components/Elements/ContractAudit/` (all files + tests) → `Modules/Contract/Components/ContractAudit/`
- [ ] Fix import inside moved `ContractAudit/contract-details.tsx`:
    - `from 'App/Components/Elements/PositionsDrawer/helpers'` — **this file and positions-helper.ts will now be co-located** — update to `from './positions-helper'` AFTER positions-helper.ts also moves here (see Step 5e)
    - `from 'Stores/Modules/Trading/Helpers/logic'` — this path stays valid, no change needed

### 5e — `PositionsDrawer/helpers/positions-helper.ts`

- [ ] Move `App/Components/Elements/PositionsDrawer/helpers/positions-helper.ts` and its test → `Modules/Contract/Components/ContractAudit/`
    - **Rationale:** After `Modules/Trading/` is deleted, the only remaining consumers are `Modules/Contract/` and `AppV2`. Co-locating with `ContractAudit/` (which is the heaviest consumer) and exporting from there is cleaner than `AppV2/Utils/` which would mean a cross-module import.
- [ ] Update import in moved `ContractAudit/contract-details.tsx`: `from 'App/Components/Elements/PositionsDrawer/helpers'` → `from './positions-helper'`
- [ ] Update import in `AppV2/Hooks/useOrderDetails.ts`: `from 'App/Components/Elements/PositionsDrawer/helpers'` → `from 'Modules/Contract/Components/ContractAudit/positions-helper'`
- [ ] Update import in `AppV2/Containers/Chart/trade-chart.tsx`: same update
- [ ] Update import in `Modules/SmartChart/Components/Markers/accumulators-chart-elements.tsx`: same update

### 5f — `ContractDrawer/`

- [ ] Move `App/Components/Elements/ContractDrawer/` (all 5 files + tests) → `Modules/Contract/Components/ContractDrawer/`
- [ ] Fix imports inside moved `ContractDrawer/contract-drawer.tsx`:
    - `from 'App/Components/Elements/ContractAudit'` → `from '../ContractAudit'`
    - `from 'App/Components/Elements/ContentLoader'` → `from '../ContentLoader'`
- [ ] Update import in `Modules/Contract/Containers/contract-replay.tsx`: `from 'App/Components/Elements/ContractDrawer'` → `from '../Components/ContractDrawer'`

- [ ] Run `npm run test:jest -- --testPathPattern="Modules/Contract"` — confirm passes

---

## Step 6 — Move `Sidebar/` and `PositionsDrawer/` component to `AppV2/Components/Layout/`

The Sidebar is used by `AppV2/Containers/AppShell/app-shell.tsx`. It internally uses `PositionsDrawerContent`/`PositionsDrawerFooter` from `App/Components/Elements/PositionsDrawer/`.

- [ ] Create `packages/trader/src/AppV2/Components/Layout/Sidebar/`
- [ ] Move `App/Components/Layout/Sidebar/` (sidebar.tsx, account-selector.tsx, language-selector.tsx, theme-selector.tsx, index.ts, `__tests__/`) → `AppV2/Components/Layout/Sidebar/`
- [ ] Move `App/Components/Elements/PositionsDrawer/positions-drawer-content.tsx`, `empty-portfolio-message.tsx`, `index.ts`, `__tests__/` → `AppV2/Components/Layout/Sidebar/PositionsDrawer/`
    - **Note:** The helpers sub-directory was already moved in Step 5e; only the React component files move here
- [ ] Fix import inside moved `sidebar.tsx`: `from '../../Elements/PositionsDrawer'` → `from './PositionsDrawer'`
- [ ] Update import in `AppV2/Containers/AppShell/app-shell.tsx`: `from 'App/Components/Layout/Sidebar/sidebar'` → `from 'AppV2/Components/Layout/Sidebar/sidebar'`
- [ ] Run `npm run test:jest -- --testPathPattern="AppV2/Components/Layout"` — confirm passes

---

## Step 7 — Verify `App/` has no remaining external consumers

Before deleting, confirm nothing outside `App/` still imports from it.

- [ ] Run: `grep -r "from 'App/" packages/trader/src --include="*.ts" --include="*.tsx" | grep -v "App/" | grep -v "__tests__"` — must return zero results

If any remain, fix them before proceeding.

---

## Step 8 — Delete `Modules/Trading/`

Before deleting, verify no external consumers remain.

- [ ] Run: `grep -r "from 'Modules/Trading" packages/trader/src --include="*.ts" --include="*.tsx" | grep -v "__tests__\|Modules/Trading/"` — must return zero results
- [ ] Run: `grep -r "from 'Stores/Modules/Trading/Helpers" packages/trader/src --include="*.ts" --include="*.tsx" | grep -v "__tests__\|trade-store.ts"` — should show zero results (AppV2's existing Stores/ imports are fine and stay)
- [ ] Delete `packages/trader/src/Modules/Trading/` entirely

---

## Step 9 — Delete `App/`

- [ ] Delete `packages/trader/src/App/` entirely

---

## Step 10 — Remove `App` path alias from build config and jest

- [ ] Remove `App: path.resolve(__dirname, '../src/App')` from `packages/trader/build/constants.js` (`ALIASES` object)
- [ ] Remove `'^App/(.*)$': '<rootDir>/src/App/$1'` from `packages/trader/jest.config.js` `moduleNameMapper`
- [ ] Remove `'App/*': ['src/App/*']` from `packages/trader/tsconfig.json` `compilerOptions.paths`

---

## Step 11 — Final verification

- [ ] Run `npm run test:jest -- --testPathPattern="packages/trader"` — all tests pass
- [ ] Run `npm run test:eslint-all` — no lint errors
- [ ] Run `npm run serve core` — app loads
- [ ] Verify on mobile: trade page, positions page, contract details
- [ ] Verify on desktop: trade page, contract details (V1 path via `ContractDetailsSwitch`)
- [ ] Run `npm run analyze:bundle --workspace=@deriv/trader` — confirm bundle size reduction

---

## Important notes

- **`Stores/Modules/Trading/Helpers/`** — do NOT touch. AppV2 already imports directly from here and it works. Moving this directory would require updating ~15 files for zero benefit.
- **Step ordering** — Steps 1–3 are independent. Steps 4–6 must happen before Steps 7–9. Step 10 must be last.
- **`types.ts` in Step 2** — copy first, don't delete the original until `Modules/Trading/` is deleted in Step 8.
- **`PositionsCardLoader` vs `TradeParamsLoader`** — `ContentLoader` exports both. Only `PositionsCardLoader` is needed in `Modules/Contract`. `TradeParamsLoader` is only used by the V1 screen-large and dies with it.
- **`positions-helper.ts` destination** — moved to `Modules/Contract/Components/ContractAudit/` (Step 5e), not `AppV2/Utils/`. It's used by `Modules/Contract` and `AppV2`/`Modules/SmartChart`. A `Modules/Contract` location is more neutral than burying it in `AppV2/Utils/`.
