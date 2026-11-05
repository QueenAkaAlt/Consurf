const SETTINGS_STORAGE = "settings";
const SETTINGS_SCHEMA_URL = "/js/settings.json";
let settings = {};
let defaultSettings = {};
let settingsSchema = [];
let settingsReady = loadSettings();
async function loadSettings() {
  try {
    const response = await fetch(SETTINGS_SCHEMA_URL);
    if (!response.ok)
      throw new Error(`Failed to load settings schema: ${response.status}`);
    settingsSchema = await response.json();
    defaultSettings = extractDefaults(settingsSchema);
    let savedSettings = {};
    try {
      savedSettings = JSON.parse(
        localStorage.getItem(SETTINGS_STORAGE) || "{}",
      );
    } catch {
      console.warn("Invalid saved settings. Using defaults.");
    }

    settings = {
      ...defaultSettings,
      ...validateSettings(savedSettings),
    };

    applySettings();
    return settings;
  } catch (error) {
    console.error("Could not initialize settings:", error);
    throw error;
  }
}

function extractDefaults(schema) {
  const defaults = {};
  function walk(items) {
    for (const item of items || []) {
      if (item.type === "subcategory") {
        walk(item.settings);
        continue;
      }

      if (!item.id) continue;
      defaults[item.id] = item.default;
    }
  }

  for (const category of schema) walk(category.settings);
  return defaults;
}

function validateSettings(saved) {
  const valid = {};
  for (const [id, value] of Object.entries(saved)) {
    if (!(id in defaultSettings)) continue;
    const definition = findSetting(id);
    if (!definition) continue;
    switch (definition.type) {
      case "boolean":
        if (typeof value === "boolean") valid[id] = value;
        break;

      case "color":
      case "string":
      case "textarea":
        if (typeof value === "string") valid[id] = value;
        break;

      case "number":
      case "slider":
        if (typeof value === "number" && Number.isFinite(value))
          valid[id] = value;
        break;

      case "dropdown":
        if (definition.options?.some((option) => option.value === value))
          valid[id] = value;
        break;
    }
  }

  return valid;
}

function findSetting(id) {
  function walk(items) {
    for (const item of items || []) {
      if (item.type === "subcategory") {
        const found = walk(item.settings);
        if (found) return found;
      }

      if (item.id === id) return item;
    }

    return null;
  }

  for (const category of settingsSchema) {
    const found = walk(category.settings);
    if (found) return found;
  }

  return null;
}

function saveSettings() {
  localStorage.setItem(SETTINGS_STORAGE, JSON.stringify(settings));
}

function getSetting(id) {
  return settings[id];
}

function setSetting(id, value) {
  if (!(id in defaultSettings)) {
    console.warn(`Unknown setting: ${id}`);
    return false;
  }

  const validated = validateSettings({
    [id]: value,
  });

  if (!(id in validated)) {
    console.warn(`Invalid value for setting "${id}":`, value);
    return false;
  }

  const oldValue = settings[id];
  settings[id] = validated[id];
  saveSettings();
  applySettings();
  window.dispatchEvent(
    new CustomEvent("settingsChanged", {
      detail: {
        id,
        value: settings[id],
        oldValue,
        settings,
      },
    }),
  );

  return true;
}

function resetSettings() {
  settings = structuredClone(defaultSettings);
  saveSettings();
  applySettings();
  window.dispatchEvent(
    new CustomEvent("settingsReset", {
      detail: { settings },
    }),
  );
}

function applySettings() {
  const root = document.documentElement;
  root.style.setProperty("--main", settings["main-color"] || "#8000FF");
  root.style.setProperty(
    "--background",
    settings["background-color"] || "#202020",
  );

  root.setAttribute("round", settings["rounded-corners"]);
}

function popup(content, buttons) {
  const popupBg = document.createElement("div");
  popupBg.classList.add("popup-bg");
  popupBg.style.opacity = 0;
  const popupElm = document.createElement("div");
  popupElm.classList.add("popup");
  popupElm.textContent = content;
  if (buttons) {
    const buttonsDiv = document.createElement("div");
    buttonsDiv.classList.add("btns");
    buttons.forEach((btn) => {
      const button = document.createElement("button");
      button.innerText = btn.label;
      button.onclick = btn.function;
      buttonsDiv.appendChild(button);
    });
    popupElm.appendChild(buttonsDiv);
  } else {
    popupBg.onclick = () => {
      killAnim(popupBg);
    };
  }
  popupBg.appendChild(popupElm);
  currPopup = popupBg;
  document.body.appendChild(popupBg);
  setTimeout(() => {
    popupBg.style.opacity = 1;
  }, 150);
}

function killAnim(elm) {
  elm.style.opacity = 0;
  setTimeout(() => {
    elm.remove();
  }, 150);
}

function getCookie(cname) {
  let name = cname + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == " ") c = c.substring(1);
    if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
  }
  return "";
}

document.addEventListener("DOMContentLoaded", () => {
  if (!settings.hidePopup) {
    if (!getCookie("confirmedAge") || getCookie("confirmedAge") !== "true") {
      popup("You must be 18 or older in order to use this site.", [
        {
          label: "I am 18 or older",
          function: () => {
            document.cookie = "confirmedAge=true; path=/;";
            killAnim(currPopup);
          },
        },
        {
          label: "I am under 18",
          function: () => {
            window.location.href =
              "https://en.wikipedia.org/wiki/Effects_of_pornography_on_young_people";
          },
        },
      ]);
    }
  }
});

function compressImage(imageUrl, maxWidth = 150) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      let ratio = Math.min(maxWidth / width, 1);
      width *= ratio;
      height *= ratio;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      const dataURL = canvas.toDataURL();
      resolve(dataURL);
    };

    img.onerror = reject;
    img.src = imageUrl;
  });
}

let lists = localStorage.getItem("lists");
if (lists == null) {
  lists = [
    {
      id: "loves",
      name: "Favorites",
      icon: {
        url: "/media/love.png",
        fill: false,
        showName: true,
      },
    },
    {
      id: "saves",
      name: "Saves",
      icon: {
        url: "/media/save.png",
        fill: false,
        showName: true,
      },
    },
  ];
  localStorage.setItem("lists", JSON.stringify(lists));
} else lists = JSON.parse(lists);

function idify(str) {
  const validChars = "abcdefghijklmnopqrstuvwxyz1234567890$-_.+!*'";
  return str
    .toLowerCase()
    .replace(/ /g, "-")
    .split("")
    .filter((char) => validChars.includes(char))
    .join("");
}

function panic() {
  document.documentElement.innerHTML = "Loading...";
  window.location.href = "https://google.com";
}

function notify(text, durr = 3500) {
  const div = document.createElement("div");
  div.classList.add("notif");
  div.textContent = text;
  document.body.appendChild(div);
  setTimeout(() => {
    div.classList.add("close");
    setTimeout(() => {
      div.remove();
    }, 1000);
  }, durr);
}

function setCookie(name, value) {
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 20);
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(
    value,
  )}; expires=${expires.toUTCString()}; path=/`;
}
