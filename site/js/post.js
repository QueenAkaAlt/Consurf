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
    const type = await imageExists(post.file_url);
    postData = post;
    postData.type = type;
    const postHolder = document.createElement("div");
    postHolder.classList.add("post-full");
    postHolder.id = "postHolder";
    const postItem = document.createElement("div");
    postItem.classList.add("item");
    if (type == true) {
      const postImg = document.createElement("img");
      postImg.src = post.file_url;
      postItem.appendChild(postImg);
    } else {
      const postVideo = document.createElement("video");
      postVideo.src = post.file_url;
      postVideo.controls = true;
      postVideo.loop = true;
      postVideo.autoplay = true;
      postItem.appendChild(postVideo);
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
    const postDownload = document.createElement("img");
    postDownload.src = "/media/download.png";
    postDownload.onclick = () => {
      downloadPost(type);
    };
    const tagList = document.createElement("div");
    tagList.classList.add("post-tags");
    console.log(post);
    post.tags.split(" ").forEach((tag) => {
      const tagItem = document.createElement("a");
      tagItem.innerText = tag;
      tagItem.href = `/posts/${tag}`;
      tagList.appendChild(tagItem);
    });
    actionButtons.appendChild(postLove);
    actionButtons.appendChild(postSave);
    postButtons.appendChild(actionButtons);
    postButtons.appendChild(postDownload);
    postItem.appendChild(postButtons);
    postHolder.appendChild(postItem);
    if (post.tags.length > 0 && settings.showTags)
      postHolder.appendChild(tagList);
    document.body.appendChild(postHolder);
    if (loves.find((p) => p.id == postId))
      document.getElementById("love").src = "/media/love-active.png";
    if (saves.find((p) => p.id == postId))
      document.getElementById("save").src = "/media/save-active.png";
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
      type: postData.type,
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
      type: postData.type,
    });
    localStorage.setItem("saves", JSON.stringify(saves));
    document.getElementById("save").src = "/media/save-active.png";
  }
}

function downloadPost(type) {
  fetch(`/api/download/${postId}`).then(async (res) => {
    if (res.status == 500) {
      alert("Something went wrong");
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
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}
