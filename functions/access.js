function withoutEmail(access, email) {
  return {
    editors: Array.isArray(access.editors)
      ? access.editors.filter((v) => v !== email)
      : [],
    viewers: Array.isArray(access.viewers)
      ? access.viewers.filter((v) => v !== email)
      : [],
  };
}
module.exports = { withoutEmail };
