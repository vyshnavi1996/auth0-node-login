var express = require('express');
var router = express.Router();
var passport = require('passport');
var dotenv = require('dotenv');
var util = require('util');
var url = require('url');
var querystring = require('querystring');

dotenv.config();

// Perform the login, after login Auth0 will redirect to callback
router.get('/login', passport.authenticate('auth0', {
  scope: 'openid email profile'
}), function (req, res) {
  res.redirect('/');
});

// Perform the final stage of authentication and redirect to previously requested URL or '/user'
router.get('/callback', function (req, res, next) {
  passport.authenticate('auth0', function (err, user, info) {
    if (err) { return next(err); }
    if (!user) { return res.redirect('/login'); }
    req.logIn(user, function (err) {
      if (err) { return next(err); }
      const returnTo = req.session.returnTo;
      delete req.session.returnTo;
      res.redirect(returnTo || '/user');
    });
  })(req, res, next);
});

// Perform session logout and redirect to homepage
router.get('/logout', (req, res) => {
  req.logout();
  //https://community.auth0.com/t/having-trouble-with-logout-on-the-sample-nodejs-app/18172/10
  if (req.session) {
    req.session.destroy(function (err) {
      if (err) { console.log(err) }
      console.log("Destroyed the user session on Auth0 endpoint");

      var returnTo = req.protocol + '://' + req.hostname;
      var port = req.connection.localPort;
      if (port !== undefined && port !== 80 && port !== 443) {

        // https://auth0.com/blog/create-a-simple-and-secure-node-express-app/
        returnTo =
          process.env.NODE_ENV === "production"
            ? `${returnTo}/`
            : `${returnTo}:${port}`;

      }
      var logoutURL = new url.URL(
        util.format('https://%s/v2/logout', process.env.AUTH0_DOMAIN)
      );
      var searchString = querystring.stringify({
        client_id: process.env.AUTH0_CLIENT_ID,
        returnTo: returnTo
      });
      logoutURL.search = searchString;
      res.redirect(logoutURL);
      //res.redirect('https://<myapp>.auth0.com/v2/logout?client_id=<clientId>&returnTo=http://localhost:3000/');
      //              https://        auth0.com/v2/logout?client_id=ffffffffff&returnTo=https%3A%2F%2Ftest-auth0-case.herokuapp.com%3A43403
    });
  }
});

module.exports = router;
