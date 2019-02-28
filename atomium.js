var request = require("request");

function pdbStringToPdbObject(pdbString) {
  let pdbObject = {}
  let lines = [];
  for (var line of pdbString.split("\n")) {
      lines.push([line.slice(0, 6).trimEnd(), line.trimEnd()]);
  }
  let modelRecs = ["ATOM", "HETATM", "ANISOU", "MODEL", "TER", "ENDMDL"];
  let model = [];
  let in_model = false;
  for (var line of lines) {
    if (line[0] == "REMARK") {
      if (!("REMARK" in pdbObject)) {pdbObject.REMARK = {}}
      let number = line[1].trim().split(" ")[0];
      updatePdbObject(pdbObject.REMARK, number, line[1]);
    } else if (modelRecs.includes(line[0])) {
      if (!("MODEL" in pdbObject)) {pdbObject.MODEL = [[]]}
      if (line[0] == "ENDMDL") {
        pdbObject.MODEL.push([])
      } else if (line[0] != "MODEL") {
        pdbObject.MODEL[pdbObject.MODEL.length - 1].push(line[1])
      }
    } else {
      updatePdbObject(pdbObject, line[0], line[1]);
    }
  }
  return pdbObject;
}


function updatePdbObject(obj, key, value) {
  try {
    obj[key].push(value);
  } catch(err) {
    obj[key] = [value];
  }
}


function fetch(code, callback) {
  request("https://files.rcsb.org/view/" + code + ".pdb", (err, res, body) => {
    if (err) {
      return console.log(err);
    }
    let pdbObject = pdbStringToPdbObject(body)
    callback(pdbObject)
  });
}


module.exports = {
  fetch: fetch
};
