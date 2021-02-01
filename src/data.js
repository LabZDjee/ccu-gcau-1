/* jshint esversion: 6 */

import Vue from "vue";
import axios from "axios";
import ReacTer from "@labzdjee/reac-ter";
import {
  analyzeAgcFile,
} from "@labzdjee/agc-util";
import {
  initVue,
} from "./main";
import {
  generateNumericArray,
  float32Endianess,
  isBetween,
  estimateAh,
} from "./utils";

export const applicationVersion = "0.9.18";

export const tsvMap = {};
// property is a SetupParm (if defined) and value is the associated TDSTag, e.g.:
//  TempComp: "Check_DEF_CET"
export const tdsAlias = {};

const privateTdsData = {};

export const reactiveData = new ReacTer();

export const dataKeys = [];
export const eventBus = new Vue({
  methods: {
    dataChanged(item) {
      this.$emit("item-should-update", item);
    },
  },
});

export const selectChoices = {
  languages: [
    "English",
    "Dutch",
    "Spanish",
    "Italian",
    "Finnish",
    "Swedish",
    "French",
    "German",
    "Slovakian",
    "USA",
    "Norwegian",
    "Portuguese CCU_N",
    "Free1 CCU_N",
    "Free2 CCU_N",
  ],
  relayNumbers: generateNumericArray(17, x => x.toString()),
  hrPeriodicTimes: ["None", "1", "6", "12"],
  spareInputs: ["no", "active low", "active high"],
  commissioningInput: ["no", "active low", "active high", "allowed low", "allowed high"],
  extendedLocalMenu: ["don't extend", "extend"],
  communicationType: ["None", "WinSparc", "2-wire RTU-Modbus", "NCS (ASCII-Modbus+SPG)"],
};

let initTdsDataDone = false;

function initTdsData() {
  if (initTdsDataDone === false) {
    Object.keys(tsvMap).forEach((key) => {
      privateTdsData[key] = null;
      reactiveData.addProperty(privateTdsData, key);
      const setupKey = tsvMap[key].SetupParam;
      if (setupKey.startsWith("x--") === false && setupKey !== key) {
        reactiveData.addProperty(privateTdsData, key, setupKey);
        tdsAlias[setupKey] = key;
        dataKeys.push(setupKey);
      }
      dataKeys.push(key);
    });
    initTdsDataDone = true;
  }
}

const _metaData = {
  // debug/test stuff
  testKey: "Text_Projet",
  testValue: "???",
  // hardware stuff
  hasLedBox: null, // from 1 to 16
  duplicatedRelays: null, // CCU relay 1 ... 8  => gCAU relays 1 and 2 ... 15 and 16
  earthFaultThreshold: null, // in Ohm per Volt
  shutdownThermostat: null, // to X8.3 of the gCAU
  forcedFloatInput: null, // CCU: X9.1, gCAU x8.4, etc
  highrateInput: null,
  commissioningInput: null,
  alarmAcknowledgmentInput: null,
  displayAmbientTemperature: null,
  displayBatteryTemperature: null,
  extendedLocalMenu: null,
  communicationType: null,
};

function initMeta() {
  function initOneMeta(name, value) {
    reactiveData[`meta_${name}`] = value;
    reactiveData.$watchers[`meta_${name}`].push(updateMetaNotes);
  }
  initOneMeta("hasLedBox", "false");
  initOneMeta("duplicatedRelays", "false");
  initOneMeta("earthFaultThreshold", "250");
  initOneMeta("shutdownThermostat", "false");
  initOneMeta("forcedFloatInput", selectChoices.spareInputs[0]);
  initOneMeta("highrateInput", selectChoices.spareInputs[0]);
  initOneMeta("commissioningInput", selectChoices.commissioningInput[0]);
  initOneMeta("alarmAcknowledgmentInput", selectChoices.spareInputs[0]);
  initOneMeta("displayAmbientTemperature", "false");
  initOneMeta("displayBatteryTemperature", "false");
  initOneMeta("extendedLocalMenu", selectChoices.extendedLocalMenu[0]);
  initOneMeta("communicationType", selectChoices.communicationType[0]);
}

const importedFileName = {
  fullFileName: "", // example: abcdef.efg.tdsa
  shortFileName: "", // example: abcdef.efg
  extension: "", // example: .tdsa
};

