const DARK_MODE_ENABLED = window.localStorage.getItem("dark_mode")
const SEARCH_URL_BASE = "https://kagi.com/search?q="

const SEARCH_BOX = document.querySelector(".search input[name=\"query\"]");
const SEARCH_HIDDEN_ELEMENTS = document.getElementsByClassName("hide-no-search");
const EXECUTE_SEARCH_BUTTON = document.getElementById("execute-search-button");
const CLEAR_SEARCH_FIELD_BUTTON = document.getElementById("clear-search-text-button");
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

SEARCH_BOX.onkeyup = (e) => {
    if (e.key === "Enter") {
        execute_search(SEARCH_BOX.value);
    }
}

SEARCH_BOX.oninput = () => {
    if (SEARCH_BOX.value.length > 0) {
        for (let e of SEARCH_HIDDEN_ELEMENTS) {
            e.style.setProperty("display", "block");
        }
    } else {
        for (let e of SEARCH_HIDDEN_ELEMENTS) {
            e.style.setProperty("display", "none");
        }
    }
}

CLEAR_SEARCH_FIELD_BUTTON.onclick = () => {
    SEARCH_BOX.value = "";
    for (let e of SEARCH_HIDDEN_ELEMENTS) {
        e.style.setProperty("display", "none");
    }
}

EXECUTE_SEARCH_BUTTON.onclick = () => {
    execute_search(SEARCH_BOX.value);
}

ENABLE_LIGHT_MODE_BUTTON.onclick = () => {
    set_dark_mode("false");
}

ENABLE_DARK_MODE_BUTTON.onclick = () => {
    set_dark_mode("true");
}
