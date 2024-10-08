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
  };
  set(ssettings);
  popup("Your settings have been saved!", [
    { label: "Ok!", function: () => killAnim(currPopup) },
  ]);
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
  localStorage.setItem("settings", JSON.stringify(ssettings));
}

tooltips.forEach((tooltip) => {
  tooltip.onclick = () => {
    popup(tooltip.getAttribute("tip"));
  };
});
