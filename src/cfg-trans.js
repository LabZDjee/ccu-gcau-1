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
  insertIntInSortedArray,
  extractListFromSortedArrayOfInts,
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

let usedRelays = [];
let usedLeds = [];

function setRelay(object, relayNumber, attributes /* ["RelayNumber", "NumberOfRelays", "LedNumber"] */ ) {
  if (attributes === undefined) {
    attributes = ["RelayNumber", "NumberOfRelays", "LedNumber"];
  }
  if (typeof relayNumber === "string") {
    relayNumber = parseInt(relayNumber, 10);
  }
  if (relayNumber < 1 || relayNumber > 16) {
    alterObjAttr(object, attributes[0], "0");
    alterObjAttr(object, attributes[1], "1");
    alterObjAttr(object, attributes[2], "0");
    return;
  }
  const ledNumber = reactiveData.meta_hasLedBox === "true" ? relayNumber : 0;
  if (relayNumber > 8) {
    relayNumber = 0;
  }
  if (reactiveData.meta_duplicatedRelays === "true" && relayNumber > 1) {
    relayNumber = 2 * relayNumber - 1;
  }
  alterObjAttr(object, attributes[0], relayNumber.toString());
  if (relayNumber > 0) {
    alterObjAttr(object, attributes[1], reactiveData.meta_duplicatedRelays === "true" ? "2" : "1");
    insertIntInSortedArray(relayNumber, usedRelays);
    if (reactiveData.meta_duplicatedRelays === "true") {
      insertIntInSortedArray(relayNumber + 1, usedRelays);
    }
  } else {
    alterObjAttr(object, attributes[1], "1");
  }
  if (ledNumber > 0) {
    insertIntInSortedArray(ledNumber, usedLeds);
  }
  alterObjAttr(object, attributes[2], ledNumber.toString());
}

// set AGC event 'num' (one based)
// with object 'evtDef' made of strings (all properties are optional):
//  {Function="OF", LCDLatch="0", RelayLatch="0", Shutdown="0", CommonAlarm="0", RelayNumber="0",
//   Delay=undefined, Value=undefined, Text=undefined, LocalText=undefined}
//   undefined properties do not set anything in the vent definition (left untouched)
// updateSysvar: will turn corresponding bit in SYSVAR.EventEnable to 0 or 1 depending on
//  FUNCTION being "OF" or not
function setEvt(num, evtDef, updateSysvar = true) {
  const evtName = `EVT_${num}`;
  if (evtDef.Function === undefined) {
    evtDef.Function = "OF";
  }
  if (evtDef.LCDLatch === undefined) {
    evtDef.LCDLatch = "0";
  }
  if (evtDef.RelayLatch === undefined) {
    evtDef.RelayLatch = "0";
  }
  if (evtDef.Shutdown === undefined) {
    evtDef.Shutdown = "0";
  }
  if (evtDef.CommonAlarm === undefined) {
    evtDef.CommonAlarm = "0";
  }
  if (evtDef.RelayNumber === undefined) {
    evtDef.RelayNumber = "0";
  }
  for (const attribute in evtDef) {
    if (attribute === "RelayNumber") {
      setRelay(evtName, evtDef[attribute]);
    } else {
      alterObjAttr(evtName, attribute, evtDef[attribute]);
    }
  }
  if (updateSysvar) {
    setHexBitField(evtDef.Function === "OF" ? "false" : "true", "SYSVAR", "EventEnable", num - 1);
  }
}

