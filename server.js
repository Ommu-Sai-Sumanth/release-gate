<<<<<<< HEAD
const express = require("express");

const app = express();
app.use(express.json());

app.post("/release-gate", (req, res) => {
  const { target, event, ref, workflow, image, environmentApproval } = req.body;

  const violations = [];

  // Permissions
  const expectedPermissions = {
    contents: "read",
    packages: "write",
    "id-token": "none",
  };

  const permissions = workflow?.permissions || {};

  if (
    Object.keys(permissions).length !== 3 ||
    permissions.contents !== expectedPermissions.contents ||
    permissions.packages !== expectedPermissions.packages ||
    permissions["id-token"] !== expectedPermissions["id-token"]
  ) {
    violations.push("EXCESS_PERMISSION");
  }

  // Pull request trigger
  if (event === "pull_request" && workflow?.trigger !== "pull_request") {
    violations.push("UNSAFE_PR_TRIGGER");
  }

  // Tests
  if (
    workflow?.testsPassed !== true ||
    workflow?.matrixComplete !== true ||
    workflow?.failFast !== false
  ) {
    violations.push("TESTS_INCOMPLETE");
  }

  // Actions
  for (const action of workflow?.actions || []) {
    if (action.owner !== "actions" && !/^[0-9a-f]{40}$/.test(action.ref)) {
      violations.push("MUTABLE_ACTION");
      break;
    }
  }

  // Image
  if (image?.multiStage !== true) {
    violations.push("SINGLE_STAGE_IMAGE");
  }

  if (image?.runsAsRoot !== false) {
    violations.push("ROOT_RUNTIME");
  }

  if (image?.secretMode !== "none" && image?.secretMode !== "buildkit") {
    violations.push("SECRET_IN_LAYER");
  }

  if (image?.criticalVulnerabilities !== 0) {
    violations.push("CRITICAL_CVE");
  }

  if (image?.digestPinned !== true) {
    violations.push("UNPINNED_IMAGE");
  }

  // Production
  if (target === "production") {
    if (event !== "push" || ref !== "refs/heads/main") {
      violations.push("INVALID_PRODUCTION_REF");
    }

    if (environmentApproval !== true) {
      violations.push("APPROVAL_REQUIRED");
    }
  }

  res.json({
    decision: violations.length === 0 ? "promote" : "block",
    violations,
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Release gate running on port ${PORT}`);
});
=======
const express = require("express");

const app = express();
app.use(express.json());

app.post("/release-gate", (req, res) => {
  const { target, event, ref, workflow, image, environmentApproval } = req.body;

  const violations = [];

  // Permissions
  const expectedPermissions = {
    contents: "read",
    packages: "write",
    "id-token": "none",
  };

  const permissions = workflow?.permissions || {};

  if (
    Object.keys(permissions).length !== 3 ||
    permissions.contents !== expectedPermissions.contents ||
    permissions.packages !== expectedPermissions.packages ||
    permissions["id-token"] !== expectedPermissions["id-token"]
  ) {
    violations.push("EXCESS_PERMISSION");
  }

  // Pull request trigger
  if (event === "pull_request" && workflow?.trigger !== "pull_request") {
    violations.push("UNSAFE_PR_TRIGGER");
  }

  // Tests
  if (
    workflow?.testsPassed !== true ||
    workflow?.matrixComplete !== true ||
    workflow?.failFast !== false
  ) {
    violations.push("TESTS_INCOMPLETE");
  }

  // Actions
  for (const action of workflow?.actions || []) {
    if (action.owner !== "actions" && !/^[0-9a-f]{40}$/.test(action.ref)) {
      violations.push("MUTABLE_ACTION");
      break;
    }
  }

  // Image
  if (image?.multiStage !== true) {
    violations.push("SINGLE_STAGE_IMAGE");
  }

  if (image?.runsAsRoot !== false) {
    violations.push("ROOT_RUNTIME");
  }

  if (image?.secretMode !== "none" && image?.secretMode !== "buildkit") {
    violations.push("SECRET_IN_LAYER");
  }

  if (image?.criticalVulnerabilities !== 0) {
    violations.push("CRITICAL_CVE");
  }

  if (image?.digestPinned !== true) {
    violations.push("UNPINNED_IMAGE");
  }

  // Production
  if (target === "production") {
    if (event !== "push" || ref !== "refs/heads/main") {
      violations.push("INVALID_PRODUCTION_REF");
    }

    if (environmentApproval !== true) {
      violations.push("APPROVAL_REQUIRED");
    }
  }

  res.json({
    decision: violations.length === 0 ? "promote" : "block",
    violations,
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Release gate running on port ${PORT}`);
});
>>>>>>> b59054d (Add release gate)
