//var request = require("request");
var url = 'https://raw.github.com/vkorapaty/wh-api/master/whitehat.json';
//request(url, function(err, res, body) {
//    console.log(body);
//});

var https = require('https');
var data;
https.get(url, function(res, req, body) {
    console.log("statusCode: ", res.statusCode);
    console.log("headers: ", res.headers);

    res.on('data', function(d) {
        console.log(JSON.parse(d));
        process.stdout.write(d);
    });
}).on('error', function(e) {
    console.error(e);
});

