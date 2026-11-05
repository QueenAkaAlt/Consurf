lists.push({
  href: "/loadouts/create",
  name: "New Loadout",
  icon: {
    url: "/media/list-add.png",
    fill: false,
    showName: true,
  },
});

const handler = (e, id) => {
  const target = e.currentTarget || e.target;
  const after = getComputedStyle(target, ":after");

  if (after) {
    const atop = Number(after.getPropertyValue("top").slice(0, -2));
    const aheight = Number(after.getPropertyValue("height").slice(0, -2));
    const aleft = Number(after.getPropertyValue("left").slice(0, -2));
    const awidth = Number(after.getPropertyValue("width").slice(0, -2));
    const ex = e.layerX;
    const ey = e.layerY;
    if (ex > aleft && ex < aleft + awidth && ey > atop && ey < atop + aheight) {
      window.location.href = `/loadout/${id}/edit`;
    } else {
      window.location.href = `/loadout/${id}`;
    }
  }
};

const postHolder = document.getElementById("postHolder");
lists.forEach((list) => {
  const listElm = document.createElement("div");
  const listIcon = document.createElement("img");
  listIcon.src = list.icon.url;
  listElm.classList = list.icon.fill ? "fill nothing-more" : "nothing-more";
  listElm.appendChild(listIcon);
  if (list.icon.showName && !list.icon.fill) {
    const listText = document.createElement("span");
    listText.innerText = list.name;
    listElm.appendChild(listText);
  }
  if (!list.href && list.id != "saves" && list.id != "loves") {
    listElm.classList.add("list");
    listElm.addEventListener("click", (e) => {
      handler(e, list.id);
    });
  } else {
    listElm.onclick = () => {
      window.location.href = list.href || `/loadout/${list.id}`;
    };
  }
  postHolder.appendChild(listElm);
  document.body.appendChild(postHolder);
});
