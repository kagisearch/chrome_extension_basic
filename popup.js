const checkbox = document.querySelector('input[type="checkbox"]');
const OPTIONAL_PERMISSIONS = { permissions: ["tabs"] };
const hasOptionalPermissions = await chrome.permissions.contains(OPTIONAL_PERMISSIONS);

if (checkbox) {
  if (hasOptionalPermissions) {
    checkbox.checked = true;
  } else {
    checkbox.checked = false;
  }

  checkbox.addEventListener("change", async () => {
    if (checkbox.checked) {
      chrome.permissions.request(OPTIONAL_PERMISSIONS);
    } else {
      chrome.permissions.remove(OPTIONAL_PERMISSIONS);
    }
  });
}