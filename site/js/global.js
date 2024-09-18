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
    while (c.charAt(0) == " ") {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

if (!getCookie("confirmedAge") || getCookie("confirmedAge" !== "true")) {
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
