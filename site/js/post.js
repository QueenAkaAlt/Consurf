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
        fullImage(post.file_url);
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

function fullImage(url) {
  if (settings.clickZoom) window.open(url, "_blank");
}
