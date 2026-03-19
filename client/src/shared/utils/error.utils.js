const DEFAULT_ERROR_MESSAGE = "Ocurrió un error inesperado";

export const getErrorMessage = (error, fallback = DEFAULT_ERROR_MESSAGE) => {
  if (!error) return fallback;

  if (typeof error === "string") return error;

  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
};

export const getErrorStatus = (error, fallback = null) => {
  return error?.response?.status ?? error?.status ?? fallback;
};

export const normalizeError = (error, fallback = DEFAULT_ERROR_MESSAGE) => ({
  success: false,
  status: getErrorStatus(error),
  error: getErrorMessage(error, fallback),
  raw: error,
});

export const isUnauthorizedError = (error) => getErrorStatus(error) === 401;
export const isForbiddenError = (error) => getErrorStatus(error) === 403;
export const isNotFoundError = (error) => getErrorStatus(error) === 404;
