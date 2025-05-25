export function parseRequest(
  request: { url: string; method: string; headers?: { key: string; value: string }[]; body?: string },
  variables: { key: string; value: string }[]
) {
  let url = request.url;
  let headers = request.headers ? [...request.headers] : [];
  let body = request.body || "";

  const unresolvedPlaceholders: string[] = [];
  const placeholderRegex = /{{([^}]+)}}/g;

  const MAX_ITERATIONS = 10;
  let iteration = 0;

  let hasUnresolved = true;
  while (hasUnresolved && iteration < MAX_ITERATIONS) {
    hasUnresolved = false;

    let newUrl = url;
    variables.forEach(({ key, value }) => {
      const placeholder = `{{${key}}}`;
      newUrl = newUrl.replace(placeholder, value);
    });

    let headersChanged = false;
    const newHeaders = headers.map((h) => {
      let newValue = h.value;
      variables.forEach(({ key, value }) => {
        const placeholder = `{{${key}}}`;
        newValue = newValue.replace(placeholder, value);
      });
      const changed = newValue !== h.value;
      if (changed) headersChanged = true;
      return { ...h, value: newValue };
    });

    let newBody = body;
    variables.forEach(({ key, value }) => {
      const placeholder = `{{${key}}}`;
      newBody = newBody.replace(placeholder, value);
    });

    const bodyChanged = newBody !== body;
    if (newUrl !== url || headersChanged || bodyChanged) {
      url = newUrl;
      headers = newHeaders;
      body = newBody;
      hasUnresolved = true;
    }

    iteration++;
  }

  if (iteration >= MAX_ITERATIONS) {
    throw new Error("Maximum iterations reached while resolving placeholders. Possible circular reference in variables.");
  }

  let match;
  while ((match = placeholderRegex.exec(url)) !== null) {
    unresolvedPlaceholders.push(match[1]);
  }
  headers.forEach((h) => {
    while ((match = placeholderRegex.exec(h.value)) !== null) {
      unresolvedPlaceholders.push(match[1]);
    }
  });
  if (body) {
    while ((match = placeholderRegex.exec(body)) !== null) {
      unresolvedPlaceholders.push(match[1]);
    }
  }

  if (unresolvedPlaceholders.length > 0) {
    throw new Error(
      `The following variables are unresolved: ${[...new Set(unresolvedPlaceholders)].join(", ")}. Please define them in the selected environment.`
    );
  }

  return { ...request, url, headers, body };
}

export function executeScript(script: string, env: { [key: string]: any }, response?: any) {
  try {
    const fn = new Function("env", "response", script);
    fn(env, response);
  } catch (error) {
    console.error("Script execution error:", error);
  }
}

export function isValidJson(body: string): boolean {
  try {
    JSON.parse(body);
    return true;
  } catch {
    return false;
  }
}

export function formatHeaders(headers: { key: string; value: string }[]): string {
  return headers
    .filter((h) => h.key && h.value)
    .map((h) => `${h.key}: ${h.value}`)
    .join("\n");
}