# CMS Removal Implementation Plan

This plan details the complete removal of the CMS (Web Editor) system from the project while ensuring all other features remain intact.

## Proposed Changes

### 1. Frontend Directories & Files to Delete
- `src/editor` (Entire directory containing CMS components, schemas, hooks, etc.)
- `src/pages/admin/WebEditor.jsx` (The main CMS interface)
- `src/pages/EditorTest.jsx` (CMS testing route)

### 2. Frontend Routing Updates (`src/App.jsx`)
- Remove all routes pointing to the CMS (`/editor-test`, `/admin/web-editor`).
- Remove the lazy imports for `WebEditor` and `EditorTest`.

### 3. Frontend Navigation Updates (`src/pages/admin/AdminLayout.jsx`)
- Remove the CMS / Web Editor link from the sidebar menu to completely hide it from the admin panel.

### 4. State & Context Cleanup (`src/context/LanguageContext.jsx`)
- Remove `cmsData` and `previewData` states.
- Remove the `loadCms` effect that fetches CMS blocks (`hero`, `history`, `contact`, `footer`) on load.
- Ensure the `t()` translation function smoothly falls back to literal string keys (which it already does).
- **Note:** `PastorMessage.jsx` uses the `getBlock` and `saveBlock` API endpoints, so these backend routes and the `ContentBlock` model will be preserved.

### 5. Dependency Cleanup (`package.json`)
- Identify and remove any npm packages exclusively used by the CMS (e.g., drag-and-drop libraries, rich text editors).

## User Review Required
> [!IMPORTANT]
> The CMS content blocks (`hero`, `history`, `contact`, `footer`) currently fetched on load will be removed from `LanguageContext.jsx`. The frontend will rely on the default hardcoded English strings passed to the `t()` function. Are you okay with removing this dynamic fetching, or would you like to keep the read-only fetching of these existing blocks despite the editor being removed?

## Verification Plan
### Automated Tests
- Build the frontend (`npm run build`) to ensure zero missing imports or broken dependencies.
### Manual Verification
- Verify the admin sidebar no longer shows the Web Editor.
- Verify `Pastor Messages` continues to load, save, and function correctly.
- Verify the public site loads without throwing CMS-related errors.
