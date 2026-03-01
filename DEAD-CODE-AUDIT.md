# Dead Code Audit — UpTend Codebase

**Date:** 2026-02-28  
**Auditor:** OpenClaw automated audit  
**Scope:** Dead routes, pages, components, services

---

## 1. Dead Page Files (not routed in App.tsx)

| File | Why Dead | Safe to Remove? |
|------|----------|-----------------|
| `client/src/pages/snap-quote.tsx` | Not routed — `/snap-quote` redirects to `/book`. Only referenced by redirect. | ✅ Yes |
| `client/src/pages/quote.tsx` | Not imported or routed anywhere in App.tsx | ✅ Yes |
| `client/src/pages/ai/photo-quote.tsx` | Not routed — `/ai/photo-quote` redirects to `/book`. Only referenced by redirect. | ✅ Yes |
| `client/src/pages/about-alan.tsx` | Not imported anywhere. Zero references in entire client/src. | ✅ Yes |
| `client/src/pages/booking-legacy.tsx` | Not imported anywhere. Zero references in entire client/src. | ✅ Yes |
| `client/src/pages/dwellscan-landing.tsx` | Not imported anywhere. Zero references in entire client/src. | ✅ Yes |

---

## 2. Dead Component Files

| File | Why Dead | Safe to Remove? |
|------|----------|-----------------|
| `client/src/components/snap-quote.tsx` | Only imported by dead page `pages/snap-quote.tsx`. No other consumers. | ✅ Yes (remove with page) |
| `client/src/components/ai/ai-chat-widget.tsx` | Exported from `components/ai/index.ts` but **never imported** outside `ai/` directory. Not used in any page or component. | ✅ Yes |
| `client/src/components/ai/chat-widget.tsx` | Exported from `components/ai/index.ts` but **never imported** outside `ai/` directory. `meet-george.tsx` has a local `openChatWidget` function — not this component. | ✅ Yes |
| `client/src/components/ai/photo-quote-uploader.tsx` | Exported from `components/ai/index.ts` but **never imported** outside `ai/` directory. | ✅ Yes |
| `client/src/components/booking-chatbot.tsx` | Not imported by any other file. Zero external references. | ✅ Yes |

**Note:** After removing the 3 dead AI components above, clean up `client/src/components/ai/index.ts` to remove their re-exports (`AiChatWidget`, `PhotoQuoteUploader`).

---

## 3. Dead/Questionable Server Routes

| File | Why Dead | Safe to Remove? |
|------|----------|-----------------|
| `server/routes/ai/snap-quote.routes.ts` | **Still mounted** in `server/routes/index.ts` via `registerSnapQuoteRoutes(app)`. Client redirects `/snap-quote` → `/book`, so the API still exists but the UI is dead. | ⚠️ Check if mobile app uses `/api/snap-quote` before removing |
| `server/routes/ai/photo-quote.routes.ts` | **Still mounted** via `server/routes/ai/index.ts` → `createPhotoQuoteRoutes`. Client UI is dead (redirects to /book). | ⚠️ Check if mobile app or George chatbot calls `/api/ai/photo-quote` before removing |

---

## 4. Dead Server Services

| File | Why Dead | Safe to Remove? |
|------|----------|-----------------|
| `server/services/carbon-credit-registry.ts` | Zero references outside its own file. Not imported by any route or service. | ✅ Yes |
| `server/services/marketing-automation.ts` | Zero references outside its own file. Not imported anywhere. | ✅ Yes |
| `server/services/sms-package-recommender.ts` | Zero references outside its own file. Not imported anywhere. | ✅ Yes |
| `server/services/carbonCreditService.test.ts` | Test file with zero references. Likely orphaned test for dead service. | ✅ Yes |

---

## 5. Unused Imports / Stale Comments in Key Files

### App.tsx
- **Line 94:** Comment `// photo-quote removed` — stale comment, can clean up
- **Line 196:** Comment `// snap-quote removed` — stale comment, can clean up
- **Lines 394-395:** Redirect routes for `/ai/photo-quote` and `/snap-quote` → `/book` — can be removed once dead pages are deleted (keep redirects if SEO/bookmarks matter)

### server/routes/index.ts
- **`registerSnapQuoteRoutes`** — Still imported and mounted. Should be removed if API is confirmed dead.
- **`registerHaulerAuthRoutes`, `registerHaulerProfileRoutes`, `registerHaulerStatusRoutes`, `registerAcademyRoutes`** — These appear to be legacy aliases (hauler → pro rename). They're still mounted so not dead, but worth consolidating.

### client/src/components/ai/index.ts
- Re-exports `AiChatWidget` and `PhotoQuoteUploader` which are never consumed. Clean up after removing dead components.

---

## Summary

| Category | Dead Items | Est. Lines Removable |
|----------|-----------|---------------------|
| Dead pages | 6 files | ~1,500+ |
| Dead components | 5 files | ~800+ |
| Dead services | 4 files | ~400+ |
| Stale server routes | 2 files (needs mobile check) | ~500+ |
| **Total** | **17 files** | **~3,200+ lines** |

### Recommended Removal Order
1. Dead pages (about-alan, booking-legacy, dwellscan-landing, snap-quote, quote, ai/photo-quote)
2. Dead components (snap-quote, ai-chat-widget, chat-widget, photo-quote-uploader, booking-chatbot)
3. Clean up `components/ai/index.ts` exports
4. Dead services (carbon-credit-registry, marketing-automation, sms-package-recommender, test file)
5. **After confirming no mobile/API consumers:** Remove snap-quote.routes.ts and photo-quote.routes.ts from server
6. Remove App.tsx redirect routes for `/snap-quote` and `/ai/photo-quote` (or keep for SEO 301s)
