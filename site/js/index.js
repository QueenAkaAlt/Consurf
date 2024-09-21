function rating(r) {
  const ratings = ["safe", "questionable", "explicit"];
  const short = ["E", "13+", "18+"];
  const colors = ["success", "warning", "error"];
  const rating = short[ratings.indexOf(r)];
  return { rating: rating, color: colors[ratings.indexOf(r)] };
}

document.addEventListener("DOMContentLoaded", () => {
  const searchbar = document.getElementById("search");
  searchbar.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      let tags = e.target.value;
      if (!tags) return;
      tags = tags.replace(/ /g, "+");
      search(tags);
      if (document.getElementById("tagList"))
        document.getElementById("tagList").remove();
    } else {
      if (!settings.tagAutofill) return;
      tagSearch(e);
    }
  });
  searchbar.addEventListener("click", (e) => {
    if (!settings.tagAutofill) return;
    tagSearch(e);
  });
  setInterval(() => {
    if (searchbar !== document.activeElement) {
      setTimeout(() => {
        if (document.getElementById("tagList")) {
          document.getElementById("tagList").remove();
        }
      }, 100);
    }
  });
});

function search(tags) {
  if (!tags || tags == null) return;
  tags = tags.replace(/ /g, "+");
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

function loadPage(tags, index = 1) {
  if (!tags || tags == null) return;
  const newIndex = index + 1;
  fetch(`/api/search?t=posts&q=${tags}&p=${index}`)
    .then((res) => res.json())
    .then(async (posts) => {
      const postHolder = document.getElementById("postHolder");
      handlePosts(tags, posts, newIndex);
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

function tagSearch(e) {
  setTimeout(() => {
    let searchValue = e.target.value;
    searchValue = searchValue.trim();
    if (!searchValue || searchValue == null || searchValue == "") {
      if (document.getElementById("tagList")) {
        document.getElementById("tagList").remove();
        return;
      }
    }
    fetch(
      `/api/search?t=tags&q=${
        searchValue.split(" ")[searchValue.split(" ").length - 1]
      }`
    )
      .then((res) => res.json())
      .then((tags) => {
        if (document.getElementById("tagList"))
          document.getElementById("tagList").remove();
        const tagList = document.createElement("div");
        tagList.classList.add("tag-list");
        tagList.id = "tagList";
        tags.forEach((tag) => {
          const tagItem = document.createElement("div");
          tagItem.classList.add("tag-item");
          tagItem.textContent = tag.label;
          tagItem.addEventListener("click", () => {
            let searchArray = searchValue.split(" ");
            searchArray.pop();
            searchArray.push(tag.value);
            e.target.value = searchArray.join(" ");
            e.target.focus();
            setTimeout(() => {
              tagList.remove();
            }, 100);
          });
          tagList.appendChild(tagItem);
        });
        e.target.parentNode.appendChild(tagList);
      });
  }, 100);
}

async function handlePosts(tags, posts, page = 0) {
  const postLength = posts.length;
  let postsDone = 0;
  if (posts == "" || postLength == 0) {
    const nothingMore = document.createElement("div");
    nothingMore.classList.add("nothing-more");
    const nothingIcon = document.createElement("img");
    nothingIcon.src = "/media/empty.png";
    const nothingText = document.createElement("span");
    nothingText.textContent = "Nothing Here";
    nothingMore.appendChild(nothingIcon);
    nothingMore.appendChild(nothingText);
    postHolder.appendChild(nothingMore);
    return;
  }
  posts.forEach(async (post, i) => {
    const r = rating(post.rating);
    const postItem = document.createElement("a");
    postItem.classList.add("post");
    postItem.id = post.id;
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
    postType.src = await imageExists(post.file_url);
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
    postsDone++;
  });
  if (postLength < 100) {
    const nothingMore = document.createElement("div");
    nothingMore.classList.add("nothing-more");
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
    loadMore.href = `#page-${page + 2}`;
    loadMore.onclick = () => {
      loadMore.remove();
      loadPage(tags, page);
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
