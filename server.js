const express = require("express");
const { evaluateReleaseGate } = require("./policy");

const app = express();

app.use(express.json());

app.post("/release-gate", (req, res) => {
  const result = evaluateReleaseGate(req.body);
  res.json(result);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Release gate running on port ${PORT}`);
});