const kagiBaseUrl = "https://kagi.com/";
let extensionToken = undefined; // use process memory to hold the token

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    chrome.tabs.create({ url: kagiBaseUrl });
    chrome.contextMenus.create({
      id: "kagi-image-search",
      title: "Kagi Image Search",
      contexts: ["image"],
    });
  }
});

async function loadTokenFromCookies() {
  const cookie = await chrome.cookies.get({
    url: kagiBaseUrl,
    name: "kagi_session",
  });

  if (!cookie || !cookie.value || cookie.value.trim().length === 0) {
    return;
  }
  return cookie.value;
}

async function applyHeader() {
  // check if PP mode is enabled, if so remove X-Kagi-Authorization header
  await requestPPMode();
  const pp_mode_enabled = await isPPModeEnabled();
  if (pp_mode_enabled) {
    await removeRules();
    return;
  }

  // PP mode is not enabled, check if Token in Cookies changed
  const tokenFromCookies = await loadTokenFromCookies();
  if (tokenFromCookies && tokenFromCookies !== extensionToken) {
    extensionToken = tokenFromCookies;
  }

  // finally apply X-Kagi-Authorization header with up-to-date Token value
  if (extensionToken) await updateRules();
}

chrome.webRequest.onCompleted.addListener(applyHeader, {
  urls: ["https://*.kagi.com/*"],
});

async function updateRules() {
  // https://developer.chrome.com/docs/extensions/reference/api/declarativeNetRequest#dynamic-and-session-rules
  // dynamic needed as the token can't be known ahead of time
  await chrome.declarativeNetRequest.updateDynamicRules({
    addRules: [
      {
        id: 1,
        priority: 1,
        action: {
          type: "modifyHeaders",
          requestHeaders: [
            {
              header: "X-Kagi-Authorization",
              value: extensionToken,
              operation: "set",
            },
          ],
        },
        condition: {
          urlFilter: `||kagi.com/`,
          resourceTypes: ["main_frame", "xmlhttprequest"],
        },
      },
    ],
    removeRuleIds: [1],
  });
}

async function removeRules() {
  await chrome.declarativeNetRequest.updateDynamicRules({
    addRules: [],
    removeRuleIds: [1],
  });
}

// Image Search
function kagiImageSearch(info) {
  const imageUrl = encodeURIComponent(info.srcUrl);
  chrome.tabs.create({
    url: `${kagiBaseUrl}images?q=${imageUrl}&reverse=reference`,
  });
}


chrome.contextMenus.onClicked.addListener((info, _) => {
  if (info.menuItemId === "kagi-image-search") {
    kagiImageSearch(info);
  }
});


// Communication with Kagi Privacy Pass extension

/*
  This extension makes the browser send a custom X-Kagi-Authorization header
  to kagi.com, to authenticate users even when using incognito mode.
  This can enter a "race condition" with the Kagi Privacy Pass extension,
  which strips all de-anonymising information sent to kagi.com, such as X-Kagi-Authorization,
  whenever "Privacy Pass mode" is in use.

  To avoid this race, we let the two extensions communicate, so that this extenesion removes
  (respectively, adds) the header when "Privacy Pass mode" is active (respectively, "PP mode"
  is inactive or the other extension is not installed/enabled).

  We achieve this syncronization with a simple messaging protocol outlined below:

  The Privacy Pass extension will send this extension single messages:
  - When being enabled (installed, activated) reports whether "PP mode" is enabled
  - When activating/deactivating "PP mode"
  Due to Chromium extension limitations, it cannot send a message when uninstalled/deactivated.

  The main extension (this one) keeps track of whether the "PP mode" is acrive or not by keeping state.
  This state is updated by the following actions:
  - When this extension is being enabled (installed, activated), it asks the PP extension for the "PP mode".
  - When it receives a status report from the PP extension, updates its state.

  Having both extensions send / request the "PP mode" status allows for the following:
  - When both are installed and active, whenever "PP mode" is toggled, this extension is informed and adjusts
  - Whenever one extension is installed, it attempts to sync with the other on whether "PP mode" is active

  There is one limitation, due to the PP extension being unable to signal to this one that it was uninstalled.
  This means that in theory, one could have a scenario where first PP mode is enabled, this extension removes
  X-Kagi-Authorization, and then the PP extension is uninstalled. In Incognito mode, where the kagi_session
  cookie is not sent by the browser, this would cause failed authentication with Kagi.

  Possible solutions:
  1. have PP extension open a URL on uninstall, that signals this extension to update the header. This is possible
     but it means adding an extra new tab on uninstall.
  2. Have this extension periodically poll whether the other one was uninstalled. This adds needless communication.
     Polling only when applying the header is not sufficient (as the PP extension could be uninstalled without
     webRequest.onComplete being triggered).

  In practice neither of these solutions seems necessary. Instead, we have this extension poll the PP extension every
  time it checks whether to apply the header. This means that even in the case where the PP extension is uninstalled while
  PP mode was set on, at most one query to kagi.com will fail to authenticate. Such query will then trigger webRequest.onComplete,
  which will then find out the PP extension was uninstalled, and hence reinstate X-Kagi-Authorize.
*/

const CHROME_KAGI_PRIVACY_PASS_EXTENSION = "mendokngpagmkejfpmeellpppjgbpdaj";

async function requestPPMode() {
  let pp_mode_enabled = false;
  try {
    pp_mode_enabled = await chrome.runtime.sendMessage(CHROME_KAGI_PRIVACY_PASS_EXTENSION, "status_report");
  } catch (ex) {
    // other end does not exist, likely Privacy Pass extension disabled/not installed
    pp_mode_enabled = false; // PP mode not enabled
  }
  await chrome.storage.local.set({ "pp_mode_enabled": pp_mode_enabled })
}

async function isPPModeEnabled() {
  const { pp_mode_enabled } = await chrome.storage.local.get({ "pp_mode_enabled": false });
  return pp_mode_enabled;
}

// PP extension sent an unsolicited status report
// We update our internal assumption, and update header application
chrome.runtime.onMessageExternal.addListener(async (request, sender, sendResponse) => {
  if (sender.id !== CHROME_KAGI_PRIVACY_PASS_EXTENSION) {
    // ignore messages from extensions other than the PP one
    return;
  }
  // check the message is about the PP mode
  if ('enabled' in request) {
    // update X-Kagi-Authorization header application
    await applyHeader();
  }
});

// when extension is started, ask for status report, and apply header accordingly
(async () => {
  await applyHeader();
})();
