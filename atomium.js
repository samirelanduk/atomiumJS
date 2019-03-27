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
      let number = line[1].slice(6).trim().split(" ")[0];
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
  updateDescriptionObject(pdbObject, dataObject);
  updateExperimentObject(pdbObject, dataObject);
  updateQualityObject(pdbObject, dataObject);
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


function updateExperimentObject(pdbObject, dataObject) {
  if ("EXPDTA" in pdbObject) {
    if (pdbObject.EXPDTA[0].slice(6).trim()) {
      dataObject.experiment.technique = pdbObject.EXPDTA[0].slice(6).trim()
    }
  }
  if ("SOURCE" in pdbObject) {
    let text = mergeLines(pdbObject.SOURCE, 10);
    patterns = {
     "sourceOrganism": /ORGANISM_SCIENTIFIC\: (.+?);/,
     "expressionSystem": /EXPRESSION_SYSTEM\: (.+?);/
    }
    for (key of Object.keys(patterns)) {
      let matches = patterns[key].exec(text);
      if (matches) {
        dataObject.experiment[key] = matches[1];
      }
    }
  }
}


function updateQualityObject(pdbObject, dataObject) {
  if ("REMARK" in pdbObject) {
    if ("2" in pdbObject.REMARK) {
      for (line of pdbObject.REMARK["2"]) {
        try {
          dataObject.quality.resolution = parseFloat(
            /RESOLUTION\.\s+(.+?) ANGSTROMS/.exec(line)[1]
          );
          break;
        } catch(error) {}
      }
    }
    if ("3" in pdbObject.REMARK) {
      patterns = {
       "rvalue": /R VALUE[ ]{2,}\(WORKING SET\) : (.+)/,
       "rfree": /FREE R VALUE[ ]{2,}: (.+)/
      }
      for (key of Object.keys(patterns)) {
        for (line of pdbObject.REMARK["3"]) {
          let matches = patterns[key].exec(line);
          if (matches) {
            dataObject.quality[key] = parseFloat(matches[1]);
          }
        }
      }
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
