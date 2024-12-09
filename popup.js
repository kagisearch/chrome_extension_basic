document.addEventListener("DOMContentLoaded", async () => {
  const checkbox = document.querySelector('input[type="checkbox"]');
  if (!checkbox) return;

  const { isKagiSearchNewTabEnabled } = await chrome.storage.sync.get([
    "isKagiSearchNewTabEnabled",
  ]);
  checkbox.checked = isKagiSearchNewTabEnabled;

  checkbox.addEventListener("change", async () => {
    await chrome.storage.sync.set({
      isKagiSearchNewTabEnabled: checkbox.checked,
    });
  });
});
