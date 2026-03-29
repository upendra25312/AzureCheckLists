function decodeClientPrincipal(value) {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(value, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

function getClientPrincipal(request) {
  const header = request.headers.get("x-ms-client-principal");
  return decodeClientPrincipal(header);
}

function jsonResponse(status, payload, headers = {}) {
  return {
    status,
    jsonBody: payload,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...headers
    }
  };
}

function requireAuthenticated(request) {
  const principal = getClientPrincipal(request);

  if (!principal?.userId) {
    return {
      principal: null,
      response: jsonResponse(401, {
        error: "Sign in is required before saving or exporting Azure-backed review records."
      })
    };
  }

  return {
    principal,
    response: null
  };
}

module.exports = {
  getClientPrincipal,
  jsonResponse,
  requireAuthenticated
};
