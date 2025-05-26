export const validateUrl = (url: string) => {
  try {
    new URL(url);
  } catch {
    throw new Error("The resolved URL is invalid. Please ensure all placeholders are defined correctly");
  }
};