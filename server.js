var express = require('express');
var compression = require('compression');

// Create our app
var app = express();
const PORT = process.env.PORT || 8000;

// compress all responses
app.use(compression());

app.use(express.static('./'));

app.listen(PORT, function () {
  console.log('Express server is up on port ' + PORT);
});
