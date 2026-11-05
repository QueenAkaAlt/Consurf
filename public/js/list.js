const type = window.location.pathname.split("/")[2];
let posts;
posts = localStorage.getItem(type);
const list = lists.find((l) => l.id == type);
if (!list) window.location.href = "/";
if (!posts) posts = [];
else posts = JSON.parse(posts);
if (posts.length == 0) {
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
  if (settings.liveView) {
    posts.forEach(async (post, i) => {
      const type = await imageExists(post.full || post.preview);
      const r = rating(post.rating);
      const postItem = document.createElement("a");
      postItem.classList.add("post-live");
      postItem.href = `/post/${post.id}`;
      let postMedia;
      if (type != "video") {
        postMedia = document.createElement("img");
        postMedia.src = post.full || post.preview;
      } else {
        postMedia = document.createElement("video");
        postMedia.src = post.full || post.preview;
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
      postType.src = `/media/${await imageExists(
        post.full || post.preview
      )}.png`;
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
      postHolder.appendChild(postItem);
    });
  } else {
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
  }
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
