var express = require('express');
var app = express();
app.use(express.static('src'));
app.use(express.static('build/contracts'));
app.use(express.static('node_modules'));
app.get('/', function (req, res) {
  res.render('index.html');
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});