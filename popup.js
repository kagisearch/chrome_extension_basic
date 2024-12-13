const checkbox = document.querySelector('input[type="checkbox"]');

if (checkbox) {
  const { isKagiSearchNewTabEnabled } = await chrome.storage.sync.get([
    "isKagiSearchNewTabEnabled",
  ]);
  checkbox.checked = isKagiSearchNewTabEnabled;

  checkbox.addEventListener("change", async () => {
    await chrome.storage.sync.set({
      isKagiSearchNewTabEnabled: checkbox.checked,
    });
  });
}