export function parseRequest(request: any, variables: { key: string; value: string }[]) {
  const replaceVariables = (text: string) =>
    text.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      const variable = variables.find((v) => v.key === key);
      return variable?.value || "";
    });

  return {
    ...request,
    url: replaceVariables(request.url),
    body: request.body ? replaceVariables(request.body) : request.body,
  };
}