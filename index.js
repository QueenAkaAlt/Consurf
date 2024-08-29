const express = require("express");
const axios = require("axios");
const path = require("path");
const fs = require("fs");
const app = express();
const port = 10000;
const cors = require("cors");
const corsOptions = {
  origin: "*",
  credentials: true,
};

app.use(cors(corsOptions));
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
        const response = await axios.get(
          `https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&id=${id}&json=1`
        );
        data = response.data[0];
      } else {
        const response = await axios.get(
          `https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&tags=${tags}&pid=${page}&json=1`
        );
        data = response.data;
      }
    }

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred");
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
    console.error(error);
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

app.use("/js", express.static(path.join(__dirname, "site/js")));

app.use("/css", express.static(path.join(__dirname, "site/css")));

app.use("/media", express.static(path.join(__dirname, "site/media")));

app.use(
  express.static(path.join(__dirname, "site", "html"), { extensions: ["html"] })
);

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "site/html/index.html"));
});

app.listen(port, () => {
  console.log("running");
});
