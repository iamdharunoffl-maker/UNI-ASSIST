const errorHandler = (err, req, res, next) => {
  console.error(err.stack || err);

  const status = err.status || 500;
  const message = err.message || 'An unexpected error occurred on the server.';

  res.status(status).json({
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
