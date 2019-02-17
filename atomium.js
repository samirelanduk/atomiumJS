var request = require("request");
var msgpack = require("msgpack-lite");

function fetch(code) {
  request("https://files.rcsb.org/view/" + code + ".pdb", (err, res, body) => {
    if (err) {
      return console.log("err");
    }
    var data = res.body;
    console.log(data)
  });
}


module.exports = {
  fetch: fetch
};
