function evaluateReleaseGate(input) {
  const violations = [];

  // 1. Permissions
  const permissions = input?.workflow?.permissions;

  const expectedPermissions = {
    contents: "read",
    packages: "write",
    "id-token": "none",
  };

  if (
    !permissions ||
    Object.keys(permissions).length !== 3 ||
    Object.keys(expectedPermissions).some(
      (key) => permissions[key] !== expectedPermissions[key],
    )
  ) {
    violations.push("EXCESS_PERMISSION");
  }

  // 2. Pull request trigger
  if (
    input?.event === "pull_request" &&
    input?.workflow?.trigger !== "pull_request"
  ) {
    violations.push("UNSAFE_PR_TRIGGER");
  }

  // 3. Tests/matrix/fail-fast
  if (
    input?.workflow?.testsPassed !== true ||
    input?.workflow?.matrixComplete !== true ||
    input?.workflow?.failFast !== false
  ) {
    violations.push("TESTS_INCOMPLETE");
  }

  // 4. Action pinning
  for (const action of input?.workflow?.actions ?? []) {
    const ref = action?.ref ?? "";

    if (action?.owner === "actions") {
      // GitHub-owned actions may use tags.
      continue;
    }

    if (!/^[0-9a-f]{40}$/.test(ref)) {
      violations.push("MUTABLE_ACTION");
      break;
    }
  }

  // 5. Image hardening
  if (input?.image?.multiStage !== true) {
    violations.push("SINGLE_STAGE_IMAGE");
  }

  if (input?.image?.runsAsRoot !== false) {
    violations.push("ROOT_RUNTIME");
  }

  if (
    input?.image?.secretMode !== "none" &&
    input?.image?.secretMode !== "buildkit"
  ) {
    violations.push("SECRET_IN_LAYER");
  }

  if (input?.image?.criticalVulnerabilities !== 0) {
    violations.push("CRITICAL_CVE");
  }

  if (input?.image?.digestPinned !== true) {
    violations.push("UNPINNED_IMAGE");
  }

  // 6. Production requirements
  if (input?.target === "production") {
    if (input?.event !== "push" || input?.ref !== "refs/heads/main") {
      violations.push("INVALID_PRODUCTION_REF");
    }

    if (input?.environmentApproval !== true) {
      violations.push("APPROVAL_REQUIRED");
    }
  }

  return {
    decision: violations.length === 0 ? "promote" : "block",
    violations,
  };
}

module.exports = { evaluateReleaseGate };
