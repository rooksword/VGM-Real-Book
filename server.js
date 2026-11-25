const express = require("express");
const fs = require("fs/promises");
const path = require("path");

const app = express();
const PORT = 3000;
const SCORES_DIR = path.join(__dirname, "scores");

// List every .musicxml file in the scores folder
app.get("/api/scores", async (req, res) => {
  try {
    const entries = await fs.readdir(SCORES_DIR);
    const files = entries
      .filter(name => name.toLowerCase().endsWith(".musicxml"))
      .sort((a, b) => a.localeCompare(b));
    res.json(files);
  } catch (err) {
    console.error("Could not read scores folder:", err);
    res.status(500).json({ error: "Could not read scores folder" });
  }
});

// Serve the score files and the website
app.use("/scores", express.static(SCORES_DIR));
app.use(express.static(path.join(__dirname, "public")));

app.listen(PORT, () => {
  console.log(`VGM Real Book running at http://localhost:${PORT}`);
});