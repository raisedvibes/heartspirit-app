# Expo Mobile Build Audit – Fixes Applied

## Problems Found

### 1) pnpm workspace error: `@heartspirit/ui-tokens@workspace:*` not found

**Cause:**
- `heartspirit-app/pnpm-workspace.yaml` correctly lists `apps/*` and `packages/*`
- `packages/ui-tokens` exists with `"name": "@heartspirit/ui-tokens"` in `packages/ui-tokens/package.json`
- A nested `apps/mobile/pnpm-workspace.yaml` (with only `onlyBuiltDependencies`) made `apps/mobile` a separate workspace root, so pnpm did not resolve the parent workspace and `workspace:*` failed when installing from `apps/mobile`

**Fix applied:**
- Switched `apps/mobile/package.json` from `"@heartspirit/ui-tokens": "workspace:*"` to `"@heartspirit/ui-tokens": "file:../../packages/ui-tokens"`
- Deleted `apps/mobile/pnpm-workspace.yaml`

---

### 2) expo-blur BlurView undefined

**Cause:**
- `BlurView` can be undefined if the native module is not loaded or if the import fails at runtime
- Direct `import { BlurView } from 'expo-blur'` crashes when `BlurView` is undefined

**Fix applied:**
- Added `apps/mobile/components/tab-bar-blur-background.tsx`, which uses a guarded `require` and checks `expoBlur?.BlurView`
- If `BlurView` exists: render BlurView + overlay
- If `BlurView` is undefined: render a solid overlay only
- Updated `apps/mobile/app/(tabs)/_layout.tsx` to use `tabBarBackground: () => <TabBarBlurBackground />`

**If blur is still missing after rebuild**, run:
```bash
cd heartspirit-app
pnpm install
cd apps/mobile
npx expo start -c
```
Or for a native rebuild:
```bash
cd heartspirit-app/apps/mobile
npx expo prebuild --clean
npx expo run:ios   # or run:android
```

---

### 3) Expo Router: No route named `energy` exists, but `energy/index` does

**Cause:**
- Route file layout: `app/(tabs)/energy/index.tsx`
- Expo Router treats this as `energy/index`, not `energy`
- `TabLayout` had `name="energy"` but the route is `energy/index`

**Fix applied:**
- In `apps/mobile/app/(tabs)/_layout.tsx`, changed `name="energy"` to `name="energy/index"`

---

## File Edits Summary

| File | Change |
|------|--------|
| `apps/mobile/package.json` | `"@heartspirit/ui-tokens": "workspace:*"` → `"@heartspirit/ui-tokens": "file:../../packages/ui-tokens"` |
| `apps/mobile/pnpm-workspace.yaml` | **Deleted** |
| `apps/mobile/app/(tabs)/_layout.tsx` | `name="energy"` → `name="energy/index"`; tab bar background moved to `TabBarBlurBackground` |
| `apps/mobile/components/tab-bar-blur-background.tsx` | **Created** – guarded BlurView + fallback overlay |

---

## Commands to Run

```bash
# From monorepo root
cd /Users/gjynostroza/raisedvibes-heartspirit/heartspirit-app
pnpm install

# Reinstall mobile deps (if ui-tokens still fails)
cd apps/mobile
pnpm install

# Clear Metro cache and restart
npx expo start -c

# Full native rebuild (if BlurView still undefined after cache clear)
npx expo prebuild --clean
npx expo run:ios
```
