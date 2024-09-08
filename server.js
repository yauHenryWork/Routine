var express = require('express');
var app = express();

app.get('/', function(req, res){
   res.send("Hello world! From Routine test commit 2");
});

app.listen(3000);