export function disabledFunctions() {
  function getValue(k) {
    const v = parseFloat(reactiveData[k]);
    if (isNaN(v)) {
      return 0;
    }
    return v;
  }
  const flVoltagePerCell = getValue("UflPerCell");
  const hrVoltagePerCell = getValue("UhrPerCell");
  const commVoltagePerCell = getValue("UcommPerCell");
  const highrate = hrVoltagePerCell < flVoltagePerCell || (reactiveData.ManHrEnable === "false" &&
    reactiveData.PeriodicHr === "None" &&
    reactiveData.ClHrEnable === "false" &&
    reactiveData.MfHrEnable === "false" &&
    reactiveData.meta_highrateInput === selectChoices.spareInputs[0]);
  const commissionning = commVoltagePerCell < flVoltagePerCell ||
    (reactiveData.CommEnable === "false" && reactiveData.meta_commissioningInput === selectChoices.commissioningInput[0]);
  const vo = reactiveData.VoApplEnable === "false";
  const batteryTest = reactiveData.BattTestEnable === "false";
  const manualAdjust = reactiveData.ManCurrAdjust === "false" && reactiveData.ManVoltAdjust === "false";
  const communications = reactiveData.meta_communicationType === selectChoices.communicationType[0];
  return {
    highrate,
    commissionning,
    vo,
    batteryTest,
    manualAdjust,
    communications,
  };
}

// used by battery capacity evaluator
function ahMultiplier() {
  function find(x) {
    return batteryType.indexOf(x) >= 0;
  }
  const batteryType = (reactiveData.Combo_DEF_TDB).toLowerCase();
  if (find("vo") || find("ni") || find("cd")) {
    return 5;
  }
  if (find("lead") || find("acid")) {
    return 10;
  }
  return 7.5;
}

// sets 'importedFileName' from 'fileName' (a file name without any path)
// a way to get 'importedFileName' is to call this function without arguments
export function setImportedFileName(fileName) {
  if (typeof fileName === "string") {
    const matches = /^(.*)(\..*)$/.exec(fileName);
    if (matches !== null) {
      importedFileName.fullFileName = matches[0];
      importedFileName.shortFileName = matches[1];
      importedFileName.extension = matches[2];
    } else {
      importedFileName.fullFileName = fileName;
      importedFileName.shortFileName = fileName;
      importedFileName.extension = "";
    }
  }
  return importedFileName;
}

Object.keys(_metaData).forEach((key) => {
  reactiveData.addProperty(_metaData, key, `meta_${key}`);
});

initMeta();

const metaNotesRegex = /[ ]*{meta}\n((?:.|\n)*){\/meta}\n?/;

function getMetaNotes() {
  const metaValues = reactiveData.Edit_COMMENT.match(metaNotesRegex);
  if (metaValues !== null) {
    const metaPairs = metaValues[1].split("\n");
    metaPairs.forEach(pair => {
      const mv = pair.match(/\$(\S+)\s*=\s*'(.*)'/);
      if (mv !== null) {
        reactiveData[`meta_${mv[1]}`] = mv[2];
      }
    });
  }
  return metaValues !== null;
}

function updateMetaNotes() {
  if (typeof reactiveData.Edit_COMMENT !== "string") {
    return;
  }
  const notes = reactiveData.Edit_COMMENT.replace(/[ ]*{meta}(.|\n)*{\/meta}\n/, "");
  const notesHasClosingNL = notes.substring(notes.length - 1) === "\n";
  reactiveData.Edit_COMMENT = `${notes}${notesHasClosingNL?"":"\n"}{meta}
 $hasLedBox = '${reactiveData.meta_hasLedBox}'
 $duplicatedRelays = '${reactiveData.meta_duplicatedRelays}'
 $earthFaultThreshold = '${reactiveData.meta_earthFaultThreshold}'
 $shutdownThermostat = '${reactiveData.meta_shutdownThermostat}'
 $forcedFloatInput = '${reactiveData.meta_forcedFloatInput}'
 $highrateInput = '${reactiveData.meta_highrateInput}'
 $commissioningInput = '${reactiveData.meta_commissioningInput}'
 $alarmAcknowledgmentInput = '${reactiveData.meta_alarmAcknowledgmentInput}'
 $displayAmbientTemperature = '${reactiveData.meta_displayAmbientTemperature}'
 $displayBatteryTemperature = '${reactiveData.meta_displayBatteryTemperature}'
 $extendedLocalMenu = '${reactiveData.meta_extendedLocalMenu}'
 $communicationType = '${reactiveData.meta_communicationType}'
{/meta}
`;
}

