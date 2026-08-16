function renderError(res, statusCode, message, title) {
  res.status(statusCode).render('error', { message, title: title || 'Something went wrong' });
}

module.exports = { renderError };