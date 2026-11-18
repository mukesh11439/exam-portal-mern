function notFound(req, res, next) {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404);
  next(error);
}

function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || (error.name === 'MulterError' ? 400 : res.statusCode >= 400 ? res.statusCode : 500);
  const message =
    error.name === 'ValidationError'
      ? error.message
      : error.code === 11000
        ? 'A record with that value already exists'
        : error.message || 'Internal server error';

  if (statusCode >= 500) console.error(error);
  res.status(statusCode).json({ message });
}

module.exports = { notFound, errorHandler };

