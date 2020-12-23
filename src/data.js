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
} from "./utils";

export const appVersion = "0.9.0";

export const tsvMap = {};
// property is this SetupParm and value is the associated TDSTag, e.g.:
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

export const selectChoicesAgcMap = {
  languages: {
    English: "French",
    Dutch: "Dutch",
    Spanish: "Spanish",
    Italian: "Italian",
    Finnish: "French",
    Swedish: "Swedish",
    French: "French",
    German: "German",
    Slovakian: "French",
    USA: "French",
    Norwegian: "French",
    Portuguese: "Portuguese",
  },
  batteryType: {
    "None": "0",
    "VO": "3",
    "Ni CD (SBH-SBM)": "1",
    "Ni CD (SBL)": "2",
    "Ni CD (SPH)": "2",
    "Ni CD (SLM)": "2",
    "Sealed lead acid": "0",
    "Open lead acid": "1",
  },
};

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
    "Portuguese",
  ],
  relayNumbers: generateNumericArray(17, x => x.toString()),
  hrPeriodicTimes: ["None", "1", "6", "12"],
  spareInputs: ["no", "active low", "active high"],
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
};

function initMeta() {
  reactiveData.meta_hasLedBox = "false";
  reactiveData.meta_duplicateRelays = "false";
  reactiveData.meta_earthFaultThreshold = "250";
  reactiveData.meta_shutdownThermostat = "true";
  reactiveData.meta_forcedFloatInput = selectChoices.spareInputs[0];
  reactiveData.meta_highrateInput = selectChoices.spareInputs[0];
  reactiveData.meta_commissioningInput = selectChoices.spareInputs[0];
  reactiveData.meta_alarmAcknowledgmentInput = selectChoices.spareInputs[0];
}

const importedFileName = {
  fullFileName: "", // example: abcdef.efg.tdsa
  shortFileName: "", // example: abcdef.efg
  extension: "", // example: .tdsa
};

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

export function processTdsFile(fileContents) {
  const lines = fileContents.toString().split("\n");
  const pattLabel = /<Label>(.*)<\/Label>/i;
  const pattData = /<Donnee>(.*)<\/Donnee>/i;
  const pattDataStart = /<Donnee>(.*)/i;
  const pattDataEnd = /(.*)<\/Donnee>/i;
  const commaFloatPattern = /(\d*),(\d*)/;
  const rightTrimPattern = /\s*$/;
  let label;
  let data;
  let partial;
  initMeta();
  lines.forEach((line) => {
    const trimmedLine = line.replace(rightTrimPattern, "");
    const resultLabel = trimmedLine.match(pattLabel);
    if (resultLabel) {
      label = resultLabel[1];
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
      if (tsvMap[label].P0Type === "float") {
        const matches = data.match(commaFloatPattern);
        if (matches) {
          data = `${matches[1]}.${matches[2]}`;
        }
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
}

function floatValueFromUint8Array(byteArrayBuffer, offset) {
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
    const byteArray = new Uint8Array(fileContentsAsArrayBuffer);
    const p0OffsetFieldName = byteArray.length === 600 ? "P0Offset" : "P0V1Offset";
    for (const key in tsvMap) {
      const tsvEntry = tsvMap[key];
      const p0TypeSplitter = /^(?:(.+):(.*))|(?:.*)$/.exec(tsvEntry.P0Type);
      const offset = parseInt(tsvEntry[p0OffsetFieldName], 10);
      if (p0TypeSplitter !== null) {
        const p0MajorType = p0TypeSplitter[p0TypeSplitter[1] === undefined ? 0 : 1];
        const p0AssociatedValue = p0TypeSplitter[2] === undefined ? NaN : parseInt(p0TypeSplitter[2], 10);
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
            dw = (grabWord(offset) + 65536 * grabWord(offset + 2));
            if (tsvEntry.TDSUnitAndScale === "h:3600:s") {
              dw = Math.round(dw / 3600.0);
            }
            value = dw.toString();
            break;
          case "float":
            value = floatValueFromUint8Array(byteArray, offset).toString();
            break;
          case "string":
            value = "";
            for (let i = 0; i < p0MajorType; i++) {
              const code = byteArray[offset + i];
              if (code > 0) {
                value += String.fromCharCode();
              } else {
                break;
              }
            }
            break;
        }
        if (value != null) {
          reactiveData[tsvEntry.SetupParam] = value;
        }
      }
      // eslint-disable-next-line
      console.log(tsvEntry.P0Type, tsvEntry[p0OffsetFieldName]);
    }

    // eslint-disable-next-line
    console.log(floatValueFromUint8Array(byteArray, 22));
  });
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
