// ---------------- SELECTORS ----------------
const body = document.querySelector("body");
const dropdowns = document.querySelectorAll(".dropdown select");
const btn = document.querySelector("form button");
const fromCurr = document.querySelector(".from select");
const toCurr = document.querySelector(".to select");
const modebox = document.querySelector(".mode");
const modeIcon = document.querySelector(".mode i");
const modeText = document.querySelector(".mode p");

const msgText = document.querySelector(".text");
const amountInput = document.querySelector(".amount input");
const swapBtn = document.querySelector(".swap");
const loader = document.querySelector(".loader");

// ---------------- STATE ----------------
let isUserChanged = false;

// ---------------- CACHE ----------------
const rateCache = {};

// ---------------- DARK MODE ----------------
function setModeUI() {
    const isDark = body.classList.contains("dark");

    if (isDark) {
        modeIcon.classList.replace("fa-moon", "fa-sun");
        modeText.innerText = "Light";
    } else {
        modeIcon.classList.replace("fa-sun", "fa-moon");
        modeText.innerText = "Dark";
    }
}

setModeUI();

modebox.addEventListener("click", () => {
    body.classList.toggle("dark");
    setModeUI();
});

// ---------------- POPULATE DROPDOWNS ----------------
for (let select of dropdowns) {
    for (let currCode in countryList) {
        let option = document.createElement("option");
        option.value = currCode.toLowerCase();
        option.innerText = currCode;

        if (select.name === "from" && currCode === "USD") option.selected = true;
        if (select.name === "to" && currCode === "INR") option.selected = true;

        select.append(option);
    }

    select.addEventListener("change", (e) => {
        updateFlag(e.target);
        markUserChanged();
    });
}

// ---------------- FLAG ----------------
function updateFlag(element) {
    let countryCode = countryList[element.value.toUpperCase()];
    let img = element.parentElement.querySelector("img");
    if (img) {
        img.src = `https://flagsapi.com/${countryCode}/flat/64.png`;
    }
}

// ---------------- LOADER ----------------
function showLoader() {
    loader.classList.remove("hidden");
}
function hideLoader() {
    loader.classList.add("hidden");
}

// ---------------- VALIDATION ----------------
function isValidAmount(val) {
    return val && val > 0;
}

// ---------------- USER CHANGE TRACK ----------------
function markUserChanged() {
    isUserChanged = true;
    msgText.innerText = "👇 Tap 'Get Exchange Rate' to update";
}

// ---------------- CONVERT ----------------
async function convert() {

    let amount = Number(amountInput.value);
    let from = fromCurr.value;
    let to = toCurr.value;

    if (!isValidAmount(amount)) {
        msgText.innerText = "Enter a valid amount";
        return;
    }

    if (from === to) {
        msgText.innerText = `${amount} ${from.toUpperCase()} = ${amount} ${to.toUpperCase()}`;
        return;
    }

    msgText.innerText = "";
    showLoader();

    try {
        let cacheKey = `${from}_${to}`;
        let rate;

        if (rateCache[cacheKey]) {
            rate = rateCache[cacheKey];
        } else {
            let res = await fetch(
                `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${from}.json`
            );

            let data = await res.json();
            rate = data[from][to];

            rateCache[cacheKey] = rate;
        }

        let finalAmount = (amount * rate).toFixed(2);

        msgText.innerText =
            `${amount} ${from.toUpperCase()} = ${finalAmount} ${to.toUpperCase()}`;

        // Reset state after successful conversion
        isUserChanged = false;

    } catch {
        msgText.innerText = "⚠️ Network error. Try again.";
    }

    hideLoader();
}

// ---------------- INPUT EVENTS ----------------

// FIXED: no repeated listeners
amountInput.addEventListener("focus", () => {
    if (amountInput.value === "1") {
        amountInput.value = "";
    }
});

// prevent invalid typing
amountInput.addEventListener("keydown", (e) => {
    if (e.key === "-" || e.key === "e") {
        e.preventDefault();
    }
});

// 👇 IMPORTANT: NO AUTO CONVERT
amountInput.addEventListener("input", markUserChanged);

// ---------------- AUTOCOMPLETE ----------------
function createAutocomplete(select) {
    const wrapper = select.parentElement;
    select.style.display = "none";

    const input = document.createElement("input");
    input.classList.add("search-input");

    const list = document.createElement("div");
    list.classList.add("suggestion-box");

    wrapper.appendChild(input);
    wrapper.appendChild(list);

    function syncInput() {
        input.value = select.options[select.selectedIndex].innerText;
    }

    syncInput();

    input.addEventListener("focus", () => {
        renderList("");
        list.style.display = "block";
    });

    input.addEventListener("input", () => {
        const value = input.value.toUpperCase();

        renderList(value.toLowerCase());
        list.style.display = "block";

        if (countryList[value]) {
            const img = wrapper.querySelector("img");
            if (img) {
                img.src = `https://flagsapi.com/${countryList[value]}/flat/64.png`;
            }

            select.value = value.toLowerCase();
            select.dispatchEvent(new Event("change"));
        }
    });

    function renderList(filter) {
        list.innerHTML = "";

        for (let option of select.options) {
            if (!option.value.toLowerCase().includes(filter.toLowerCase())) continue;

            let item = document.createElement("div");
            item.classList.add("suggestion-item");

            const countryCode = countryList[option.value.toUpperCase()];

            item.innerHTML = `
                <img src="https://flagsapi.com/${countryCode}/flat/32.png">
                <span>${option.innerText}</span>
            `;

            item.addEventListener("click", () => {
                select.value = option.value;
                syncInput();

                updateFlag(select);
                select.dispatchEvent(new Event("change"));

                list.style.display = "none";
            });

            list.appendChild(item);
        }
    }

    document.addEventListener("click", (e) => {
        if (!wrapper.contains(e.target)) {
            list.style.display = "none";
        }
    });

    return { syncInput };
}

// Apply autocomplete
const fromAuto = createAutocomplete(fromCurr);
const toAuto = createAutocomplete(toCurr);

// ---------------- EVENTS ----------------
btn.addEventListener("click", (e) => {
    e.preventDefault();
    convert();
});

fromCurr.addEventListener("change", () => {
    fromAuto.syncInput();
});

toCurr.addEventListener("change", () => {
    toAuto.syncInput();
});

// SWAP
swapBtn.addEventListener("click", () => {
    let temp = fromCurr.value;
    fromCurr.value = toCurr.value;
    toCurr.value = temp;

    fromAuto.syncInput();
    toAuto.syncInput();

    updateFlag(fromCurr);
    updateFlag(toCurr);

    markUserChanged();
});

// ---------------- INITIAL LOAD ----------------
window.addEventListener("DOMContentLoaded", () => {
    amountInput.value = "1";
    fromCurr.value = "usd";
    toCurr.value = "inr";

    fromAuto.syncInput();
    toAuto.syncInput();

    updateFlag(fromCurr);
    updateFlag(toCurr);

    // ONLY initial auto convert
    convert();
});
// ---------- RIPPLE EFFECT ----------
document.querySelectorAll("button, .swap, .select-container").forEach(el => {
    el.classList.add("ripple");

    el.addEventListener("click", function (e) {
        const circle = document.createElement("span");

        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);

        circle.style.width = circle.style.height = size + "px";
        circle.style.left = e.clientX - rect.left - size / 2 + "px";
        circle.style.top = e.clientY - rect.top - size / 2 + "px";

        this.appendChild(circle);

        setTimeout(() => circle.remove(), 600);
    });
});
