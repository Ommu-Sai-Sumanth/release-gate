function evaluateReleaseGate(input) {
  const {
    target,
    event,
    ref,
    workflow = {},
    image = {}
  } = input;

  const violations = [];

  // 1. Permissions must be EXACTLY:
  // contents: read
  // packages: write
  // id-token: none
  const permissions = workflow.permissions || {};
  const permissionKeys = Object.keys(permissions);

  if (
    permissionKeys.length !== 3 ||
    permissions.contents !== "read" ||
    permissions.packages !== "write" ||
    permissions["id-token"] !== "none"
  ) {
    violations.push("EXCESS_PERMISSION");
  }

  // 2. Pull requests must use pull_request
  if (
    event === "pull_request" &&
    workflow.trigger !== "pull_request"
  ) {
    violations.push("UNSAFE_PR_TRIGGER");
  }

  // 3. Tests must pass, matrix must be complete,
  // and failFast must be false
  if (
    workflow.testsPassed !== true ||
    workflow.matrixComplete !== true ||
    workflow.failFast !== false
  ) {
    violations.push("TESTS_INCOMPLETE");
  }

  // 4. actions/* may use version tags.
  // All third-party actions require a full 40-character
  // lowercase hexadecimal commit SHA.
  for (const action of workflow.actions || []) {
    if (
      action.owner !== "actions" &&
      !/^[0-9a-f]{40}$/.test(action.ref)
    ) {
      violations.push("MUTABLE_ACTION");
      break;
    }
  }

  // 5. Image must be multi-stage
  if (image.multiStage !== true) {
    violations.push("SINGLE_STAGE_IMAGE");
  }

  // 6. Image must run as non-root
  if (image.runsAsRoot !== false) {
    violations.push("ROOT_RUNTIME");
  }

  // 7. Secrets must be none or BuildKit
  if (
    image.secretMode !== "none" &&
    image.secretMode !== "buildkit"
  ) {
    violations.push("SECRET_IN_LAYER");
  }

  // 8. Zero critical vulnerabilities
  if (image.criticalVulnerabilities !== 0) {
    violations.push("CRITICAL_CVE");
  }

  // 9. Image must be digest pinned
  if (image.digestPinned !== true) {
    violations.push("UNPINNED_IMAGE");
  }

  // 10. Production requirements
  if (target === "production") {
    // Production must be a push to main
    if (
      event !== "push" ||
      ref !== "refs/heads/main"
    ) {
      violations.push("INVALID_PRODUCTION_REF");
    }

    // Approval is inside workflow
    if (workflow.environmentApproval !== true) {
      violations.push("APPROVAL_REQUIRED");
    }
  }

  return {
    decision: violations.length === 0 ? "promote" : "block",
    violations
  };
}

module.exports = {
  evaluateReleaseGate
};