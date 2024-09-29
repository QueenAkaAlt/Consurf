const type = window.location.pathname.split("/")[2];
if (type == "loves" || type == "saves") window.location.href = "/loadouts";
const list = lists.find((l) => l.id == type);
if (!list) window.location.href = "/loadouts";
const fill = document.getElementById("fill");
const pname = document.getElementById("pname");
const lname = document.getElementById("name");
const showName = document.getElementById("showName");
const preview = document.getElementById("preview");
const picon = document.getElementById("picon");
const licon = document.getElementById("icon");
fill.checked = list.icon.fill;
lname.value = list.name;
showName.checked = list.icon.showName;
picon.src = list.icon.url;
licon.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (file) {
    picon.src = URL.createObjectURL(file);
  }
});

setInterval(() => {
  pname.textContent = lname.value;
  if (fill.checked) preview.classList.add("fill");
  else preview.classList.remove("fill");
  if (showName.checked) preview.classList.remove("no-name");
  else preview.classList.add("no-name");
});

async function save() {
  const json = {
    id: type,
    name: lname.value,
    icon: {
      url: await compressImage(picon.src),
      fill: fill.checked,
      showName: showName.checked,
    },
  };
  if (!json.name || json.name == "")
    return popup(`ERROR: Loadout name is required`, [
      {
        label: "Ok",
        function: () => {
          killAnim(currPopup);
        },
      },
    ]);
  const list = lists.find((l) => l.id == json.id);
  const index = lists.indexOf(list);
  lists[index] = json;
  localStorage.setItem("lists", JSON.stringify(lists));
  window.location.href = "/loadouts";
}

function del() {
  popup("Are you sure you want to delete this loadout? It cannot be undone", [
    {
      label: "Confirm",
      function: () => {
        localStorage.removeItem(type);
        const list = lists.find((l) => l.id == type);
        const index = lists.indexOf(list);
        lists.splice(index, 1);
        localStorage.setItem("lists", JSON.stringify(lists));
        window.location.href = "/loadouts";
      },
    },
    {
      label: "Cancel",
      function: () => {
        killAnim(currPopup);
      },
    },
  ]);
}
