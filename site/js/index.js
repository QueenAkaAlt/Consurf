function rating(r) {
  const ratings = ["safe", "questionable", "explicit"];
  const short = ["E", "13+", "18+"];
  const colors = ["success", "warning", "error"];
  const rating = short[ratings.indexOf(r)];
  return { rating: rating, color: colors[ratings.indexOf(r)] };
}

let loadouts = {
  loves: [],
  saves: [],
};
lists.forEach((list) => {
  const id = list.id;
  const items = JSON.parse(localStorage.getItem(id));
  if (items) loadouts[id] = items;
});

const searchbar = document.getElementById("search");

document.addEventListener("DOMContentLoaded", () => {
  searchbar.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      let tags = e.target.value;
      if (!tags) return;
      tags = tags.replace(/ /g, "+");
      search(tags);
      if (document.getElementById("tagList"))
        document.getElementById("tagList").remove();
    }
  });

  document.getElementById("viewMode").src = `/media/${
    settings.liveView ? "image" : "lists"
  }.png`;
  let debounceTimeout;

  searchbar.addEventListener("input", (e) => {
    if (!settings.tagAutofill) return;

    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      tagSearch(e);
    }, 500);
  });

  if (searchbar !== document.activeElement) {
    if (document.getElementById("tagList")) {
      setTimeout(() => {
        if (searchbar !== document.activeElement)
          document.getElementById("tagList").remove();
      }, 100);
    }
  } else {
    if (!settings.tagAutofill) return;
    tagSearch();
  }
});

function search(tags) {
  if (!tags || tags == null) return;
  const sorting = document.getElementById("sorter");
  tags += `+${sorting.value}`;
  tags = tags.replace(/ /g, "+");
  if (!settings.hideSearch)
    window.history.pushState({}, "", `${window.location.origin}/posts/${tags}`);
  if (settings.blacklist.length) {
    settings.blacklist.forEach((tag) => {
      if (!tag || tag == "" || tag == null) return;
      tags += `+-${tag.trim()}`;
    });
  }
  if (settings.hide18) tags += "+-rating:explicit";
  if (settings.hide13) tags += "+-rating:questionable";
  if (settings.hideSafe) tags += "+-rating:safe";
  fetch("/api/search?q=" + tags)
    .then((res) => res.json())
    .then(async (posts) => {
      if (document.getElementById("postHolder"))
        document.getElementById("postHolder").remove();
      const postHolder = document.createElement("div");
      postHolder.classList.add("posts");
      postHolder.id = "postHolder";
      document.body.appendChild(postHolder);
      handlePosts(tags, posts);
    });
}

function imageExists(url) {
  return new Promise((resolve) => {
    if (url.endsWith(".gif")) resolve("gif");
    const videoFormats = [
      ".mp4",
      ".avi",
      ".mov",
      ".wmv",
      ".flv",
      ".mkv",
      ".webm",
      ".ogv",
      ".mpeg",
      ".m4v",
      ".qt",
      ".divx",
      ".asf",
      ".rmvb",
      ".vp9",
      ".vp8",
      ".ogg",
    ];
    videoFormats.forEach((f) => {
      if (url.endsWith(f)) resolve("video");
    });
    resolve("image");
  });
}

function loadPage(tags, index = 1) {
  if (!tags || tags == null) return;
  fetch(`/api/search?t=posts&q=${tags}&p=${index}`)
    .then((res) => res.json())
    .then(async (posts) => {
      handlePosts(tags, posts, index);
    });
}

if (
  window.location.pathname.includes("posts") &&
  window.location.pathname.split("/").length == 3
) {
  const searchBar = document.getElementById("search");
  const parts = window.location.pathname.split("/");
  const lastPart = parts[parts.length - 1];
  const replacedText = lastPart.replace(/\+/g, " ");
  searchBar.value = replacedText;
  search(replacedText);
}