const tdsLabelsInSequence = [];

function numericTypeOfLabel(label) {
  if (["Note", "SetupType", "P0Type"].some(prop => tsvMap[label][prop].toLowerCase() === "float")) {
    return "float";
  }
  if (["Note", "SetupType"].some(prop => ["boolean", "byte", "word", "dword"].some(type => tsvMap[label][prop].toLowerCase() === type))) {
    return "integer";
  }
  return "non-numeric";
}

export function makeTdsFile() {
  updateMetaNotes();
  let contents = `<Projet>\r\n`;
  tdsLabelsInSequence.forEach(label => {
    contents += '  <Objet>\r\n';
    contents += `    <Label>${label}</Label>\r\n`;
    let value = reactiveData[label];
    if (label.startsWith("Check_")) {
      value = value === "true" ? "1" : "0";
    }
    if (label === "Edit_TFB_TEMPS" || label === "Edit_TEOTDFL_TEMPS") {
      try {
        const t = Math.round(parseFloat(value, 10) / 60);
        value = t.toString();
      } catch (e) {}
    }
    if (numericTypeOfLabel(label) === "float") {
      value = parseFloat(value);
      if (isNaN(value)) {
        value = "0.0";
      } else {
        const multiplier = 1e5;
        value = (Math.round(value * multiplier) / multiplier).toString();
      }
      const matches = value.match(/\s*(\d*)\.(\d*)\s*/);
      if (matches !== null) {
        if (matches[1] === "") {
          matches[1] = "0";
        }
        if (matches[2] === "") {
          matches[2] = "0";
        }
        value = `${matches[1]},${matches[2]}`;
      }
    }
    value = value.replace(/\n/g, "\r\n");
    contents += `    <Donnee>${value}</Donnee>\r\n`;
    contents += '  </Objet>\r\n';
  });
  contents += `</Projet>\r\n`;
  return contents;
}

export function processTdsFile(fileContents) {
  const lines = fileContents.toString().split("\n");
  const pattLabel = /<Label>(.*)<\/Label>/i;
  const pattData = /<Donnee>(.*)<\/Donnee>/i;
  const pattDataStart = /<Donnee>(.*)/i;
  const pattDataEnd = /(.*)<\/Donnee>/i;
  const commaFloatPattern = /\s*(\d*),(\d*)\s*/;
  const rightTrimPattern = /\s*$/;
  const shouldRecordLabelSequence = tdsLabelsInSequence.length === 0;
  let label;
  let data;
  let partial;
  initMeta();
  lines.forEach((line) => {
    const trimmedLine = line.replace(rightTrimPattern, "");
    const resultLabel = trimmedLine.match(pattLabel);
    if (resultLabel) {
      label = resultLabel[1];
      if (shouldRecordLabelSequence) {
        tdsLabelsInSequence.push(label);
      }
      partial = false;
    }
    const resultData = trimmedLine.match(pattData);
    if (resultData) {
      data = resultData[1];
      if (label === "Edit_TFB_TEMPS" || label === "Edit_TEOTDFL_TEMPS") {
        try {
          const t = parseInt(data, 10) * 60;
          data = t.toString();
        } catch (e) {}
      }
      if (label.startsWith("Check_") && data !== "true" && data !== "false") {
        if (data === "1") {
          data = "true";
        } else {
          data = "false";
        }
      }
      const matches = data.match(commaFloatPattern);
      switch (numericTypeOfLabel(label)) {
        case "float":
          if (matches) {
            data = `${matches[1]}.${matches[2]}`;
          }
          break;
        case "integer":
          if (matches) {
            data = Math.round(`${matches[1]}.${matches[2]}`).toString();
          }
          break;
      }
      if (["Note", "SetupType", "P0Type"].some(prop => tsvMap[label][prop].toLowerCase() === "float")) {

      }
      reactiveData[label] = data;
    } else {
      const resultDataStart = trimmedLine.match(pattDataStart);
      if (resultDataStart) {
        data = resultDataStart[1];
        partial = true;
      } else if (partial) {
        const resultDataEnd = trimmedLine.match(pattDataEnd);
        if (resultDataEnd) {
          partial = false;
          reactiveData[label] = `${data}\n${resultDataEnd[1]}`;
        } else {
          data = `${data}\n${trimmedLine}`;
        }
      }
    }
  });
  if (!getMetaNotes()) {
    updateMetaNotes();
  }
}

