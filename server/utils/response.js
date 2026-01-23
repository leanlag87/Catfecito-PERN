export const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

export const success = (data, statusCode = 200) => ({
  statusCode,
  headers,
  body: JSON.stringify(data),
});

export const created = (data) => success(data, 201);

export const error = (message, statusCode = 500, details = null) => ({
  statusCode,
  headers,
  body: JSON.stringify({
    message,
    ...(details && { details }),
  }),
});

export const badRequest = (message) => error(message, 400);
export const unauthorized = (message = "No autorizado") => error(message, 401);
export const notFound = (message = "No encontrado") => error(message, 404);
export const conflict = (message) => error(message, 409);
export const serverError = (message = "Error interno del servidor") =>
  error(message, 500);
