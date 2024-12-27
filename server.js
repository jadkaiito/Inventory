const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname))); // Serve static files

// API to fetch data
app.get("/api/load/:filename", (req, res) => {
  const fileName = req.params.filename;
  const filePath = path.join(__dirname, "Local", fileName);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found" });
  }

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      return res.status(500).json({ error: "Failed to read file" });
    }
    res.json(JSON.parse(data || "[]"));
  });
});

// API to save data
app.post("/api/save/:filename", (req, res) => {
  const fileName = req.params.filename;
  const filePath = path.join(__dirname, "Local", fileName);

  fs.writeFile(filePath, JSON.stringify(req.body, null, 2), (err) => {
    if (err) {
      console.error("Error saving file:", err);
      return res.status(500).json({ error: "Failed to save file" });
    }
    res.json({ message: "File saved successfully" });
  });
});

// Ensure Local folder exists
if (!fs.existsSync(path.join(__dirname, "Local"))) {
  fs.mkdirSync(path.join(__dirname, "Local"));
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
