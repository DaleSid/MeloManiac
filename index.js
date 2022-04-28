var express = require('express');
var app = express();
app.use(express.static('src'));
app.use(express.static('build/contracts'));
app.use(express.static('node_modules'));
app.get('/', function (req, res) {
  res.render('index.html');
});
app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});