/**
 * Extracts a human-readable error message from an Axios error or any thrown value.
 *
 * Backend success responses always return { success: true, data: ... }.
 * Backend error responses return:
 *   - { success: false, error: string }               for AppError subclasses
 *   - { success: false, error: string, details: [] }  for ZodError (validation)
 */
export function extractApiError(err: unknown, fallback = "An error occurred"): string {
  const e = err as {
    response?: {
      data?: {
        error?: string | { message?: string };
        message?: string;
        details?: Array<{ path?: (string | number)[]; message: string }>;
      };
    };
    message?: string;
  };

  const errData = e?.response?.data;
  const backendError = errData?.error;
  const zodDetails = errData?.details;

  if (typeof backendError === "string") {
    if (zodDetails && zodDetails.length > 0) {
      const detailLines = zodDetails
        .slice(0, 3)
        .map((d) =>
          d.path && d.path.length > 0
            ? `${d.path.join(".")}: ${d.message}`
            : d.message
        )
        .join("; ");
      return `${backendError}: ${detailLines}`;
    }
    return backendError;
  }

  if (typeof backendError === "object" && backendError !== null) {
    return (
      (backendError as { message?: string }).message ||
      errData?.message ||
      e?.message ||
      fallback
    );
  }

  return errData?.message || e?.message || fallback;
}