let lastValue = "";
function tagSearch() {
  let searchValue = searchbar.value;
  searchValue = searchValue.trim();
  if (searchValue == lastValue) return;
  lastValue = searchValue;
  if (!searchValue || searchValue == null || searchValue == "") {
    if (document.getElementById("tagList")) {
      document.getElementById("tagList").remove();
      return;
    }
  }
  const tagToSearch = searchValue.split(" ")[searchValue.split(" ").length - 1];
  fetch(`/api/search?t=tags&q=${tagToSearch}`)
    .then((res) => res.json())
    .then((tags) => {
      if (document.getElementById("tagList"))
        document.getElementById("tagList").remove();
      const tagList = document.createElement("div");
      tagList.classList.add("tag-list");
      tagList.id = "tagList";

      function highlightTag(text, tag) {
        const escapedTag = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // fucking cancer
        const regex = new RegExp(`(${escapedTag})`, "gi");
        return text.replace(regex, '<span class="highlight">$1</span>');
      }

      tags.forEach((tag) => {
        const tagItem = document.createElement("div");
        tagItem.classList.add("tag-item");
        tagItem.innerHTML = highlightTag(tag.label, tagToSearch);
        tagItem.onclick = () => {
          searchbar.focus();
          lastValue = "";
          let searchArray = searchValue.split(" ");
          searchArray.pop();
          searchArray.push(tag.value);
          searchbar.value = searchArray.join(" ");
          tagList.remove();
        };

        tagList.appendChild(tagItem);
      });
      searchbar.parentNode.appendChild(tagList);
    });
}

async function handlePosts(tags, posts, page = 0) {
  const postLength = posts.length;
  let postsDone = 0;
  if (posts == "" || postLength == 0) {
    const nothingMore = document.createElement("div");
    nothingMore.classList.add("nothing-more");
    if (settings.liveView) nothingMore.classList.add("live");
    const nothingIcon = document.createElement("img");
    nothingIcon.src = "/media/empty.png";
    const nothingText = document.createElement("span");
    nothingText.textContent = "Nothing Here";
    nothingMore.appendChild(nothingIcon);
    nothingMore.appendChild(nothingText);
    postHolder.appendChild(nothingMore);
    return;
  }

  if (settings.liveView) {
    posts.forEach(async (post, i) => {
      const type = await imageExists(post.file_url);
      const r = rating(post.rating);
      const postItem = document.createElement("a");
      postItem.classList.add("post-live");
      postItem.href = `/post/${post.id}`;
      let postMedia;
      if (type != "video") {
        postMedia = document.createElement("img");
        postMedia.src = post.file_url;
      } else {
        postMedia = document.createElement("video");
        postMedia.src = post.file_url;
        postMedia.controls = true;
        postMedia.loop = true;
        postMedia.autoplay = false;
        postMedia.volume = getCookie("setVolume");
        postMedia.onvolumechange = () => {
          const volume = postMedia.volume;
          setCookie("setVolume", volume);
        };
      }
      postMedia.classList.add("media");
      const postRating = document.createElement("span");
      postRating.textContent = r.rating;
      postRating.style.color = `var(--${r.color})`;
      const postType = document.createElement("img");
      postType.src = `/media/${await imageExists(post.file_url)}.png`;
      const postInfo = document.createElement("div");
      postInfo.classList.add("post-info");
      postInfo.appendChild(postRating);
      postInfo.appendChild(postType);
      postItem.appendChild(postMedia);
      postItem.appendChild(postInfo);
      if (settings.unblurHover) {
        postInfo.classList.add("unblur");
      }
      if (!settings.showInfo) {
        postRating.remove();
        postType.remove();
        if (
          (r.rating == "18+" && !settings.blur18) ||
          (r.rating == "13+" && !settings.blur13) ||
          (r.rating == "safe" && !settings.blurSafe)
        ) {
          postInfo.remove();
        }
      }
      if (
        (r.rating == "18+" && settings.blur18) ||
        (r.rating == "13+" && settings.blur13) ||
        (r.rating == "safe" && settings.blurSafe)
      ) {
        postInfo.classList.add("full-blur");
      }
      post.type = type;
      rclickMenu(postItem, post);
      postHolder.appendChild(postItem);
      postsDone++;
    });
  } else {
    posts.forEach(async (post, i) => {
      const type = await imageExists(post.file_url);
      const r = rating(post.rating);
      const postItem = document.createElement("a");
      postItem.classList.add("post");
      postItem.href = `/post/${post.id}`;
      const postImg = document.createElement("img");
      postImg.classList.add("img");
      postImg.src = post.preview_url;
      const postInfo = document.createElement("div");
      postInfo.classList.add("post-info");
      if (settings.unblurHover) {
        postInfo.classList.add("unblur");
      }
      const postRating = document.createElement("span");
      postRating.textContent = r.rating;
      postRating.style.color = `var(--${r.color})`;
      const postType = document.createElement("img");
      postType.src = `/media/${await imageExists(post.file_url)}.png`;
      postInfo.appendChild(postRating);
      postInfo.appendChild(postType);
      postItem.appendChild(postImg);
      postItem.appendChild(postInfo);
      if (!settings.showInfo) {
        postRating.remove();
        postType.remove();
        if (
          (r.rating == "18+" && !settings.blur18) ||
          (r.rating == "13+" && !settings.blur13) ||
          (r.rating == "safe" && !settings.blurSafe)
        ) {
          postInfo.remove();
        }
      }
      if (
        (r.rating == "18+" && settings.blur18) ||
        (r.rating == "13+" && settings.blur13) ||
        (r.rating == "safe" && settings.blurSafe)
      ) {
        postInfo.classList.add("full-blur");
      }
      post.type = type;
      rclickMenu(postItem, post);
      postHolder.appendChild(postItem);
      postsDone++;
    });
  }
  if (postLength < 100) {
    const nothingMore = document.createElement("div");
    nothingMore.classList.add("nothing-more");
    if (settings.liveView) nothingMore.classList.add("live");
    const nothingIcon = document.createElement("img");
    nothingIcon.src = "/media/nothing.png";
    const nothingText = document.createElement("span");
    nothingText.textContent = "Nothing More";
    nothingMore.appendChild(nothingIcon);
    nothingMore.appendChild(nothingText);
    while (postsDone < postLength)
      await new Promise((resolve) => setTimeout(resolve, 100));
    postHolder.appendChild(nothingMore);
  } else {
    const loadMore = document.createElement("a");
    loadMore.classList.add("load-more");
    if (settings.liveView) loadMore.classList.add("live");
    const newPage = page + 1;
    loadMore.href = `#page-${newPage + 1}`;
    loadMore.onclick = () => {
      loadMore.remove();
      loadPage(tags, newPage);
    };
    const loadIcon = document.createElement("img");
    loadIcon.src = "/media/load.png";
    const loadText = document.createElement("span");
    loadText.textContent = "Load More";
    loadMore.appendChild(loadIcon);
    loadMore.appendChild(loadText);
    while (postsDone < postLength)
      await new Promise((resolve) => setTimeout(resolve, 100));
    postHolder.appendChild(loadMore);
  }
}

