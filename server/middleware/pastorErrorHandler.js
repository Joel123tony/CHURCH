import { ZodError } from "zod";

const formatIssues = (issues = []) =>
  issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));

export const pastorErrorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  console.error("PASTOR ROUTE FAILURE:", {
    method: req.method,
    path: req.originalUrl,
    hasBody: !!req.body,
    bodyKeys: req.body ? Object.keys(req.body) : [],
    hasFile: !!req.file,
    fileMime: req.file?.mimetype || null,
  });

  if (err?.stack) {
    console.error("PASTOR ROUTE STACK:", err.stack);
  } else {
    console.error("PASTOR ROUTE ERROR:", err);
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Invalid pastor payload",
      errors: formatIssues(err.issues),
    });
  }

  if (err?.isJoi) {
    return res.status(400).json({
      success: false,
      message: "Invalid pastor payload",
      errors: (err.details || []).map((item) => ({
        path: item.path?.join(".") || "",
        message: item.message,
      })),
    });
  }

  if (
    err?.name === "ValidationError" ||
    err?.name === "CastError" ||
    err?.code === "LIMIT_FILE_SIZE"
  ) {
    return res.status(400).json({
      success: false,
      message:
        err?.code === "LIMIT_FILE_SIZE"
          ? "Uploaded file is too large"
          : err.message,
    });
  }

  if (typeof err?.status === "number" || typeof err?.statusCode === "number") {
    const status = err.status || err.statusCode;

    return res.status(status).json({
      success: false,
      message: err.message || "Request failed",
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};
