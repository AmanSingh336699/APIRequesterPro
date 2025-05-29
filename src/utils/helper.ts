export const validateUrl = (url: string) => {
  try {
    new URL(url);
  } catch {
    throw new Error("The resolved URL is invalid. Please ensure all placeholders are defined correctly");
  }
};

export const validateJSON = (value: string) => {
    try {
      if (!value) return [];
      JSON.parse(value);
      return [];
    } catch (err) {
      return [{ row: 0, column: 0, text: 'Invalid JSON format', type: 'error' }];
    }
  };