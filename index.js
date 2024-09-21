const express = require("express");
const axios = require("axios");
const path = require("path");
const fs = require("fs");
const app = express();
const xml2js = require("xml2js");
const cheerio = require("cheerio");
const port = 10000;

process.on("uncaughtException", (error) => {
  log(error, "ERROR");
});

process.on("unhandledRejection", (reason, promise) => {
  log(reason, "ERROR");
});

app.use(express.json());

app.get("/api/search", async (req, res) => {
  const tags = req.query.q || "";
  const page = parseInt(req.query.p || 0);
  const id = req.query.id || "";
  const type = req.query.t || "post";
  try {
    let data;
    if (type == "tags") {
      const response = await axios.get(
        `https://ac.rule34.xxx/autocomplete.php?q=${tags}`
      );
      data = response.data;
    } else {
      if (id) {
        const postRes = await axios.get(
          `https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&id=${id}&json=1`
        );
        const commentRes = await axios.get(
          `https://api.rule34.xxx/index.php?page=dapi&s=comment&q=index&post_id=${id}`
        );
        data = postRes.data[0];
        const comments = await xmlToJson(commentRes.data);
        if (comments && comments.comments) {
          data.comments = comments.comments.comment;
        }
      } else {
        const response = await axios.get(
          `https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&tags=${tags}&pid=${page}&json=1`
        );
        data = response.data;
        if (page == 0) log(`Searched for ${tags}`);
      }
    }

    res.json(data);
  } catch (error) {
    log(error, "ERROR");
    res.status(500).json({ error: "Failed to fetch post" });
  }
});

app.get("/api/download/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const response = await axios.get(
      `https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&id=${id}&json=1`
    );
    const data = response.data[0];
    const imageData = await axios.get(data.file_url, {
      responseType: "arraybuffer",
    });
    const image = Buffer.from(imageData.data, "binary");
    fs.writeFile(
      path.join(__dirname, "/site/downloads", `${id}.png`),
      image,
      (err) => {
        if (err) {
          console.error(err);
          res.status(500).send("An error occurred");
        } else {
          res.sendFile(path.join(__dirname, "/site/downloads", `${id}.png`));
          log(`Downloaded post ${id}`);
        }
      }
    );
    setTimeout(() => {
      fs.unlink(path.join(__dirname, "/site/downloads", `${id}.png`), (err) => {
        if (err) {
          console.error(err);
        }
      });
    }, 10000);
  } catch (error) {
    log(error, "ERROR");
    res.status(500).send("An error occurred");
  }
});

app.get(["/saves", "/loves", "/post/:id"], async (req, res) => {
  const route = req.path;
  let filePath;
  if (route == "/saves" || route == "/loves") {
    filePath = path.join(__dirname, "site/html/saved.html");
  } else {
    filePath = path.join(__dirname, "site/html/post.html");
  }
  res.sendFile(filePath);
});

app.use(
  express.static(path.join(__dirname, "site", "html"), { extensions: ["html"] })
);

app.use(express.static(path.join(__dirname, "site")));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "site/html/index.html"));
});

app.listen(port, () => {
  log("Server started", "EVENT");
});

function log(message, type = "LOG") {
  const newYorkDate = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
  const formattedDate = formatter.format(newYorkDate);
  const $ = cheerio.load(
    fs.readFileSync(path.join(__dirname, "site/html/logs.html"))
  );
  $("body").append(
    `<div class="log">\n\t<span class="time"><div>[${type}]</div><div>${formattedDate}</div></span>\n\t<span class="msg">${message}</span>\n</div>\n`
  );
  fs.writeFileSync(path.join(__dirname, "site/html/logs.html"), $.html());
}

function xmlToJson(xml) {
  return new Promise((resolve, reject) => {
    xml2js.parseString(
      xml,
      { mergeAttrs: true, explicitArray: false },
      (err, result) => {
        if (err) {
          log(err, "ERROR");
          reject(err);
        } else {
          resolve(result);
        }
      }
    );
  });
}
