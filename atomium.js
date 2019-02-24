var request = require("request");

function pdbStringToPdbDict(pdbString) {
  let pdbDict = {}
  let lines = [];
  for (var line of pdbString.split("\n")) {
      lines.push([line.slice(0, 6).trimEnd(), line.trimEnd()]);
  }
  let modelRecs = ["ATOM", "HETATM", "ANISOU", "MODEL", "TER", "ENDMDL"];
  let model = [];
  let in_model = false;
  for (var line of lines) {
    if (line[0] == "REMARK") {
      if (!("REMARK" in pdbDict)) {pdbDict.REMARK = {}}
      let number = line[1].trim().split(" ")[0];
      try {
        pdbDict.REMARK[number].push(line[1]);
      } catch(err) {
        pdbDict.REMARK[number] = [line[1]];
      }
    } else if (modelRecs.includes(line[0])) {
      if (!("MODEL" in pdbDict)) {pdbDict.MODEL = [[]]}
      if (line[0] == "ENDMDL") {
        pdbDict.MODEL.push([])
      } else if (line[0] != "MODEL") {
        pdbDict.MODEL[pdbDict.MODEL.length - 1].push(line[1])
      }
    } else {
      try {
        pdbDict[line[0]].push(line[1]);
      } catch(err) {
        pdbDict[line[0]] = [line[1]];
      }
    }
  }
  return pdbDict;
}

function fetch(code, callback) {
  request("https://files.rcsb.org/view/" + code + ".pdb", (err, res, body) => {
    if (err) {
      return console.log(err);
    }
    let pdbDict = pdbStringToPdbDict(body)
    callback(pdbDict)
  });
}


module.exports = {
  fetch: fetch
};
