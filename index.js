const express = require("express");
const axios = require("axios");
const path = require("path");
const fs = require("fs");
const app = express();
const xml2js = require("xml2js");
const cheerio = require("cheerio");
const port = 10000;
const parseString = require("xml2js").parseString;
const tagCache = new Map();
app.use(express.json());

app.get("/api/search", async (req, res) => {
  const tags = req.query.q || "";
  const page = parseInt(req.query.p || 0);
  const id = req.query.id || "";
  const type = req.query.t || "post";
  try {
    let data;
    if (type == "tags") {
      // Thanks for the unofficial api endpoint guys :3
      const response = await axios.get(
        `https://api.rule34.xxx/autocomplete.php?q=${tags}`
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
      }
    }

    res.json(data);
  } catch (error) {
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
    res.status(500).send("An error occurred");
  }
});

app.get(
  ["/loadouts", "/loadouts/create", "/loadout/:id/edit", "/loadout/:id"],
  async (req, res) => {
    const route = req.path;
    let filePath;
    if (route == "/loadouts")
      filePath = path.join(__dirname, "site/html/lists/lists.html");
    else if (route == "/loadouts/create")
      filePath = path.join(__dirname, "site/html/lists/create.html");
    else if (route.startsWith("/loadout/") && route.endsWith("/edit"))
      filePath = path.join(__dirname, "site/html/lists/edit.html");
    else if (route.startsWith("/loadout/"))
      filePath = path.join(__dirname, "site/html/lists/list.html");
    res.sendFile(filePath);
  }
);

app.get("/post/:id", async (req, res) => {
  res.sendFile(path.join(__dirname, "site/html/post.html"));
});

app.use(
  express.static(path.join(__dirname, "site", "html"), { extensions: ["html"] })
);

app.use(express.static(path.join(__dirname, "site")));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "site/html/index.html"));
});

app.listen(port, () => {
  console.log("Server started on port", port);
});

function xmlToJson(xml) {
  return new Promise((resolve, reject) => {
    xml2js.parseString(
      xml,
      { mergeAttrs: true, explicitArray: false },
      (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      }
    );
  });
}
