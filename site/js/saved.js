const type = window.location.pathname.split("/")[1];
let posts;
if (type == "saves") {
  posts = localStorage.getItem("saves");
  if (!posts) posts = [];
  else posts = JSON.parse(posts);
  document.title = "Consurf | Saves";
} else {
  posts = localStorage.getItem("loves");
  if (!posts) posts = [];
  else posts = JSON.parse(posts);
  document.title = "Consurf | Favorites";
}

if (document.getElementById("postHolder"))
  document.getElementById("postHolder").remove();
const postHolder = document.createElement("div");
postHolder.classList.add("posts");
postHolder.id = "postHolder";
if (!posts || posts == null || posts == "") {
  const nothingMore = document.createElement("div");
  nothingMore.classList.add("nothing-more");
  const nothingIcon = document.createElement("img");
  nothingIcon.src = "/media/empty.png";
  const nothingText = document.createElement("span");
  nothingText.textContent = "Nothing Here";
  nothingMore.appendChild(nothingIcon);
  nothingMore.appendChild(nothingText);
  postHolder.appendChild(nothingMore);
  document.body.appendChild(postHolder);
}
posts.forEach(async (post) => {
  const t = await imageExists(post.preview);
  const r = rating(post.rating);
  const postItem = document.createElement("a");
  postItem.classList.add("post");
  postItem.id = post.id;
  postItem.href = `/post/${post.id}`;
  const postImg = document.createElement("img");
  postImg.classList.add("img");
  postImg.src = post.preview;
  const postInfo = document.createElement("div");
  postInfo.classList.add("post-info");
  if (settings.unblurHover) {
    postInfo.classList.add("unblur");
  }
  const postRating = document.createElement("span");
  postRating.textContent = r.rating;
  postRating.style.color = `var(--${r.color})`;
  const postType = document.createElement("img");
  postType.src = t;
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
  postHolder.appendChild(postItem);
});
document.body.appendChild(postHolder);

function rating(r) {
  const ratings = ["safe", "questionable", "explicit"];
  const short = ["E", "13+", "18+"];
  const colors = ["success", "warning", "error"];
  const rating = short[ratings.indexOf(r)];
  return { rating: rating, color: colors[ratings.indexOf(r)] };
}

function imageExists(url) {
  return new Promise((resolve) => {
    if (url.endsWith(".gif")) resolve("/media/gif.png");
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
      if (url.endsWith(f)) resolve("/media/video.png");
    });
    resolve("/media/image.png");
  });
}
