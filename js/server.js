const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors()); // Enable CORS to allow cross-origin requests
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname))); // Serve static files

// Ensure Local folder exists
const localDir = path.join(__dirname, "Local");
if (!fs.existsSync(localDir)) {
  fs.mkdirSync(localDir, { recursive: true });
  console.log("Local directory created.");
}

// API to fetch inventory data
app.get("/api/load/:filename", (req, res) => {
  const fileName = req.params.filename;
  const filePath = path.join(localDir, fileName);

  // Check if the file exists
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return res.status(404).json({ error: "File not found" });
  }

  // Read the file and send the data
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error(`Error reading file: ${err.message}`);
      return res.status(500).json({ error: "Failed to read file" });
    }

    try {
      // Parse the data and return the response
      res.json(JSON.parse(data || "[]"));
    } catch (parseError) {
      console.error(`Error parsing file data: ${parseError.message}`);
      return res.status(500).json({ error: "Failed to parse file data" });
    }
  });
});

// API to save inventory data
app.post("/api/save/:filename", (req, res) => {
  const fileName = req.params.filename;
  const filePath = path.join(localDir, fileName);

  // Ensure the data is valid JSON
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({ error: "Invalid JSON data" });
  }

  // Write the file with the received data
  fs.writeFile(filePath, JSON.stringify(req.body, null, 2), (err) => {
    if (err) {
      console.error(`Error saving file: ${err.message}`);
      return res.status(500).json({ error: "Failed to save file" });
    }

    console.log(`File saved successfully: ${filePath}`);
    res.json({ message: "File saved successfully" });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
