module.exports = function (req, res, next) {
  if (req.localUser) {
    req.setLocale(req.localUser.languagePreference)
    req.i18n.locale = req.localUser.languagePreference
  }
  next()
}
