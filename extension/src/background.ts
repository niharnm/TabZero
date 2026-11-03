import { collectTabs } from "./lib/collectTabs";
import { isAllowedWebOrigin } from "./lib/config";

const COLLECT_CURRENT_TABS = "TABZERO_COLLECT_CURRENT_TABS";

type CollectCurrentTabsMessage = {
  type?: string;
  requestId?: string;
};

chrome.runtime.onMessage.addListener((message: CollectCurrentTabsMessage, sender, sendResponse) => {
  if (message?.type !== COLLECT_CURRENT_TABS) return false;
  // Defense in depth: only our own content script on an allowed web origin.
  if (sender.id !== chrome.runtime.id || !isAllowedWebOrigin(sender.origin)) {
    sendResponse({ ok: false, requestId: message.requestId, error: "Sender not allowed." });
    return false;
  }

  collectTabs()
    .then((tabs) => {
      sendResponse({
        ok: true,
        requestId: message.requestId,
        tabs,
      });
    })
    .catch((caught) => {
      sendResponse({
        ok: false,
        requestId: message.requestId,
        error: caught instanceof Error ? caught.message : "Unable to read current-window tabs.",
      });
    });

  return true;
});