export let agcFileData = {
  struct: null,
  lines: null,
  error: null,
  refLines: null,
};

export function processAgcFile(data) {
  try {
    agcFileData.lines = data.split(/\r?\n/);
    agcFileData.refLines = data.split(/\r?\n/);
    agcFileData.struct = analyzeAgcFile(agcFileData.lines);
    agcFileData.error = null;
  } catch (e) {
    agcFileData.lines = null;
    agcFileData.struct = null;
    agcFileData.error = e;
  }
}

axios
  .get(`${process.env.BASE_URL}/TDSP0APPMap.tsv`)
  .then((response) => {
    const tsv = response.data;
    const lines = tsv.split("\n");
    const headers = lines[0].replace(/\r$/, "").split("\t");
    let key;
    let object;
    for (let i = 1; i < lines.length; i++) {
      object = {};
      const currentline = lines[i].replace(/\r$/, "").split("\t");
      for (let j = 0; j < headers.length; j++) {
        object[headers[j]] = currentline[j];
        if (headers[j] === "TDSTag") {
          key = currentline[j];
        }
      }
      if (key.length > 0 && key.startsWith("x--") === false) {
        tsvMap[key] = object;
      }
    }
    initTdsData();
    initVue();
    axios.get(`${process.env.BASE_URL}/template.tdsa`).then((reply) => {
      processTdsFile(reply.data);
    });
  })
  .catch((error) => {
    document.getElementById("app").innerHTML =
      "panic: cannot initialize app from definition files like TDSP0APPMap.tsv or template.tdsa";
    // eslint-disable-next-line
    console.log(error);
  });

const app2Language2tdsIndex = {
  English: 0,
  Dutch: 1,
  Spanish: 2,
  Italian: 3,
  Finnish: 4,
  Swedish: 5,
  French: 6,
  German: 7,
  Slovakian: 8,
  USA: 9,
  Norwegian: 10,
  Portuguese: 11,
  "Free 1": 12,
  "Free 2": 13,
};

// note: nbOfCells necessary because of the reactive system, as it is, involving Option_x_elemnt, Edit_QDB_NDB
//       needs a bulk refresh of them all in order to work well...
function postProcessDataGotFromP0orApp(nbOfCells) {
  reactiveData.Option_6_elemnt = "false";
  reactiveData.Option_3_elemnt = "false";
  reactiveData.Option_2_elemnt = "false";
  reactiveData.Option_1_elemnt = "true";
  reactiveData.NrOfCells = nbOfCells;
  reactiveData.Edit_QDB_NDB = nbOfCells;
  reactiveData.Option_DEF_POST = reactiveData.ChrgTimerMode === "0" ? "1" : "0";
  reactiveData.Text_Projet = `${importedFileName.shortFileName}`;
  reactiveData.Combo_RN_UDC = reactiveData.UdcNom;
  reactiveData.Edit_DC_VMAXDLT = reactiveData.HC_UpperLimit;
  reactiveData.Edit_DC_VMINDLT = reactiveData.LC_LowerLimit;
  reactiveData.Combo_RN_NDP = parseFloat(reactiveData.UacNom) < 280 ? "1" : "3";
  const fltPerCell = parseFloat(reactiveData.UflPerCell);
  if (reactiveData.VoApplEnable === "true") {
    reactiveData.Combo_DEF_TDB = "VO";
  } else if (isBetween(1.35, fltPerCell, 1.389)) {
    reactiveData.Combo_DEF_TDB = "Ni CD (SPH)";
  } else if (isBetween(1.39, fltPerCell, 1.4049)) {
    reactiveData.Combo_DEF_TDB = "Ni CD (SBH-SBM)";
  } else if (isBetween(1.405, fltPerCell, 1.4149)) {
    reactiveData.Combo_DEF_TDB = "Ni CD (SLM)";
  } else if (isBetween(1.415, fltPerCell, 1.43)) {
    reactiveData.Combo_DEF_TDB = "Ni CD (SBL)";
  } else if (isBetween(2.20, fltPerCell, 2.249)) {
    reactiveData.Combo_DEF_TDB = "Open lead acid";
  } else if (isBetween(2.25, fltPerCell, 2.35)) {
    reactiveData.Combo_DEF_TDB = "Sealed lead acid";
  } else {
    reactiveData.Combo_DEF_TDB = "None";
  }
  reactiveData.Edit_BattName = "--";
  reactiveData.Edit_COMMENT = `Import from ${importedFileName.extension} file type`;
  reactiveData.Edit_ENV_TA = "25";
  reactiveData.Edit_ENV_ALT = "0";
  if (reactiveData.BattCapacity === "0") {
    reactiveData.BattCapacity = estimateAh(reactiveData.IbattNom, ahMultiplier()).toString();
  }
}

