const fill = document.getElementById("fill");
const pname = document.getElementById("pname");
const lname = document.getElementById("name");
const showName = document.getElementById("showName");
const preview = document.getElementById("preview");
const picon = document.getElementById("picon");
const licon = document.getElementById("icon");
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

async function create() {
  const json = {
    id: idify(lname.value),
    name: lname.value,
    icon: {
      url: await compressImage(picon.src),
      fill: fill.checked,
      showName: showName.checked,
    },
  };
  if (!json.name || json.name == "" || json.id == "")
    return popup(`ERROR: Loadout name is required`, [
      {
        label: "Ok",
        function: () => {
          killAnim(currPopup);
        },
      },
    ]);
  if (json.id == "settings" || json.id == "lists")
    return popup(`ERROR: The name "${json.name}" is resevered`, [
      {
        label: "Ok",
        function: () => {
          killAnim(currPopup);
        },
      },
    ]);
  const list = lists.find((l) => l.id == json.id);
  if (list)
    return popup(`ERROR: List with the name "${json.name}" already exists`, [
      {
        label: "Ok",
        function: () => {
          killAnim(currPopup);
        },
      },
    ]);
  lists.push(json);
  localStorage.setItem("lists", JSON.stringify(lists));
  localStorage.setItem(json.id, "[]");
  window.location.replace("/loadouts");
}
