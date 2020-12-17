/* jshint esversion: 6 */

import {
  analyzeAgcFile,
  findInAgcFileStruct,
} from "@labzdjee/agc-util";
import {
  agcFileData,
  reactiveData,
} from "./data";

let debugOn = false; // will print on console every translated item when this one is on

const nodeEnv = process.env.NODE_ENV;

// given an object string and an attribute string in agcFileData will alter its value
// if value is undefined nothing happens, otherwise value should be a string
// in any case returns the value (before alteration)
function alterAgcAttr(object, attribute, value) {
  const hit = findInAgcFileStruct({
    object,
    attribute,
  }, agcFileData.struct);
  if (hit === null) {
    // eslint-disable-next-line
    console.log(`cannot locate ${object}.${attribute} in GCAUConfigurationData of agcFileData!`);
    return null;
  }
  const previousValue = hit.value;
  if (value !== undefined) {
    hit.value = value;
    const newLineValue = `${object}.${hit.readOnly?"!":""}${attribute} = "${value}"`;
    agcFileData.lines[hit.line - 1] = newLineValue;
    if (nodeEnv === 'development' && debugOn) {
      // eslint-disable-next-line
      console.log(newLineValue);
    }
  }
  return previousValue;
}

// given a metaTag string located in GCAUConfigurationData within agcFileData
// will change its value. If meta tag in .agc file is $Order foe example,
// metaTag should be "Order"
// if value is undefined nothing happens, otherwise it should be a string
// parameter insert:
//  if true, will insert metaTag and value after the last existing metaTag (not altered)
//   also if value in composed LF substrings, each substring will be distributed as
//   many meta tags
//  if false, value will simply replace the first defined metaTag
// in any case returns the value (before alteration) as an array of strings
function alterMeta(metaTag, value, insert = false) {
  const hit = findInAgcFileStruct({
    metaTag,
  }, agcFileData.struct);
  if (hit === null) {
    // eslint-disable-next-line
    console.log(`cannot locate $${metaTag} in GCAUConfigurationData of agcFileData!`);
    return null;
  }
  const previousValue = hit.value;
  const firstHit = hit[0];
  const lastHit = hit[hit.length - 1];
  if (value !== undefined) {
    const lineValues = value.split("\n").map(v => {
      const contents = `$${metaTag} = "${v}"`;
      if (nodeEnv === 'development' && debugOn) {
        // eslint-disable-next-line
        console.log(contents);
      }
      return contents;
    });
    if (!insert) {
      firstHit.value = value;
      agcFileData.lines[firstHit.line - 1] = lineValues[0];
    } else {
      agcFileData.lines.splice(lastHit.line, 0, ...lineValues);
      agcFileData.struct = analyzeAgcFile(agcFileData.lines);
    }
  }
  return previousValue;
}

function zeroOne(trueFalse) {
  return trueFalse.toLowerCase() === "true" ? "1" : "0";
}

export function translateCcu2gcau() {
  debugOn = false;
  if (agcFileData.struct === null) {
    // eslint-disable-next-line
    console.log("Attempt to call translateCcu2gcau on invalid agcFileData!");
    return;
  }
  let temperatureCompensation = 0.0;
  if (reactiveData.TempComp === "true") {
    temperatureCompensation = parseFloat(reactiveData.CompPerC);
  }
  alterAgcAttr("REGCOMP", "TemperatureCompensation", Math.round(temperatureCompensation * 100).toString());
  alterMeta("ProjectName", reactiveData.Text_Nom);
  alterMeta("Origin", reactiveData.Text_Origine);
  alterMeta("Quotation", reactiveData.Text_Devis);
  alterMeta("Customer", reactiveData.Text_Client);
  alterMeta("Approved", zeroOne(reactiveData.Check_APP));
  alterMeta("ApproveName", reactiveData.Edit_CONTROL);
  alterMeta("Order", reactiveData.Text_Commande);
  alterMeta("Project", reactiveData.Text_Projet);
  alterMeta("EndUser", reactiveData.Text_ClientFinal);
  alterMeta("IDNum", reactiveData.SystemId);
  alterMeta("Notes", reactiveData.Edit_COMMENT, true);
  debugOn = true;
}
