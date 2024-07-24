const kagiBaseUrl = "https://kagi.com/";
let extensionToken = undefined; // use process memory to hold the token

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    chrome.tabs.create({ url: kagiBaseUrl });
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

  let valuesDiffer = cookie.value !== extensionToken;
  extensionToken = cookie.value;
  if (valuesDiffer) await updateRules();
}

chrome.webRequest.onCompleted.addListener(loadTokenFromCookies, {
  urls: [`${kagiBaseUrl}*`],
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
              header: "Authorization",
              value: extensionToken,
              operation: "set",
            },
          ],
        },
        condition: {
          urlFilter: `${kagiBaseUrl}*`,
          resourceTypes: ["main_frame"],
        },
      },
    ],
    removeRuleIds: [1],
  });
}
