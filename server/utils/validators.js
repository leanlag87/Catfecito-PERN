export const parseBody = (event) => {
  try {
    return typeof event.body === "string" ? JSON.parse(event.body) : event.body;
  } catch (error) {
    throw new Error("Body inválido");
  }
};

export const validateRequired = (fields, fieldNames) => {
  const missing = fieldNames.filter((name) => !fields[name]);
  if (missing.length > 0) {
    throw new Error(`Campos requeridos: ${missing.join(", ")}`);
  }
};