function setNoBatteryTest() {
  reactiveData.BattTestEnable = "false";
  reactiveData.AutoTestPeriod = "12";
  reactiveData.DischrgPercent = "0";
  reactiveData.TestEndVoltage = "0";
  reactiveData.EndVoltageAlarm = "0";
}

// takes an ArrayBuffer and find value of a float (4 bytes) at any offset in this ArrayBuffer (not neccesarily aligned on 4)
function floatValueFromArrayBuffer(byteArrayBuffer, offset) {
  const arrayBuffer = new ArrayBuffer(4);
  const byteArray = new Uint8Array(arrayBuffer);
  for (let i = 0; i < 4; i++) {
    byteArray[float32Endianess[i]] = byteArrayBuffer[offset + i];
  }
  const floatArray = new Float32Array(arrayBuffer);
  return floatArray[0];
}

export function processP0File(fileContentsAsArrayBuffer) {
  axios.get(`${process.env.BASE_URL}/template.tdsa`).then((reply) => {
    processTdsFile(reply.data);
    reactiveData.BattCapacity = "0";
    let nbOfCells;
    const byteArray = new Uint8Array(fileContentsAsArrayBuffer);
    const p0OffsetFieldName = byteArray.length === 600 ? "P0Offset" : "P0V1Offset";
    if (p0OffsetFieldName === "P0V1Offset") {
      setNoBatteryTest();
    }
    for (const key in tsvMap) {
      const tsvEntry = tsvMap[key];
      const p0TypeSplitter = /^(?:(.+):(.*))|(?:.*)$/.exec(tsvEntry.P0Type);
      const offset = parseInt(tsvEntry[p0OffsetFieldName], 10);
      if (p0TypeSplitter !== null && offset < byteArray.length) { // some offsets are in excess (battery test for example with P0 v1)
        const p0MajorType = p0TypeSplitter[p0TypeSplitter[1] === undefined ? 0 : 1];
        const p0MinorType = p0TypeSplitter[2];
        const p0AssociatedValue = p0TypeSplitter[2] === undefined ? NaN : parseInt(p0MinorType, 10);
        const grabWord = (offset) => byteArray[offset] + 256 * byteArray[offset + 1];
        let value = null,
          dw;
        switch (p0MajorType) {
          case "byte":
            value = byteArray[offset].toString();
            break;
          case "bool16":
            value = grabWord(offset) ? "true" : "false";
            break;
          case "word":
            value = grabWord(offset).toString();
            break;
          case "word:bf":
            value = (grabWord(offset) & (1 << p0AssociatedValue)) ? "true" : "false";
            break;
          case "dword":
            if (p0MinorType === "hm") {
              dw = 60 * grabWord(offset) + grabWord(offset + 2);
            } else {
              dw = (grabWord(offset) + 65536 * grabWord(offset + 2));
            }
            if (tsvEntry.TDSUnitAndScale === "h:3600:s") {
              dw = Math.round(dw / 3600.0);
            } else if (tsvEntry.TDSUnitAndScale === "mn:60:s") {
              dw *= 60;
            }
            value = dw.toString();
            break;
          case "float":
            value = floatValueFromArrayBuffer(byteArray, offset).toString();
            break;
          case "string":
            value = "";
            for (let i = 0; i < p0AssociatedValue; i++) {
              const code = byteArray[offset + i];
              if (code > 0) {
                value += String.fromCharCode(code);
              } else {
                break;
              }
            }
            break;
        }
        if (value !== null) {
          if (tsvEntry.TDSUnitAndScale === ":language") {
            value = selectChoices.languages[parseInt(value, 10)];
          }
          if (tsvEntry.TDSUnitAndScale === "months:periodicHighRate") {
            value = selectChoices.hrPeriodicTimes[parseInt(value, 10)];
          }
          reactiveData[tsvEntry.SetupParam] = value;
          if (tsvEntry.SetupParam === "NrOfCells") {
            nbOfCells = value;
          }
        }
      }
    }
    postProcessDataGotFromP0orApp(nbOfCells);
  });
}

