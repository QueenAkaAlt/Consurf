let settings;
let currPopup;
if (localStorage.getItem("settings")) {
  settings = JSON.parse(localStorage.getItem("settings"));
} else {
  settings = {
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
  };
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
    popupBg.onclick(killAnim(popupBg));
  }
  popupBg.appendChild(popupElm);
  currPopup = popupBg;
  document.body.appendChild(popupBg);
  setTimeout((popupBg.style.opacity = 1), 150);
}

function killAnim(elm) {
  elm.style.opacity = 0;
  setTimeout(elm.remove(), 150);
}
