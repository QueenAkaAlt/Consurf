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
    return notify("ERROR: Loadout name is required");
  if (json.id == "settings" || json.id == "lists")
    return notify(`ERROR: The name "${json.name}" is resevered`);
  const list = lists.find((l) => l.id == json.id);
  if (list)
    return notify(`ERROR: List with the ID "${json.id}" already exists`);
  lists.push(json);
  localStorage.setItem("lists", JSON.stringify(lists));
  localStorage.setItem(json.id, "[]");
  window.location.replace("/loadouts");
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
        const json = JSON.parse(e.target.result);
        if (!json.name || json.name == "" || json.id == "")
          return notify("ERROR: Loadout name is required");
        if (json.id == "settings" || json.id == "lists")
          return notify(`ERROR: The name "${json.name}" is resevered`);
        const list = lists.find((l) => l.id == json.id);
        if (list)
          return notify(`ERROR: List with the ID "${json.id}" already exists`);
        const items = json.items;
        delete json.items;
        lists.push(json);
        localStorage.setItem("lists", JSON.stringify(lists));
        localStorage.setItem(json.id, JSON.parse(items));
        console.log(items);
        window.location.href = `/loadout/${json.id}`;
      } catch (err) {
        notify("Invalid loadout file.");
      }
    };
    reader.readAsText(file);
  };

  input.click();
}
