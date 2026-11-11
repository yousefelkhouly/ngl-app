import multer from "multer";
import { logger } from "../../pkg/logger/logger.js";
import { env } from "../config/env.js";

function toClientError(err) {
  if (err.isOperational === true) return err;

  // bad JSON body from express.json()
  if (err.type === "entity.parse.failed") {
    return { statusCode: 400, message: "invalid JSON body" };
  }
  // body bigger than express.json's limit
  if (err.type === "entity.too.large") {
    return { statusCode: 413, message: "request body is too large" };
  }
  // any other 4xx from express or body-parser (unsupported charset or encoding,
  // aborted request...). `expose` is their flag for "safe to show the client"
  if (err.expose === true && err.status >= 400 && err.status < 500) {
    return { statusCode: err.status, message: err.message };
  }
  // multer: file too big, too many files, unexpected field name...
  if (err instanceof multer.MulterError) {
    return { statusCode: 400, message: err.message };
  }
  // mongoose schema validation (e.g. a field longer than maxLength)
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return { statusCode: 400, message: messages.join(", ") };
  }
  // an id that isn't a valid ObjectId
  if (err.name === "CastError") {
    return { statusCode: 400, message: `invalid ${err.path}` };
  }
  // unique index, e.g. two registers with the same email at the same time
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue ?? {})[0] ?? "value";
    return { statusCode: 409, message: `${field} already exists` };
  }
  return null;
}

export function handleError(err, req, res, next) {
  logger.error(err.message, {
    stack: err.stack,
    correlationId: req.correlationId,
  });

  const clientError = toClientError(err);

  if (clientError) {
    return res.status(clientError.statusCode).json({
      message: clientError.message,
      success: false,
      // the stack shows file paths and code, only useful while developing
      ...(env.isProduction ? {} : { stack: err.stack }),
    });
  }
  return res.status(500).json({
    message: "something went wrong",
    success: false,
  });
}