export function translateCcu2gcau() {
  debugOn = false;
  usedRelays = [];
  usedLeds = [];
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
  alterObjAttr("SYSVAR", "MenuGroupEnable", "2B3F");
  alterObjAttr("SYSVAR", "BatteryMenuEnable", "001F");
  alterObjAttr("SYSVAR", "NominalSetMenuEnable", "0067");
  alterObjAttr("SYSVAR", "MeterMenuEnable", "3F");
  alterObjAttr("SYSVAR", "HighrateMenuEnable", "11FF");
  alterObjAttr("SYSVAR", "CommissionMenuEnable", "001F");
  alterObjAttr("SYSVAR", "ManualAdjustMenuEnable", "0F");
  alterObjAttr("SYSVAR", "VOApplicationMenuEnable", "7F");
  alterObjAttr("SYSVAR", "BattTestMenuEnable", "027FF");
  alterObjAttr("SYSVAR", "CompensationMenuEnable", "0F");
  alterObjAttr("SYSVAR", "CommunicationMenuEnable", "17");
  alterObjAttr("SYSVAR", "PasswordMenuEnable", "03");
  alterObjAttr("SYSVAR", "MeterEnable", "07");
  alterObjAttr("SYSVAR", "SuperUserMenus", "3FFF");
  for (let i = 1; i <= 32; i++) {
    switch (i) {
      case 23: // TEMP SENSE ERROR
        setEvt(i, {
          Function: "AL",
        });
        break;
      case 24: // INTERNAL CHECK
        setEvt(i, {
          Function: "AL",
          LCDLatch: "1",
        });
        break;
      case 30: // NO PS VOLTAGE
        setEvt(i, {
          Function: "AL",
          Delay: "20",
        });
        break;
      default:
        setEvt(i, {
          Function: "OF",
        });
        break;
    }
  }
  alterObjAttr("NOMINAL", "Language", language === "English" ? "E" : "L");
  alterObjAttr("REGISTRY", "LocalLanguage", language);
  alterMeta("Frequency", reactiveData.Combo_RN_FREQ);
  alterMeta("InrushCurrent", reactiveData.Combo_RN_CN);
  const chargerShunt = 0.1 / parseFloat(reactiveData.RectShuntVal);
  alterObjAttr("SYSTEM", "ChargerShunt", Math.round(chargerShunt * 1e6).toString());
  alterObjAttr("SYSTEM", "RectShuntVolt", "100");
  const chargerType = reactiveData.Combo_RN_NDP === "3" ? "TPRe" : "SPRe";
  alterObjAttr("PID", "Mode", reactiveData.Combo_RN_NDP === "3" ? "TS" : "SS");
  const nominalVoltage = reactiveData.Combo_RN_UDC;
  const nominalCurrent = reactiveData.IdcNom;
  alterObjAttr("NOMINAL", "ChargerCurrent", toIntAsStr(nominalCurrent, 10));
  alterObjAttr("SYSTEM", "VoltageInRange", nominalVoltage);
  alterObjAttr("SYSTEM", "MaxCurrent", toIntAsStr(nominalCurrent, 10));
  const maxPowerAsFloat = 1.4 * parseFloat(nominalCurrent) * parseFloat(nominalVoltage);
  alterObjAttr("SYSTEM", "MaxPower", toIntAsStr(maxPowerAsFloat * 0.1));
  alterObjAttr("NOMINAL", "OutputPower", toIntAsStr(maxPowerAsFloat * 0.1));
  debugOn = true;
  alterMeta("CstmChgName", `${nominalVoltage}V ${chargerType} ${nominalCurrent}A`);
  alterObjAttr("HIGHVOLT", "ExternalDividers", (parseInt(nominalVoltage, 10) >= 200) ? "1" : "0");
  alterObjAttr("HIGHVOLT", "UNomDivider", "200");
  alterObjAttr("HIGHVOLT", "UProtDivider", "200");
  alterObjAttr("HIGHVOLT", "EFAlpha", "1453");
  alterObjAttr("HIGHVOLT", "EFBeta", "1219");
  alterObjAttr("HIGHVOLT", "EFGamma", "884");
  alterObjAttr("HIGHVOLT", "EFR3", "0");
  alterObjAttr("HIGHVOLT", "VLvdDivider", "200");
  debugOn = false;
  alterObjAttr("NOMINAL", "ACVolts", toIntAsStr(reactiveData.UacNom, 10));
  setHexBitField(reactiveData.AcMeter, "SYSVAR", "MeterEnable", 0);
  setHexBitField(reactiveData.AhMeterDisplay, "SYSVAR", "MeterEnable", 2);
  alterObjAttr("MANADJ", "ManualCurrentAdjustment", reactiveData.ManCurrAdjust === "true" ? "1" : "0");
  alterObjAttr("MANADJ", "ManualVoltageAdjustment", reactiveData.ManVoltAdjust === "true" ? "1" : "0");
  alterObjAttr("MANADJ", "LowerLimit", toIntAsStr(reactiveData.VoltAdjustMin, 10));
  alterObjAttr("MANADJ", "UpperLimit", toIntAsStr(reactiveData.VoltAdjustMax, 10));
  alterMeta("VLowLimit", reactiveData.Edit_DC_VMINDLT);
  alterMeta("VHighLimit", reactiveData.Edit_DC_VMAXDLT);
  alterMeta("IPeak", reactiveData.Edit_DC_PDC);
  alterMeta("IPeakDur", reactiveData.Edit_DC_DDLPDC);
  alterMeta("ILoadMOff", reactiveData.Edit_DC_CURA);
  alterMeta("ILoadMOn", reactiveData.Edit_DC_CURP);
  alterObjAttr("BATTSEL", "BatteryType", selectChoicesAgcMap.batteryType[reactiveData.Combo_DEF_TDB]);
  const isVOBatteryType = reactiveData.Combo_DEF_TDB === "VO";
  alterMeta("BattSubType", reactiveData.Combo_DEF_TDB);
  alterMeta("BatteryName", reactiveData.Edit_BattName);
  const nbOfCells = parseInt(reactiveData.NrOfCells, 10);
  alterObjAttr("BATTSEL", "NumberOfElements", reactiveData.NrOfCells);
  alterMeta("BattnBCells", reactiveData.NrOfCells);
  const batteryCapacity = parseFloat(reactiveData.BattCapacity);
  alterObjAttr("BATTSEL", "Capacity", reactiveData.BattCapacity);
  alterMeta("ShortCircuitCurrent", reactiveData.Edit_DEF_CDCC);
  alterObjAttr("NOMINAL", "FloatVolts", toIntAsStr(reactiveData.UflPerCell, nbOfCells * 10));
  alterObjAttr("REGCOMP", "TemperatureCompensation", reactiveData.TempComp === "true" ? toIntAsStr(reactiveData.CompPerC, 100) : "0");
  setHexBitField(reactiveData.TempComp, "SYSVAR", "MeterEnable", 3);
  alterObjAttr("SYSTEM", "TempCompOnBattSens", "0"); // legacy
  const batteryShunt = reactiveData.BattShunt === "true" ? 0.1 / parseFloat(reactiveData.BattShuntVal) : 0;
  alterObjAttr("SYSTEM", "BatteryShunt", Math.floor(batteryShunt * 1e6).toString());
  alterObjAttr("SYSTEM", "BattShuntVolt", "100");
  alterObjAttr("SYSTEM", "InRevPol", "0000");
  alterObjAttr("NOMINAL", "BatteryCurrent", toIntAsStr(reactiveData.IbattNom, 10));
  alterObjAttr("NOMINAL", "HighrateVolts", toIntAsStr(reactiveData.UhrPerCell, nbOfCells * 10));
  alterObjAttr("HIGHRATE", "TimerMode", reactiveData.ChrgTimerMode === "1" ? "D" : "P");
  alterObjAttr("HIGHRATE", "ManualHighrate", reactiveData.ManHrEnable === "true" ? "1" : "0");
  alterObjAttr("HIGHRATE", "Periodic", reactiveData.PeriodicHr === "None" ? "0" : reactiveData.PeriodicHr);
  setRelay("HIGHRATE", reactiveData.HrRelayOutput, ["RelayNb", "NumberOfRelays", "LedNb"]);
  alterObjAttr("HIGHRATE", "OnCurrentLimit", reactiveData.ClHrEnable === "true" ? reactiveData.ClHrTime : "0");
  alterObjAttr("HIGHRATE", "OnMainsFail", reactiveData.MfHrEnable === "true" ? reactiveData.MfHrTime : "0");
  alterObjAttr("HIGHRATE", "OnAhDrop", "0");
  alterObjAttr("HIGHRATE", "Timer", toIntAsStr(reactiveData.ChargeTime, 60));
  alterObjAttr("BATTSEL", "FanDelay", toIntAsStr(reactiveData.BattFanDelay, 60));
  setRelay("BATTSEL", reactiveData.HrRelayOutput, ["FanRelayNb", "FanNumberOfRelays", "FanLedNb"]);
  alterObjAttr("VOAPPL", "AmbTempTimeConstant", "480");
  alterObjAttr("VOAPPL", "AhMinDetection", "0");
  alterObjAttr("VOAPPL", "dTMin", toIntAsStr(reactiveData.DTmin));
  alterObjAttr("VOAPPL", "dTMax", toIntAsStr(reactiveData.DTmax));
  alterObjAttr("VOAPPL", "BattCurrentDetection", toIntAsStr(reactiveData.IbattLow, 10));
  alterObjAttr("VOAPPL", "Timer", toIntAsStr(reactiveData.VoChargeTime, 60));
  if (isVOBatteryType) {
    const voCurrentLimit = parseFloat(reactiveData.IbattLow);
    setHexBitField("true", "SYSVAR", "MenuGroupEnable", 6);
    setHexBitField("true", "SYSVAR", "MeterEnable", 3);
    setHexBitField("true", "SYSVAR", "MeterEnable", 4);
    let voSecurityTimer = 3 * (batteryCapacity / voCurrentLimit + parseFloat(reactiveData.VoChargeTime));
    if (voSecurityTimer > 36) {
      voSecurityTimer = 36;
    }
    alterObjAttr("VOAPPL", "SecurityTimer", (voSecurityTimer * 60).toString());
    alterMeta("Notes", `Warning: VO security timer arbitrary set at ${voSecurityTimer} hour${voSecurityTimer!==1?"s":""}! Okay with this?`, true);
  }
  alterObjAttr("COMMISS", "Manual", reactiveData.CommEnable === "true" ? "1" : "0");
  setRelay("COMMISS", reactiveData.CommRelayOutput, ["RelayNb", "NumberOfRelays", "LedNb"]);
  alterObjAttr("COMMISS", "Voltage", toIntAsStr(reactiveData.UcommPerCell, nbOfCells * 10));
  alterObjAttr("COMMISS", "Current", toIntAsStr(reactiveData.CommCurrent, 10));
  alterObjAttr("COMMISS", "Duration", toIntAsStr(reactiveData.CommTime, 60));
  const batteryTestEnabled = reactiveData.BattTestEnable === "true";
  alterObjAttr("BATTTEST", "BatteryTestActive", batteryTestEnabled ? "1" : "0");
  alterObjAttr("BATTTEST", "Periodic", batteryTestEnabled ? reactiveData.AutoTestPeriod : "0");
  alterObjAttr("BATTTEST", "DischargeCurrent", toIntAsStr(reactiveData.IbattNom, 10 / 2));
  alterObjAttr("BATTTEST", "Percentage", toIntAsStr(reactiveData.DischrgPercent));
  alterObjAttr("BATTTEST", "EndVoltage", toIntAsStr(reactiveData.TestEndVoltage, 10));
  if (batteryTestEnabled) {
    setHexBitField("true", "SYSVAR", "MenuGroupEnable", 7);
    alterMeta("Notes", "Warning: battery test enabled! Behavior from CCU may differ. Review settings & discuss with end user.");
  }
  if (reactiveData.meta_hasLedBox && usedLeds.length > 0) {
    alterMeta("Notes", `Has one LED box with LEDs: ${extractListFromSortedArrayOfInts(usedLeds)}`, true);
    alterMeta("NbLEDCards", "1");
  } else {
    alterMeta("NbLEDCards", "0");
  }
  if (usedRelays.length > 0) {
    if (reactiveData.meta_duplicatedRelays === "true") {
      alterMeta("Notes", "Relays are duplicated (1=>1~2, 2=>3~4,... 8=>15~16)!", true);
    }
    alterMeta("NbRelayCards", usedRelays.some(x => x > 8) ? "2" : "1");
    alterMeta("Notes", `Used relays: ${extractListFromSortedArrayOfInts(usedRelays)}`, true);
  } else {
    alterMeta("NbRelayCards", "0");
  }
}
