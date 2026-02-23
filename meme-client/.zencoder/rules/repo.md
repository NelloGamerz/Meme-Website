# Repository Overview

- **Name**: meme-website-cient
- **Root**: d:\meme website\meme-client
- **Framework/Tooling**:
  - React 19, React Router 7
  - Vite 6, TypeScript 5.7
  - Tailwind CSS 4
  - Zustand 5 for state management
- **Build/Run**:
  1. `npm install`
  2. `npm run dev` (Vite dev server)
  3. `npm run build` (TypeScript build + Vite build)
  4. `npm run preview` (Preview production build)
- **Entry points**:
  - `src/main.tsx` (Vite/React entry)
  - `src/App.tsx` (app shell)
- **Routing**:
  - `src/pages/*`
- **Key folders**:
  - `src/components` UI components
  - `src/pages` Route pages
  - `src/store` Zustand stores (chat, user, settings, etc.)
  - `src/hooks` Custom hooks (websockets, auth, etc.)
  - `src/services` WebSocket service/event bus
  - `src/types` Shared TypeScript types
  - `src/utils` Helpers and utilities
- **Chat system notes**:
  - Store: `src/store/useChatStore.ts` combines state + actions; wrapped with `createSelectors` for `useChatStore.use.*` API.
  - WebSocket logic centralized in `src/hooks/useWebSockets.ts` and `src/hooks/useChatWebSocket.ts`.
  - Messages keyed by `chatRoomId` under `state.messages`.

# Developer Notes

- Zustand selectors are created via `createSelectors.ts`. This exposes `useChatStore.use.someKey()` style selectors and keeps components from re-rendering unnecessarily.
- If removing selectors, refactor all `(useChatStore.use as any).key()` and `useChatStore.use.key()` usages to `useChatStore(state => state.key)` and export store types to keep strong typing.
- Tailwind v4 is in use; config lives in `tailwind.config.js` and `postcss.config.cjs`.
- Environment: `.env` at project root. Ensure Vite variables use `VITE_` prefix.