const assert = require("node:assert");
const { evaluateReleaseGate } = require("./policy");

const safeRequest = {
  target: "preview",
  event: "pull_request",
  ref: "refs/heads/test",
  workflow: {
    trigger: "pull_request",
    permissions: {
      contents: "read",
      packages: "write",
      "id-token": "none"
    },
    testsPassed: true,
    matrixComplete: true,
    failFast: false,
    actions: [
      {
        owner: "actions",
        name: "checkout",
        ref: "v4"
      }
    ]
  },
  image: {
    multiStage: true,
    runsAsRoot: false,
    secretMode: "none",
    criticalVulnerabilities: 0,
    digestPinned: true
  }
};

const result = evaluateReleaseGate(safeRequest);

assert.strictEqual(result.decision, "promote");
assert.deepStrictEqual(result.violations, []);

console.log("All tests passed");