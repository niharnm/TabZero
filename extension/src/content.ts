// Content scripts are loaded as classic scripts, so this file must stay
// self-contained (no imports that would become shared chunks). Keep the
// allowlist in sync with src/lib/config.ts.
const ALLOWED_WEB_ORIGINS = new Set<string>(["http://localhost:3000"]);
try {
  const configured = import.meta.env.VITE_WEB_APP_URL;
  if (configured) ALLOWED_WEB_ORIGINS.add(new URL(configured).origin);
} catch {
  // malformed build URL: only localhost stays allowed
}
const isAllowedWebOrigin = (origin: string) => ALLOWED_WEB_ORIGINS.has(origin);

const TABZERO_WEB_SOURCE = "tabzero-web";
const TABZERO_EXTENSION_SOURCE = "tabzero-extension";
const REQUEST_CURRENT_TABS = "TABZERO_REQUEST_CURRENT_TABS";
const CURRENT_TABS_RESPONSE = "TABZERO_CURRENT_TABS_RESPONSE";
const COLLECT_CURRENT_TABS = "TABZERO_COLLECT_CURRENT_TABS";

type TabsBridgeRequest = {
  source?: string;
  type?: string;
  requestId?: string;
};

window.addEventListener("message", (event: MessageEvent<TabsBridgeRequest>) => {
  if (event.source !== window) return;
  // Only relay for the TabZero web app origin, never for arbitrary pages.
  if (!isAllowedWebOrigin(window.location.origin) || event.origin !== window.location.origin) {
    return;
  }

  const request = event.data;
  if (
    request?.source !== TABZERO_WEB_SOURCE ||
    request.type !== REQUEST_CURRENT_TABS ||
    !request.requestId
  ) {
    return;
  }

  chrome.runtime.sendMessage(
    {
      type: COLLECT_CURRENT_TABS,
      requestId: request.requestId,
    },
    (response) => {
      const lastError = chrome.runtime.lastError;
      window.postMessage(
        {
          source: TABZERO_EXTENSION_SOURCE,
          type: CURRENT_TABS_RESPONSE,
          requestId: request.requestId,
          ok: !lastError && Boolean(response?.ok),
          tabs: response?.tabs ?? [],
          error:
            lastError?.message ||
            response?.error ||
            "Tab access was not granted. Paste your tabs manually below.",
        },
        window.location.origin,
      );
    },
  );
});
