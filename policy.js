function evaluateReleaseGate(input) {
  const {
    target,
    event,
    ref,
    workflow = {},
    image = {},
    environmentApproval
  } = input;

  const violations = [];

  const permissions = workflow.permissions || {};

  if (
    Object.keys(permissions).length !== 3 ||
    permissions.contents !== "read" ||
    permissions.packages !== "write" ||
    permissions["id-token"] !== "none"
  ) {
    violations.push("EXCESS_PERMISSION");
  }

  if (
    event === "pull_request" &&
    workflow.trigger !== "pull_request"
  ) {
    violations.push("UNSAFE_PR_TRIGGER");
  }

  if (
    workflow.testsPassed !== true ||
    workflow.matrixComplete !== true ||
    workflow.failFast !== false
  ) {
    violations.push("TESTS_INCOMPLETE");
  }

  for (const action of workflow.actions || []) {
    if (
      action.owner !== "actions" &&
      !/^[0-9a-f]{40}$/.test(action.ref)
    ) {
      violations.push("MUTABLE_ACTION");
      break;
    }
  }

  if (image.multiStage !== true) {
    violations.push("SINGLE_STAGE_IMAGE");
  }

  if (image.runsAsRoot !== false) {
    violations.push("ROOT_RUNTIME");
  }

  if (
    image.secretMode !== "none" &&
    image.secretMode !== "buildkit"
  ) {
    violations.push("SECRET_IN_LAYER");
  }

  if (image.criticalVulnerabilities !== 0) {
    violations.push("CRITICAL_CVE");
  }

  if (image.digestPinned !== true) {
    violations.push("UNPINNED_IMAGE");
  }

  if (target === "production") {
    if (
      event !== "push" ||
      ref !== "refs/heads/main"
    ) {
      violations.push("INVALID_PRODUCTION_REF");
    }

    if (environmentApproval !== true) {
      violations.push("APPROVAL_REQUIRED");
    }
  }

  return {
    decision: violations.length === 0 ? "promote" : "block",
    violations
  };
}

module.exports = { evaluateReleaseGate };