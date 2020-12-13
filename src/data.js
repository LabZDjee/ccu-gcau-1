/* jshint esversion: 6 */

import ReacTer from "@labzdjee/reac-ter";
import {
  analyzeAgcFile,
  findInAgcFileStruct,
} from "@labzdjee/agc-util";
import Vue from "vue";
import axios from "axios";
import {
  initVue,
} from "./main.js";

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
  relayNumbers: [...Array(17)].map((_, i) => i.toString()),
  hrPeriodicTimes: ["None", "1", "6", "12"],
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

function alterAgcAttr(object, attribute, value) {
  const hit = findInAgcFileStruct({
    object,
    attribute,
  }, agcFileData.struct);
  if (hit === null) {
    return;
  }
  hit.value = value;
  agcFileData.lines[hit.line - 1] = `${object}.${hit.readOnly?"!":""}${attribute} = "${value}"`;
}

export function translateCcu2gcau() {
  let temperatureCompensation = 0.0;
  if (reactiveData.TempComp === "true") {
    temperatureCompensation = parseFloat(reactiveData.CompPerC);
  }
  alterAgcAttr("REGCOMP", "TemperatureCompensation", Math.round(temperatureCompensation * 100).toString());
}

const _metaData = {
  testKey: "Text_Projet",
  testValue: "???",
};

Object.keys(_metaData).forEach((key) => {
  reactiveData.addProperty(_metaData, key, `meta_${key}`);
});

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
        const resulDataEnd = trimmedLine.match(pattDataEnd);
        if (resulDataEnd) {
          partial = false;
          reactiveData[label] = `${data}\r${resulDataEnd[1]}`;
        } else {
          data = `${data}\r${trimmedLine}`;
        }
      }
    }
  });
}

export let agcFileData = {
  struct: null,
  lines: null,
  error: null,
};

export function processAgcFile(data) {
  try {
    agcFileData.lines = data.split(/\r?\n/);
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
