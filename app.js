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

    select.addEventListener("change", (e) => updateFlag(e.target));
}

// ---------------- FLAG ----------------
function updateFlag(element) {
    let countryCode = countryList[element.value.toUpperCase()];
    let img = element.parentElement.querySelector("img");
    if (img) {
        img.src = `https://flagsapi.com/${countryCode}/flat/64.png`;
    }
}

// ---------------- CONVERT ----------------
async function convert() {
    let amount = Number(amountInput.value);
amountInput.addEventListener("focus", () => {
    if (amountInput.value === "1") {
        amountInput.value = "";
    }
});

    let from = fromCurr.value;
    let to = toCurr.value;

    if (from === to) {
        msgText.innerText = `${amount} ${from.toUpperCase()} = ${amount} ${to.toUpperCase()}`;
        return;
    }

    msgText.innerText = "Loading live rate...";

    try {
        let res = await fetch(
            `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${from}.json`
        );

        let data = await res.json();
        let rate = data[from][to];

        let finalAmount = (amount * rate).toFixed(2);

        msgText.innerText =
            `${amount} ${from.toUpperCase()} = ${finalAmount} ${to.toUpperCase()}`;

    } catch {
        msgText.innerText = "Network error!";
    }
}
amountInput.addEventListener("keydown", (e) => {
    if (e.key === "-" || e.key === "e") {
        e.preventDefault();
    }
});

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

    // 🔥 SHOW LIST ON CLICK
    input.addEventListener("focus", () => {
        renderList("");
        list.style.display = "block";
    });

    // 🔥 INPUT HANDLER (FIXED)
    input.addEventListener("input", () => {
        const value = input.value.toUpperCase();

        renderList(value.toLowerCase());
        list.style.display = "block";

        // 🔥 LIVE FLAG UPDATE
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
    convert();
});

toCurr.addEventListener("change", () => {
    toAuto.syncInput();
    convert();
});

amountInput.addEventListener("input", convert);

swapBtn.addEventListener("click", () => {
    let temp = fromCurr.value;
    fromCurr.value = toCurr.value;
    toCurr.value = temp;

    fromAuto.syncInput();
    toAuto.syncInput();

    updateFlag(fromCurr);
    updateFlag(toCurr);

    convert();
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

    msgText.innerText = "Loading live rate...";
    convert();
});