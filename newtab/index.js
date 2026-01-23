const DARK_MODE_ENABLED = window.localStorage.getItem("dark_mode")
const SEARCH_URL_BASE = "https://kagi.com/search?q="

const SEARCH_BOX = document.querySelector(".search input");
const ENABLE_LIGHT_MODE_BUTTON = document.getElementById("enable-light-mode-button");
const ENABLE_DARK_MODE_BUTTON = document.getElementById("enable-dark-mode-button");

function set_dark_mode(is_enabled) {
    let elements = document
        .getElementsByClassName("variable-color");

    for (let e of elements) {
        e.style.setProperty("filter", `invert(${is_enabled === "true"? 0 : 1})`);
    }

    document.documentElement.style.setProperty(
        "--background",
        is_enabled === "true"? "rgb(24, 24, 26)" : "white"
    );
    document.documentElement.style.setProperty(
        "--background-accent",
        is_enabled === "true"? "rgb(47, 47, 49)" : "white"
    );
    document.documentElement.style.setProperty(
        "--background-alt",
        is_enabled === "true"? "rgb(112, 112, 119)" : "rgb(230, 230, 232)"
    );
    document.documentElement.style.setProperty(
        "--background-invert",
        is_enabled === "true"? "white" : "black"
    );

    if (is_enabled === "true") {
        ENABLE_LIGHT_MODE_BUTTON.style.display = "";
        ENABLE_DARK_MODE_BUTTON.style.display = "none";
    } else {
        ENABLE_LIGHT_MODE_BUTTON.style.display = "none";
        ENABLE_DARK_MODE_BUTTON.style.display = "";
    }

    window.localStorage.setItem("dark_mode", is_enabled);
}

function execute_search(query) {
    if (query === "") { return; }
    window.location = SEARCH_URL_BASE + encodeURI(query);
}

set_dark_mode(DARK_MODE_ENABLED? DARK_MODE_ENABLED : "false");

SEARCH_BOX.addEventListener("keyup", (e) => {
    if (e.key === "Enter") {
        execute_search(SEARCH_BOX.value);
    }
})

document.querySelector(".search img").addEventListener("click", (e) => {
    execute_search(SEARCH_BOX.value);
})

ENABLE_LIGHT_MODE_BUTTON.onclick = () => {
    set_dark_mode("false");
}

ENABLE_DARK_MODE_BUTTON.onclick = () => {
    set_dark_mode("true");
}
