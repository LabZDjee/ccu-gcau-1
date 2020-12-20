/* jshint esversion: 6 */

import {
  analyzeAgcFile,
  findInAgcFileStruct,
} from "@labzdjee/agc-util";
import {
  agcFileData,
  reactiveData,
  selectChoicesAgcMap,
} from "./data";
import {
  toIntAsStr,
  setBitInHexString,
} from "./utils";

let debugOn = false; // will print on console every translated item when this one is on

const nodeEnv = process.env.NODE_ENV;

// given an object string and an attribute string in agcFileData will alter its value
// if value is undefined nothing happens, otherwise value should be a string
// in any case returns the value (before alteration)
function alterObjAttr(object, attribute, value) {
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
  if (value !== undefined && value !== null) {
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
  if (value !== undefined && value !== null) {
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

function zeroOne(falseTrue) {
  return falseTrue.toLowerCase() === "true" ? "1" : "0";
}

function setHexBitField(trueOrFalseStr, object, attribute, bitPos) {
  const hexString = alterObjAttr(object, attribute);
  const bool = trueOrFalseStr === "true";
  alterObjAttr(object, attribute, setBitInHexString(bool, bitPos, hexString));
}

export function translateCcu2gcau() {
  debugOn = false;
  if (agcFileData.struct === null) {
    // eslint-disable-next-line
    console.log("Attempt to call translateCcu2gcau on invalid agcFileData!");
    return;
  }
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
  alterMeta("AmbTemp", toIntAsStr(reactiveData.Edit_ENV_TA));
  alterMeta("MaxAltitude", toIntAsStr(reactiveData.Edit_ENV_ALT));
  const language = selectChoicesAgcMap.languages[reactiveData.Language];
  alterMeta("Lang2Ctrl", language);
  alterObjAttr("NOMINAL", "Language", language === "English" ? "E" : "L");
  alterObjAttr("REGISTRY", "LocalLanguage", language);
  alterMeta("Frequency", reactiveData.Combo_RN_FREQ);
  alterMeta("InrushCurrent", reactiveData.Combo_RN_CN);
  const chargerType = reactiveData.Combo_RN_NDP === "3" ? "TPRe" : "SPRe";
  const nominalVoltage = reactiveData.Combo_RN_UDC;
  const nominalCurrent = reactiveData.IdcNom;
  alterObjAttr("NOMINAL", "ChargerCurrent", toIntAsStr(nominalCurrent, 10));
  alterObjAttr("SYSTEM", "VoltageInRange", nominalVoltage);
  alterObjAttr("SYSTEM", "MaxCurrent", toIntAsStr(nominalCurrent, 10));
  const maxPowerAsFloat = 1.4 * parseFloat(nominalCurrent) * parseFloat(nominalVoltage);
  alterObjAttr("SYSTEM", "MaxPower", toIntAsStr(maxPowerAsFloat * 0.1));
  alterObjAttr("NOMINAL", "OutputPower", toIntAsStr(maxPowerAsFloat * 0.1));
  alterMeta("CstmChgName", `${nominalVoltage}V ${chargerType} ${nominalCurrent}A`);
  alterObjAttr("NOMINAL", "ACVolts", toIntAsStr(reactiveData.UacNom, 10));
  setHexBitField(reactiveData.AcMeter, "SYSVAR", "MeterEnable", 0);
  setHexBitField(reactiveData.AhMeterDisplay, "SYSVAR", "MeterEnable", 2);
  alterMeta("VLowLimit", reactiveData.Edit_DC_VMINDLT);
  alterMeta("VHighLimit", reactiveData.Edit_DC_VMAXDLT);
  alterMeta("IPeak", reactiveData.Edit_DC_PDC);
  alterMeta("IPeakDur", reactiveData.Edit_DC_DDLPDC);
  alterMeta("ILoadMOff", reactiveData.Edit_DC_CURA);
  alterMeta("ILoadMOn", reactiveData.Edit_DC_CURP);
  alterObjAttr("BATTSEL", "BatteryType", selectChoicesAgcMap.batteryType[reactiveData.Combo_DEF_TDB]);
  alterMeta("BattSubType", reactiveData.Combo_DEF_TDB);
  alterMeta("BatteryName", reactiveData.Edit_BattName);
  const nbOfCells = parseInt(reactiveData.NrOfCells);
  alterObjAttr("BATTSEL", "NumberOfElements", reactiveData.NrOfCells);
  alterMeta("BattnBCells", reactiveData.NrOfCells);
  alterObjAttr("BATTSEL", "Capacity", reactiveData.BattCapacity);
  alterMeta("ShortCircuitCurrent", reactiveData.Edit_DEF_CDCC);
  alterObjAttr("NOMINAL", "FloatVolts", toIntAsStr(reactiveData.UflPerCell, nbOfCells * 10));
  debugOn = true;

  alterObjAttr("REGCOMP", "TemperatureCompensation", reactiveData.TempComp === "true" ? toIntAsStr(reactiveData.CompPerC, 100) : "0");

}
