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