// TODO: Finish right click menu, using the loadouts var

function rclickMenu(elm, post) {
  elm.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    document.querySelectorAll(".rclick").forEach((menu) => menu.remove());
    const rclick = document.createElement("div");
    rclick.classList.add("rclick");
    rclick.style.top = `${e.clientY}px`;
    rclick.style.left = `${e.clientX}px`;
    const likePost = document.createElement("div");
    const savePost = document.createElement("div");
    const addPost = document.createElement("div");
    const sharePost = document.createElement("div");
    const downloadPost = document.createElement("div");
    likePost.id = "loves";
    savePost.id = "saves";
    likePost.style = "--img: url(/media/love.png)";
    savePost.style = "--img: url(/media/save.png)";
    addPost.style = "--img: url(/media/list-add.png)";
    sharePost.style = "--img: url(/media/share.png)";
    downloadPost.style = "--img: url(/media/download.png)";
    likePost.textContent = "Love";
    savePost.textContent = "Save";
    addPost.textContent = "Loadouts";
    sharePost.textContent = "Share";
    downloadPost.textContent = "Download";
    if (loadoutHas("loves", post.id)) likePost.classList.add("active");
    if (loadoutHas("saves", post.id)) savePost.classList.add("active");
    likePost.onclick = () => addToList("loves", post);
    savePost.onclick = () => addToList("saves", post);
    addPost.onclick = () => openListsList(post);
    sharePost.onclick = () => gSharePost(post.id);
    downloadPost.onclick = () => gDownloadPost(post);
    rclick.appendChild(likePost);
    rclick.appendChild(savePost);
    rclick.appendChild(addPost);
    rclick.appendChild(sharePost);
    rclick.appendChild(downloadPost);
    postHolder.appendChild(rclick);
    const handleOutsideClick = (ev) => {
      if (!rclick.contains(ev.target)) {
        ev.preventDefault();
        rclick.remove();
        document.removeEventListener("click", handleOutsideClick, true);
      }
    };

    document.addEventListener("click", handleOutsideClick, true);
  });
}

