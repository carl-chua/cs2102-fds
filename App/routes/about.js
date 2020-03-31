var express = require('express');
var router = express.Router();

/* The function router.get(...); specifies the action when GET API is used */
router.get('/', function(req, res, next) {
  res.render('about', { title: 'About' });
});

module.exports = router;
