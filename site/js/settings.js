let sets = localStorage.getItem("settings");
const tooltips = document.querySelectorAll(".tooltip");
if (sets) set(JSON.parse(sets));
else reset(false);
function save() {
  const ssettings = {
    blur18: document.getElementById("blur18").checked,
    hide18: document.getElementById("hide18").checked,
    blur13: document.getElementById("blur13").checked,
    hide13: document.getElementById("hide13").checked,
    blurSafe: document.getElementById("blurSafe").checked,
    hideSafe: document.getElementById("hideSafe").checked,
    blacklist: document.getElementById("blacklist").value.split(","),
    tagAutofill: document.getElementById("tagAutofill").checked,
    unblurHover: document.getElementById("unblurHover").checked,
    showInfo: document.getElementById("showInfo").checked,
    showTags: document.getElementById("showTags").checked,
    showComments: document.getElementById("showTags").checked,
    clickZoom: document.getElementById("showTags").checked,
    hideSearch: document.getElementById("hideSearch").checked,
    liveView: document.getElementById("liveView").checked,
    round: document.getElementById("round").checked,
    mainColor: document.getElementById("mainColor").value,
    backgroundColor: document.getElementById("backgroundColor").value,
    hidePopup: document.getElementById("hidePopup").checked,
  };
  set(ssettings);
}

function reset(a = true) {
  if (a) {
    popup("Are you sure you want to reset your settings?", [
      {
        label: "Yup!",
        function: () => {
          reset(false);
          killAnim(currPopup);
        },
      },
      {
        label: "Nah",
        function: () => killAnim(currPopup),
      },
    ]);
  } else {
    const ssettings = {
      blur18: true,
      hide18: false,
      blur13: true,
      hide13: false,
      blurSafe: false,
      hideSafe: false,
      blacklist: [],
      tagAutofill: true,
      unblurHover: true,
      showInfo: true,
      showTags: true,
      showComments: true,
      clickZoom: true,
      hideSearch: false,
      liveView: false,
      round: true,
      mainColor: "#8000ff",
      backgroundColor: "#202020",
      hidePopup: false,
    };
    set(ssettings);
  }
}

function set(ssettings) {
  document.getElementById("blur18").checked = ssettings.blur18;
  document.getElementById("hide18").checked = ssettings.hide18;
  document.getElementById("blur13").checked = ssettings.blur13;
  document.getElementById("hide13").checked = ssettings.hide13;
  document.getElementById("blurSafe").checked = ssettings.blurSafe;
  document.getElementById("hideSafe").checked = ssettings.hideSafe;
  document.getElementById("blacklist").value = ssettings.blacklist.join(",");
  document.getElementById("tagAutofill").checked = ssettings.tagAutofill;
  document.getElementById("unblurHover").checked = ssettings.unblurHover;
  document.getElementById("showInfo").checked = ssettings.showInfo;
  document.getElementById("showTags").checked = ssettings.showTags;
  document.getElementById("showComments").checked = ssettings.showComments;
  document.getElementById("clickZoom").checked = ssettings.clickZoom;
  document.getElementById("hideSearch").checked = ssettings.hideSearch;
  document.getElementById("liveView").checked = ssettings.liveView;
  document.getElementById("round").checked = ssettings.round;
  document.getElementById("mainColor").value = ssettings.mainColor;
  document.getElementById("backgroundColor").value = ssettings.backgroundColor;
  document.getElementById("hidePopup").value = ssettings.hidePopup;
  localStorage.setItem("settings", JSON.stringify(ssettings));
}

tooltips.forEach((tooltip) => {
  tooltip.onclick = () => {
    popup(tooltip.getAttribute("tip"));
  };
});

function dropdown(elm) {
  const id = elm.id;
  const content = document.getElementById(`${id}Content`);
  if (elm.classList.contains("active")) {
    elm.classList.remove("active");
    content.style.height = "0px";
  } else {
    elm.classList.add("active");
    content.style.height = "80px";
  }
}

function theme() {
  const rawValue = document.getElementById("presets").value;
  const validJSON = rawValue.replace(/'/g, '"');
  const themeArray = JSON.parse(validJSON);
  root.style.setProperty("--main", themeArray[0]);
  root.style.setProperty("--background", themeArray[1]);
  document.getElementById("mainColor").value = themeArray[0];
  document.getElementById("backgroundColor").value = themeArray[1];
}

function changeColor(type, color) {
  root.style.setProperty(`--${type}`, color);
  document.getElementById(`${type}Color`).value = color;
}

let round = settings.round;
function roundBorder() {
  round = !round;
  root.setAttribute("round", round);
}

function autoSaveSetup() {
  const elements = [
    "blur18",
    "hide18",
    "blur13",
    "hide13",
    "blurSafe",
    "hideSafe",
    "blacklist",
    "tagAutofill",
    "unblurHover",
    "showInfo",
    "showTags",
    "showComments",
    "clickZoom",
    "hideSearch",
    "liveView",
    "round",
    "mainColor",
    "backgroundColor",
    "hidePopup",
    "presets",
  ];

  elements.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const eventType =
      el.tagName === "INPUT" && el.type === "text" ? "input" : "change";
    el.addEventListener(eventType, () => {
      if (id === "presets") {
        theme();
      }
      save();
    });
  });
}

autoSaveSetup();

function exp() {
  const dataStr = localStorage.getItem("settings");
  if (!dataStr) return popup("No settings to export.");
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "settings.json";
  a.click();
  URL.revokeObjectURL(url);
}

function imp() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json";
  input.onchange = () => {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedSettings = JSON.parse(e.target.result);
        set(importedSettings);
        notify("Settings imported successfully!");
      } catch (err) {
        notify("Invalid settings file.");
      }
    };
    reader.readAsText(file);
  };

  input.click();
}
