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


function pdbObjectToDataObject(pdbObject) {
  dataObject = {
   "description": {
    "code": null, "title": null, "depositionDate": null,
    "classification": null, "keywords": [], "authors": []
   }, "experiment": {
    "technique": null, "sourceOrganism": null, "expressionSystem": null
   }, "quality": {"resolution": null, "rvalue": null, "rfree": null},
   "geometry": {"assemblies": []}, "models": []
  }
  updateDescriptionObject(pdbObject, dataObject)
  return dataObject;
}


function mergeLines(lines, start, join=" ") {
  let string = "";
  for (line of lines) {
    string += (line.slice(start).trim() + join);
  }
  string = string.slice(0, string.length - join.length);
  return string;
}


function updateDescriptionObject(pdbObject, dataObject) {
  if ("HEADER" in pdbObject) {
    let line = pdbObject.HEADER[0]
    if (line.slice(50, 59).trim()) {
      dataObject.description.depositionDate = Date.parse(line.slice(50, 59).trim())
    }
    if (line.slice(62, 66).trim()) {
      dataObject.description.code = line.slice(62, 66)
    }
    if (line.slice(10, 50).trim()) {
      dataObject.description.classification = line.slice(10, 50).trim()
    }
  }
  if ("TITLE" in pdbObject) {
    dataObject.description.title = mergeLines(pdbObject.TITLE, 10)
  }
  if ("KEYWDS" in pdbObject) {
    let text = mergeLines(pdbObject.KEYWDS, 10);
    for (keyword of text.split(",")) {
      dataObject.description.keywords.push(keyword.trim())
    }
  }
  if ("AUTHOR" in pdbObject) {
    let text = mergeLines(pdbObject.AUTHOR, 10);
    for (author of text.split(",")) {
      dataObject.description.authors.push(author.trim())
    }
  }
}


function fetch(code, callback) {
  request("https://files.rcsb.org/view/" + code + ".pdb", (err, res, body) => {
    if (err) {
      return console.log(err);
    }
    let pdbObject = pdbStringToPdbObject(body);
    let dataObject = pdbObjectToDataObject(pdbObject);
    callback(dataObject)
  });
}


module.exports = {
  fetch: fetch
};