function appTransformValueIfNum(tsvRowObj, value) {
  const appType = typeof tsvRowObj.AppType === "string" ? tsvRowObj.AppType.toLowerCase() : null;
  if (appType !== null) {
    if (tsvRowObj.SetupType === "Boolean") {
      return value === "0" ? "false" : "true";
    }
    if (appType.startsWith("integer") || appType.startsWith("float")) {
      let multiplier = 1;
      if (appType === "integer:s2h") {
        multiplier = 1 / 3600;
      }
      const resultAsNum = parseFloat(value) * multiplier;
      if (isNaN(resultAsNum)) {
        return value;
      }
      if (appType.startsWith("integer")) {
        return Math.round(resultAsNum).toString();
      }
      return resultAsNum.toString();
    }
  }
  return value;
}

function getAppHrPeriodicity(value) {
  switch (value.toLowerCase()) {
    default:
      return ("None");
    case "1":
    case "one_month":
      return ("1");
    case "2":
    case "six_months":
      return ("6");
    case "3":
    case "one_year":
      return ("12");
  }
}

function getAppHrPostOrDirect(value) {
  switch (value.toLowerCase()) {
    default:
      return ("0");
    case "direct":
    case "1":
      return ("1");
  }
}

export function processAppFile(fileContents) {
  axios.get(`${process.env.BASE_URL}/template.tdsa`).then((reply) => {
    processTdsFile(reply.data);
    reactiveData.BattCapacity = "0";
    let nbOfCells = "1";
    const lines = fileContents.toString().split("\n");
    const pattern = /^\s*(\d+):\s+(.+)\s{2,}(.*)\r?$/;
    lines.forEach((line, offset) => {
      const match = pattern.exec(line);
      if (match !== null) {
        // eslint-disable-next-line
        const appPos = offset + 1;
        const appNum = match[1];
        const appName = match[2].trimRight();
        const appValue = match[3];
        for (const k in tsvMap) {
          if (tsvMap[k].AppNum === appNum) {
            const tsvRowObjet = tsvMap[k];
            //console.log(`${appName} = ${appValue} (${appTransformValueIfNum(tsvRowObjet, appValue)})`);
            switch (appName.toLowerCase()) {
              case "language":
                reactiveData.Language = selectChoices.languages[app2Language2tdsIndex[appValue]];
                break;
              case "periodichr":
                reactiveData.PeriodicHr = getAppHrPeriodicity(appValue);
                break;
              case "chrgtimermode":
                reactiveData.ChrgTimerMode = getAppHrPostOrDirect(appValue);
                break;
              case "nrofcells":
                nbOfCells = appValue;
                // no break on purpose: we need to assign value to reactiveData in this case too
                /* falls through */
                // eslint-disable-next-line
              case "S1_name":
              case "S2_name":
              case "S3_name":
              case "S4_name":
                reactiveData[tsvRowObjet.SetupParam] = appValue.substring(0, 16);
                break;
              default:
                reactiveData[tsvRowObjet.SetupParam.startsWith("x--") ? tsvRowObjet.TDSTag : tsvRowObjet.SetupParam] = appTransformValueIfNum(tsvRowObjet, appValue);
                break;
            }
            break;
          }
        }
      }
    });
    postProcessDataGotFromP0orApp(nbOfCells);
  });
}
