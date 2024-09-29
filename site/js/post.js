const postId = window.location.pathname.split("/")[2];
let loves = localStorage.getItem("loves");
if (!loves) loves = [];
else loves = JSON.parse(loves);
let saves = localStorage.getItem("saves");
if (!saves) saves = [];
else saves = JSON.parse(saves);
let postData;
fetch(`/api/search?id=${postId}`)
  .then((res) => res.json())
  .then(async (post) => {
    if (post.error) return window.history.back();
    const type = await imageExists(post.file_url);
    postData = post;
    postData.type = type;
    const postHolder = document.createElement("div");
    postHolder.classList.add("post-full");
    postHolder.id = "postHolder";
    const postItem = document.createElement("div");
    postItem.classList.add("item");
    let postMedia;
    if (type == true) {
      postMedia = document.createElement("img");
      postMedia.src = post.file_url;
      postMedia.onclick = () => {
        postMedia.requestFullscreen();
      };
    } else {
      postMedia = document.createElement("video");
      postMedia.src = post.file_url;
      postMedia.controls = true;
      postMedia.loop = true;
      postMedia.autoplay = true;
    }
    const postButtons = document.createElement("div");
    postButtons.classList.add("post-buttons");
    const actionButtons = document.createElement("div");
    const postLove = document.createElement("img");
    postLove.src = "/media/love.png";
    postLove.onclick = lovePost;
    postLove.id = "love";
    const postSave = document.createElement("img");
    postSave.src = "/media/save.png";
    postSave.onclick = savePost;
    postSave.id = "save";
    const postList = document.createElement("img");
    postList.src = "/media/list-add.png";
    postList.onclick = listPost;
    postList.id = "list";
    const postDownload = document.createElement("img");
    postDownload.src = "/media/download.png";
    postDownload.onclick = () => {
      downloadPost(type);
    };
    const tagsHolder = document.createElement("details");
    tagsHolder.classList.add("post-tags");
    const tagSummary = document.createElement("summary");
    const tagList = document.createElement("span");
    tagSummary.innerText = "Tags";
    post.tags.split(" ").forEach((tag) => {
      const tagItem = document.createElement("a");
      tagItem.innerText = tag;
      tagItem.href = `/posts/${tag}`;
      tagList.appendChild(tagItem);
    });

    let commentHolder;
    if (post.comment_count != 0 && settings.showComments && post.comments) {
      commentHolder = document.createElement("details");
      commentHolder.classList.add("post-comments");
      const commentSummary = document.createElement("summary");
      commentSummary.innerText = "Comments";
      commentHolder.appendChild(commentSummary);
      const commentList = document.createElement("div");
      post.comments.forEach((comment) => {
        const commentDiv = document.createElement("div");
        commentDiv.classList = "comment";
        const commentUser = document.createElement("div");
        commentUser.classList = "user";
        commentUser.innerText = comment.creator;
        const commentBody = document.createElement("div");
        commentBody.innerText = comment.body;
        commentDiv.appendChild(commentUser);
        commentDiv.appendChild(commentBody);
        commentList.appendChild(commentDiv);
        commentHolder.appendChild(commentList);
      });
    }

    tagsHolder.appendChild(tagSummary);
    tagsHolder.appendChild(tagList);
    actionButtons.appendChild(postLove);
    actionButtons.appendChild(postSave);
    actionButtons.appendChild(postList);
    postButtons.appendChild(actionButtons);
    postButtons.appendChild(postDownload);
    postItem.appendChild(postMedia);
    postItem.appendChild(postButtons);
    postHolder.appendChild(postItem);
    if (post.tags.length > 0 && settings.showTags)
      postHolder.appendChild(tagsHolder);
    if (post.comment_count != 0 && settings.showComments && post.comments) {
      postHolder.appendChild(commentHolder);
    }
    document.body.appendChild(postHolder);
    if (loves.find((p) => p.id == postId))
      document.getElementById("love").src = "/media/love-active.png";
    if (saves.find((p) => p.id == postId))
      document.getElementById("save").src = "/media/save-active.png";
    postHolder.style.width = postMedia.offsetWidth + "px";
    setInterval(() => {
      postHolder.style.width = postMedia.offsetWidth + "px";
    });
  });

function lovePost() {
  if (loves.find((p) => p.id == postId)) {
    loves.splice(loves.indexOf(loves.find((p) => p.id == postId)), 1);
    localStorage.setItem("loves", JSON.stringify(loves));
    document.getElementById("love").src = "/media/love.png";
  } else {
    loves.push({
      id: postId,
      preview: postData.preview_url,
      rating: postData.rating,
    });
    localStorage.setItem("loves", JSON.stringify(loves));
    document.getElementById("love").src = "/media/love-active.png";
  }
}

function savePost() {
  if (saves.find((p) => p.id == postId)) {
    saves.splice(saves.indexOf(saves.find((p) => p.id == postId)), 1);
    localStorage.setItem("saves", JSON.stringify(saves));
    document.getElementById("save").src = "/media/save.png";
  } else {
    saves.push({
      id: postId,
      preview: postData.preview_url,
      rating: postData.rating,
    });
    localStorage.setItem("saves", JSON.stringify(saves));
    document.getElementById("save").src = "/media/save-active.png";
  }
}

function addToList(l) {
  let list = localStorage.getItem(l);
  if (!list)
    return popup(`That list was not found`, [
      {
        label: "Ok",
        function: () => {
          killAnim(currPopup);
        },
      },
    ]);
  list = JSON.parse(list);
  if (list.find((p) => p.id == postId)) {
    list.splice(list.indexOf(list.find((p) => p.id == postId)), 1);
    localStorage.setItem(l, JSON.stringify(list));
    document.getElementById(`addto:${l}`).src = "/media/list-add.png";
    if (l == "loves") document.getElementById("love").src = "/media/love.png";
    else if (l == "saves")
      document.getElementById("save").src = "/media/save.png";
  } else {
    list.push({
      id: postId,
      preview: postData.preview_url,
      rating: postData.rating,
    });
    localStorage.setItem(l, JSON.stringify(list));
    document.getElementById(`addto:${l}`).src = "/media/list-added.png";
    if (l == "loves")
      document.getElementById("love").src = "/media/love-active.png";
    else if (l == "saves")
      document.getElementById("save").src = "/media/save-active.png";
  }
}

function downloadPost(type) {
  fetch(`/api/download/${postId}`).then(async (res) => {
    if (res.status == 500) {
      popup("Something went wrong while downloading the post", {
        label: "Ok",
        function: () => {
          killAnim(currPopup);
        },
      });
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    if (type) a.download = `${postId}.png`;
    else a.download = `${postId}.mp4`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

function imageExists(url) {
  return new Promise((resolve) => {
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
      if (url.endsWith(f)) resolve(false);
    });
    resolve(true);
  });
}

function listPost() {
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
    listElm.onclick = () => {
      addToList(list.id);
    };
    const add = document.createElement("img");
    const posts = JSON.parse(localStorage.getItem(list.id));
    if (posts) {
      const post = posts.find((p) => p.id == postId);
      if (post) add.src = "/media/list-added.png";
      else add.src = "/media/list-add.png";
    } else add.src = "/media/list-add.png";
    add.classList.add("add");
    add.id = `addto:${list.id}`;
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
