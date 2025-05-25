import sanitizeHtml from "sanitize-html";

export function sanitizeInput(input: string): string {
  return sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: "discard",
  });
}

export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      sanitized[key] = sanitizeInput(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        typeof item === "string" ? sanitizeInput(item) : item
      );
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized as T;
}