function loadoutHas(loadout, id) {
  return loadouts[loadout]?.find((p) => p.id == id);
}

function addToList(list, post) {
  if (loadoutHas(list, post.id)) {
    loadouts[list].splice(
      loadouts[list].indexOf(loadouts[list].find((p) => p.id == post.id)),
      1
    );
    localStorage.setItem(list, JSON.stringify(loadouts[list]));
    document.getElementById(list)?.classList.remove("active");
  } else {
    loadouts[list].push({
      id: post.id,
      preview: post.preview_url,
      full: post.file_url,
      rating: post.rating,
    });
    localStorage.setItem(list, JSON.stringify(loadouts[list]));
    document.getElementById(list)?.classList.add("active");
  }
}

function openListsList(post) {
  document.querySelectorAll(".rclick").forEach((menu) => menu.remove());
  const popupBg = document.createElement("div");
  popupBg.classList.add("popup-bg");
  popupBg.style.opacity = 0;
  const popupElm = document.createElement("div");
  popupElm.classList.add("popup");
  popupElm.textContent = "Add this post to a loadout!";
  const listsElm = document.createElement("div");
  listsElm.classList.add("list");
  lists.forEach((list) => {
    const listElm = document.createElement("div");
    listElm.classList.add("row");
    const add = document.createElement("div");
    add.classList.add("img");
    const posts = JSON.parse(localStorage.getItem(list.id));
    if (posts) {
      const match = posts.find((p) => p.id == post.id);
      if (match) {
        add.style = "--img: url(/media/list-added.png)";
        add.classList.add("active");
      } else add.style = "--img: url(/media/list-add.png)";
    } else add.style = "--img: url(/media/list-add.png)";
    add.classList.add("add");
    add.id = `addto:${list.id}`;
    listElm.onclick = () => {
      addToList(list.id, post);
      if (loadoutHas(list.id, post.id)) {
        add.style = "--img: url(/media/list-added.png)";
        add.classList.add("active");
      } else {
        add.style = "--img: url(/media/list-add.png)";
        add.classList.remove("active");
      }
    };
    const icon = document.createElement("img");
    icon.src = list.icon.url;
    icon.classList.add("icon");
    const name = document.createElement("span");
    name.textContent = list.name;
    listElm.appendChild(icon);
    listElm.appendChild(name);
    listElm.appendChild(add);
    listsElm.appendChild(listElm);
  });
  const close = document.createElement("span");
  close.classList.add("close");
  close.textContent = "×";
  close.onclick = () => {
    killAnim(currPopup);
  };
  popupElm.appendChild(close);
  popupElm.appendChild(listsElm);
  popupBg.appendChild(popupElm);
  currPopup = popupBg;
  document.body.appendChild(popupBg);
  setTimeout(() => {
    popupBg.style.opacity = 1;
  }, 150);
}

function gSharePost(id) {
  navigator.clipboard
    .writeText(`${window.location.host}/post/${id}`)
    .then(() => {
      notify("Copied post URL to Clipboard!");
    })
    .catch((e) => {
      console.error(e);
      notify("Failed to copy post URL.");
    });
}
function gDownloadPost(post) {
  const { type, id } = post;
  fetch(`/api/download/${id}`).then(async (res) => {
    if (res.status == 500) {
      notify("Something went wrong while downloading the post");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    if (type) a.download = `${id}.png`;
    else a.download = `${id}.mp4`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

function switchView() {
  settings.liveView = !settings.liveView;
  localStorage.setItem("settings", JSON.stringify(settings));
  window.location.reload();
}
