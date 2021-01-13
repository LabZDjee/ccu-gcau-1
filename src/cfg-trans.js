/* jshint esversion: 9 */

import {
  analyzeAgcFile,
  findInAgcFileStruct,
} from "@labzdjee/agc-util";
import {
  agcFileData,
  reactiveData,
  selectChoices,
  disabledFunctions,
} from "./data";
import {
  toIntAsStr,
  setBitInHexString,
  insertIntInSortedArray,
  extractListFromSortedArrayOfInts,
  getTimestampOfNow,
} from "./utils";

let debugOn = false; // will print on console every translated item when this one is on

const nodeEnv = process.env.NODE_ENV;

const selectChoicesAgcMap = {
  languages: {
    English: {
      upload: "French",
      nominal: "E",
    },
    Dutch: {
      upload: "Dutch",
      nominal: "L",
    },
    Spanish: {
      upload: "Spanish",
      nominal: "L",
    },
    Italian: {
      upload: "Italian",
      nominal: "L",
    },
    Finnish: {
      upload: "French",
      nominal: "E",
    },
    Swedish: {
      upload: "Swedish",
      nominal: "L",
    },
    French: {
      upload: "French",
      nominal: "L",
    },
    German: {
      upload: "German",
      nominal: "L",
    },
    Slovakian: {
      upload: "French",
      nominal: "E",
    },
    USA: {
      upload: "French",
      nominal: "E",
    },
    Norwegian: {
      upload: "French",
      nominal: "E",
    },
    "Portuguese CCU_N": {
      upload: "Portuguese",
      nominal: "L",
    },
    "Free1 CCU_N": {
      upload: "French",
      nominal: "E",
    },
    "Free2 CCU_N": {
      upload: "French",
      nominal: "E",
    },
  },
  batteryType: {
    "None": "2",
    "VO": "3",
    "Ni CD (SBH-SBM)": "2",
    "Ni CD (SBL)": "2",
    "Ni CD (SPH)": "2",
    "Ni CD (SLM)": "2",
    "Sealed lead acid": "0",
    "Open lead acid": "1",
  },
};

function getBatterySubType() {
  const {
    highrate,
  } = disabledFunctions();
  switch (reactiveData.Combo_DEF_TDB) {
    case "None":
      return "";
    case "VO":
      return "VOM battery";
    case "Ni CD (SBH-SBM)":
      return "SBH (SNH) or SBM (SNM)";
    case "Ni CD (SBL)":
      return "SBL (SNL)";
    case "Ni CD (SPH)":
      return "SPH";
    case "Ni CD (SLM)":
      return "SLM";
    case "Sealed lead acid":
      return highrate ? "Single rate charge" : "Generic";
    case "Open lead acid":
      return highrate ? "Generic" : "Dual rate charge (OPZS)";
    default:
      return "";
  }
}

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
// in any case returns the array returned by findInAgcFileStruct (after a potential alteration)
function alterMeta(metaTag, value, insert = false) {
  const hit = findInAgcFileStruct({
    metaTag,
  }, agcFileData.struct);
  if (hit === null) {
    // eslint-disable-next-line
    console.log(`cannot locate $${metaTag} in GCAUConfigurationData of agcFileData!`);
    return null;
  }
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
  return hit;
}

function zeroOne(falseTrue) {
  if (falseTrue === undefined) {
    // eslint-disable-next-line
    console.log("Failure in call to function zeroOne!");
  }
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
//   undefined properties do not set anything in the event definition (left untouched)
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
    if (attribute === "Text" || attribute === "LocalText") {
      if (evtDef.Function === "OF" && updateSysvar) {
        continue;
      }
    }
    if (attribute === "RelayNumber") {
      setRelay(evtName, (evtDef.Function === "OF" && updateSysvar) ? "0" : evtDef[attribute]);
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
  if (reactiveData.Text_Origine.toLowerCase().indexOf("saft power system") >= 0) {
    alterMeta("Origin", "AEG Power Solutions");
  }
  alterMeta("Quotation", reactiveData.Text_Devis);
  alterMeta("Customer", reactiveData.Text_Client);
  alterMeta("Approved", zeroOne(reactiveData.Check_APP));
  alterMeta("ApproveName", reactiveData.Edit_CONTROL);
  alterMeta("Order", reactiveData.Text_Commande);
  const projectReferenceDef = {
    object: "REGISTRY",
    attribute: "ProjectReference",
  };
  if (findInAgcFileStruct(projectReferenceDef, agcFileData.struct) !== null) {
    alterObjAttr(projectReferenceDef.object, projectReferenceDef.attribute, reactiveData.Text_Commande.substring(0, 16));
  }
  alterMeta("Project", reactiveData.Text_Projet);
  alterMeta("EndUser", reactiveData.Text_ClientFinal);
  alterMeta("IDNum", reactiveData.SystemId);
  alterMeta("VInterfCard", "1");
  if (parseFloat(reactiveData.UacNom) != 0) {
    let inputCurrent = parseFloat(reactiveData.Label_DEF_TDFLPETOT2) * parseFloat(reactiveData.IdcNom) / 0.8 / 0.8 / parseFloat(reactiveData.UacNom);
    inputCurrent = Math.round(10 * inputCurrent) / 10;
    alterMeta("InputCurrent", inputCurrent.toString());
  }
  let noNotes = false;
  const initialNotes = alterMeta("Notes");
  if (initialNotes.length === 1 && initialNotes[0].value.trim().length === 0) {
    noNotes = true;
  }
  alterMeta("Notes", "Translated from a CCU configuration", noNotes ? false : true);
  reactiveData.Edit_COMMENT.split("\n").forEach(str => {
    alterMeta("Notes", str, true);
  });
  alterMeta("AmbTemp", (Math.round(reactiveData.Edit_ENV_TA * 10) / 10).toString());
  alterMeta("MaxAltitude", Math.round(reactiveData.Edit_ENV_ALT).toString());
  alterMeta("DerateTemp", (-parseFloat(reactiveData.Label_Derating_temp)).toString());
  alterMeta("DerateAltitude", (-parseFloat(reactiveData.Label_Derating_ALT)).toString());
  alterMeta("Lang2Ctrl", selectChoicesAgcMap.languages[reactiveData.Language].upload);
  alterObjAttr("NOMINAL", "Language", selectChoicesAgcMap.languages[reactiveData.Language].nominal);
  alterObjAttr("REGISTRY", "LocalLanguage", selectChoicesAgcMap.languages[reactiveData.Language].upload);
  if (reactiveData.meta_extendedLocalMenu !== selectChoices.extendedLocalMenu[0]) {
    alterObjAttr("SYSVAR", "MenuGroupEnable", "293F");
    alterObjAttr("SYSVAR", "BatteryMenuEnable", "001F");
    alterObjAttr("SYSVAR", "NominalSetMenuEnable", "0067");
    alterObjAttr("SYSVAR", "MeterMenuEnable", "3F");
    alterObjAttr("SYSVAR", "HighrateMenuEnable", "11FF");
    alterObjAttr("SYSVAR", "CommissionMenuEnable", "001F");
    alterObjAttr("SYSVAR", "ManualAdjustMenuEnable", "0F");
    alterObjAttr("SYSVAR", "VOApplicationMenuEnable", "7F");
    alterObjAttr("SYSVAR", "BattTestMenuEnable", "03FF");
    alterObjAttr("SYSVAR", "CompensationMenuEnable", "0F");
    alterObjAttr("SYSVAR", "PasswordMenuEnable", "03");
    alterObjAttr("SYSVAR", "SuperUserMenus", "7FFF");
  }
  setHexBitField("false", "SYSVAR", "MenuGroupEnable", 9);
  alterObjAttr("SYSVAR", "MeterEnable", "02");
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
  alterMeta("Frequency", reactiveData.Combo_RN_FREQ);
  alterMeta("InrushCurrent", reactiveData.Edit_RN_CN);
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
  alterMeta("CstmChgName", `${nominalVoltage}V ${chargerType} ${nominalCurrent}A`);
  alterObjAttr("HIGHVOLT", "ExternalDividers", (parseInt(nominalVoltage, 10) >= 200) ? "1" : "0");
  alterObjAttr("HIGHVOLT", "UNomDivider", "200");
  alterObjAttr("HIGHVOLT", "UProtDivider", "200");
  alterObjAttr("HIGHVOLT", "EFAlpha", "1453");
  alterObjAttr("HIGHVOLT", "EFBeta", "1219");
  alterObjAttr("HIGHVOLT", "EFGamma", "884");
  alterObjAttr("HIGHVOLT", "EFR3", "0");
  alterObjAttr("HIGHVOLT", "VLvdDivider", "200");
  alterObjAttr("NOMINAL", "ACVolts", toIntAsStr(reactiveData.UacNom, 10));
  setHexBitField(reactiveData.AcMeter, "SYSVAR", "MeterEnable", 0);
  setHexBitField(reactiveData.AhMeterDisplay, "SYSVAR", "MeterEnable", 2);
  alterObjAttr("MANADJ", "ManualCurrentAdjustment", zeroOne(reactiveData.ManCurrAdjust));
  alterObjAttr("MANADJ", "ManualVoltageAdjustment", zeroOne(reactiveData.ManVoltAdjust));
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
  alterMeta("BattSubType", getBatterySubType());
  alterMeta("BatteryName", reactiveData.Edit_BattName);
  const nbOfCells = parseInt(reactiveData.NrOfCells, 10);
  alterObjAttr("BATTSEL", "NumberOfElements", reactiveData.NrOfCells);
  alterObjAttr("BATTSEL", "SymmProbePosition", toIntAsStr(reactiveData.NrOfCells, 0.5));
  alterMeta("BattnBCells", reactiveData.NrOfCells);
  const batteryCapacity = parseFloat(reactiveData.BattCapacity);
  alterObjAttr("BATTSEL", "Capacity", reactiveData.BattCapacity);
  alterMeta("ShortCircuitCurrent", reactiveData.Edit_DEF_CDCC);
  alterObjAttr("NOMINAL", "FloatVolts", toIntAsStr(reactiveData.UflPerCell, nbOfCells * 10));
  alterObjAttr("REGCOMP", "TemperatureCompensation", reactiveData.TempComp === "true" ? toIntAsStr(reactiveData.CompPerC, 100) : "0");
  alterObjAttr("SYSTEM", "TempCompOnBattSens", "0"); // legacy
  setHexBitField(reactiveData.meta_displayAmbientTemperature, "SYSVAR", "MeterEnable", 3);
  setHexBitField(reactiveData.meta_displayBatteryTemperature, "SYSVAR", "MeterEnable", 4);
  setHexBitField(reactiveData.meta_displayAmbientTemperature, "SYSVAR", "MeterMenuEnable", 3);
  setHexBitField(reactiveData.meta_displayBatteryTemperature, "SYSVAR", "MeterMenuEnable", 4);
  setHexBitField("true", "SYSVAR", "MeterMenuEnable", 5);
  const battShuntValInAmps = parseFloat(reactiveData.BattShuntVal);
  let batteryShunt = null;
  if (!isNaN(battShuntValInAmps) && battShuntValInAmps > 0 && reactiveData.BattShunt === "true") {
    batteryShunt = 0.1 / battShuntValInAmps;
  }
  alterObjAttr("SYSTEM", "BatteryShunt", batteryShunt !== null ? Math.floor(batteryShunt * 1e6).toString() : "0");
  alterObjAttr("SYSTEM", "BattShuntVolt", "100");
  alterObjAttr("SYSTEM", "InRevPol", "0000");
  alterObjAttr("NOMINAL", "BatteryCurrent", toIntAsStr(reactiveData.IbattNom, 10));
  let uhrPerCell = parseFloat(reactiveData.UhrPerCell);
  if (isNaN(uhrPerCell) || uhrPerCell <= 0) {
    uhrPerCell = parseFloat(reactiveData.UflPerCell);
  }
  alterObjAttr("NOMINAL", "HighrateVolts", toIntAsStr(uhrPerCell, nbOfCells * 10));
  alterObjAttr("HIGHRATE", "TimerMode", reactiveData.ChrgTimerMode === "1" ? "D" : "P");
  alterObjAttr("HIGHRATE", "ManualHighrate", zeroOne(reactiveData.ManHrEnable));
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
  alterObjAttr("VOAPPL", "AhMinDetection", "0");
  if (isVOBatteryType) {
    const voCurrentLimit = parseFloat(reactiveData.IbattNom);
    if (reactiveData.meta_extendedLocalMenu !== selectChoices.extendedLocalMenu[0]) {
      setHexBitField("true", "SYSVAR", "MenuGroupEnable", 6);
    }
    let voSecurityTimer = 3 * (batteryCapacity / voCurrentLimit + parseFloat(reactiveData.VoChargeTime));
    if (voSecurityTimer > 36) {
      voSecurityTimer = 36;
    }
    alterObjAttr("VOAPPL", "SecurityTimer", (voSecurityTimer * 60).toString());
    alterMeta("Notes", `Warning: VO security timer arbitrary set at ${voSecurityTimer} hour${voSecurityTimer!==1?"s":""}! Okay with this?`, true);
  }
  alterObjAttr("COMMISS", "Manual", reactiveData.CommEnable === "true" ? "1" : "0");
  setRelay("COMMISS", reactiveData.CommRelayOutput, ["RelayNb", "NumberOfRelays", "LedNb"]);
  let ucommPerCell = parseFloat(reactiveData.UcommPerCell);
  if (isNaN(ucommPerCell) || ucommPerCell <= 0) {
    ucommPerCell = parseFloat(reactiveData.UflPerCell);
  }
  alterObjAttr("COMMISS", "Voltage", toIntAsStr(ucommPerCell, nbOfCells * 10));
  alterObjAttr("COMMISS", "Current", toIntAsStr(reactiveData.CommCurrent, 10));
  alterObjAttr("COMMISS", "Duration", toIntAsStr(reactiveData.CommTime, 60));
  const batteryTestEnabled = reactiveData.BattTestEnable === "true";
  alterObjAttr("BATTTEST", "BatteryTestActive", batteryTestEnabled ? "1" : "0");
  alterObjAttr("BATTTEST", "Periodic", batteryTestEnabled ? reactiveData.AutoTestPeriod : "0");
  alterObjAttr("BATTTEST", "DischargeCurrent", toIntAsStr(reactiveData.IbattNom, 10 / 2));
  alterObjAttr("BATTTEST", "Percentage", toIntAsStr(reactiveData.DischrgPercent));
  alterObjAttr("BATTTEST", "EndVoltage", toIntAsStr(reactiveData.TestEndVoltage, 10));
  if (batteryTestEnabled) {
    if (reactiveData.meta_extendedLocalMenu !== selectChoices.extendedLocalMenu[0]) {
      setHexBitField("true", "SYSVAR", "MenuGroupEnable", 7);
    }
    alterMeta("Notes", "Warning: battery test enabled! Behavior from CCU may differ. Review settings & discuss with end user.", true);
  }
  const commonAlarmEnabled = zeroOne(reactiveData.CM_Enabled);
  const mfEvtDef = { // mains out-of-range
    LCDLatch: zeroOne(reactiveData.MF_LcdLatch),
    RelayLatch: zeroOne(reactiveData.MF_RelayLatch),
    Shutdown: zeroOne(reactiveData.MfShtdnEnable),
    CommonAlarm: commonAlarmEnabled,
    RelayNumber: reactiveData.MF_RelayOutput,
    Delay: reactiveData.MF_Delay,
  };
  if (reactiveData.MF_Enabled === "true") {
    const evtDef = {
      ...mfEvtDef,
      Function: "AL",
    };
    setEvt(1, {
      ...evtDef,
      Value: toIntAsStr(reactiveData.MF_UpperLimit, 10),
    });
    setEvt(2, {
      ...evtDef,
      Value: toIntAsStr(reactiveData.MF_LowerLimit, 10),
    });
  } else {
    const evtDef = {
      ...mfEvtDef,
      Function: "OF",
    };
    setEvt(1, {
      ...evtDef,
      Value: toIntAsStr(reactiveData.MF_UpperLimit, 10),
    });
    setEvt(2, {
      ...evtDef,
      Value: toIntAsStr(reactiveData.MF_LowerLimit, 10),
    });
  }
  const hcEvtDef = { // high charger voltage
    LCDLatch: zeroOne(reactiveData.HC_LcdLatch),
    RelayLatch: zeroOne(reactiveData.HC_RelayLatch),
    Shutdown: zeroOne(reactiveData.HvShtdnEnable),
    CommonAlarm: commonAlarmEnabled,
    RelayNumber: reactiveData.HC_RelayOutput,
    Delay: reactiveData.HC_Delay,
    Value: toIntAsStr(reactiveData.HC_LowerLimit, 10),
  };
  setEvt(4, {
    ...hcEvtDef,
    Function: reactiveData.HC_Enabled === "true" ? "AL" : "OF",
  });
  const lcEvtDef = { // low charger voltage
    LCDLatch: zeroOne(reactiveData.LC_LcdLatch),
    RelayLatch: zeroOne(reactiveData.LC_RelayLatch),
    Shutdown: "0",
    CommonAlarm: commonAlarmEnabled,
    RelayNumber: reactiveData.LC_RelayOutput,
    Delay: reactiveData.LC_Delay,
    Value: toIntAsStr(reactiveData.LC_LowerLimit, 10),
  };
  setEvt(5, {
    ...lcEvtDef,
    Function: reactiveData.LC_Enabled === "true" ? "AL" : "OF",
  });
  const hdEvtDef = { // high dc load voltage
    LCDLatch: zeroOne(reactiveData.HD_LcdLatch),
    RelayLatch: zeroOne(reactiveData.HD_RelayLatch),
    Shutdown: "0",
    CommonAlarm: commonAlarmEnabled,
    RelayNumber: reactiveData.HD_RelayOutput,
    Delay: reactiveData.HD_Delay,
    Value: toIntAsStr(reactiveData.HD_UpperLimit, 10),
  };
  setEvt(6, {
    ...hdEvtDef,
    Function: reactiveData.HD_Enabled === "true" ? "AL" : "OF",
  });
  const ldEvtDef = { // low dc load voltage
    LCDLatch: zeroOne(reactiveData.LD_LcdLatch),
    RelayLatch: zeroOne(reactiveData.LD_RelayLatch),
    Shutdown: "0",
    CommonAlarm: commonAlarmEnabled,
    RelayNumber: reactiveData.LD_RelayOutput,
    Delay: reactiveData.LD_Delay,
    Value: toIntAsStr(reactiveData.LD_LowerLimit, 10),
  };
  setEvt(7, {
    ...ldEvtDef,
    Function: reactiveData.LD_Enabled === "true" ? "AL" : "OF",
  });
  const rfEvtDef = { // rectifier fault
    LCDLatch: zeroOne(reactiveData.RF_LcdLatch),
    RelayLatch: zeroOne(reactiveData.RF_RelayLatch),
    Shutdown: zeroOne(reactiveData.RfShtdnEnable),
    CommonAlarm: commonAlarmEnabled,
    RelayNumber: reactiveData.RF_RelayOutput,
    Delay: reactiveData.RF_Delay,
  };
  setEvt(3, {
    ...rfEvtDef,
    Function: reactiveData.RF_Enabled === "true" ? "AL" : "OF",
  });
  const earthFaultThresholdForAgc = toIntAsStr(reactiveData.meta_earthFaultThreshold, parseFloat(nominalVoltage) / 100);
  const efpEvtDef = { // earth fault +
    LCDLatch: zeroOne(reactiveData.EFP_LcdLatch),
    RelayLatch: zeroOne(reactiveData.EFP_RelayLatch),
    Shutdown: "0",
    CommonAlarm: commonAlarmEnabled,
    RelayNumber: reactiveData.EFP_RelayOutput,
    Delay: reactiveData.EFP_Delay,
    Value: earthFaultThresholdForAgc,
  };
  setEvt(8, {
    ...efpEvtDef,
    Function: reactiveData.EFP_Enabled === "true" ? "AL" : "OF",
  });
  const efmEvtDef = { // earth fault -
    LCDLatch: zeroOne(reactiveData.EFM_LcdLatch),
    RelayLatch: zeroOne(reactiveData.EFM_RelayLatch),
    Shutdown: "0",
    CommonAlarm: commonAlarmEnabled,
    RelayNumber: reactiveData.EFM_RelayOutput,
    Delay: reactiveData.EFM_Delay,
    Value: earthFaultThresholdForAgc,
  };
  setEvt(9, {
    ...efmEvtDef,
    Function: reactiveData.EFM_Enabled === "true" ? "AL" : "OF",
  });
  const s1EvtDef = { // spare 1
    LCDLatch: zeroOne(reactiveData.S1_LcdLatch),
    RelayLatch: zeroOne(reactiveData.S1_RelayLatch),
    Shutdown: "0",
    CommonAlarm: commonAlarmEnabled,
    RelayNumber: reactiveData.S1_RelayOutput,
    Delay: reactiveData.S1_Delay,
    Value: "0",
    Text: reactiveData.S1_Text,
    LocalText: reactiveData.S1_Text,
  };
  setEvt(10, {
    ...s1EvtDef,
    Function: reactiveData.S1_Enabled === "true" ? "AL" : "OF",
  });
  const s2EvtDef = { // spare 2
    LCDLatch: zeroOne(reactiveData.S2_LcdLatch),
    RelayLatch: zeroOne(reactiveData.S2_RelayLatch),
    Shutdown: "0",
    CommonAlarm: commonAlarmEnabled,
    RelayNumber: reactiveData.S2_RelayOutput,
    Delay: reactiveData.S2_Delay,
    Value: "0",
    Text: reactiveData.S2_Text,
    LocalText: reactiveData.S2_Text,
  };
  setEvt(11, {
    ...s2EvtDef,
    Function: reactiveData.S2_Enabled === "true" ? "AL" : "OF",
  });
  const s3EvtDef = { // spare 3
    LCDLatch: zeroOne(reactiveData.S3_LcdLatch),
    RelayLatch: zeroOne(reactiveData.S3_RelayLatch),
    Shutdown: "0",
    CommonAlarm: commonAlarmEnabled,
    RelayNumber: reactiveData.S3_RelayOutput,
    Delay: reactiveData.S3_Delay,
    Value: "0",
    Text: reactiveData.S3_Text,
    LocalText: reactiveData.S3_Text,
  };
  setEvt(12, {
    ...s3EvtDef,
    Function: reactiveData.S3_Enabled === "true" ? "AL" : "OF",
  });
  const s4EvtDef = { // spare 4
    LCDLatch: zeroOne(reactiveData.S4_LcdLatch),
    RelayLatch: zeroOne(reactiveData.S4_RelayLatch),
    Shutdown: "0",
    CommonAlarm: commonAlarmEnabled,
    RelayNumber: reactiveData.S4_RelayOutput,
    Delay: reactiveData.S4_Delay,
    Value: "0",
    Text: reactiveData.S4_Text,
    LocalText: reactiveData.S4_Text,
  };
  setEvt(13, {
    ...s4EvtDef,
    Function: reactiveData.S4_Enabled === "true" ? "AL" : "OF",
  });
  const htEvtDef = { // high temperature (on SCR bridge)
    LCDLatch: zeroOne(reactiveData.HT_LcdLatch),
    RelayLatch: zeroOne(reactiveData.HT_RelayLatch),
    Shutdown: "0",
    CommonAlarm: commonAlarmEnabled,
    RelayNumber: reactiveData.HT_RelayOutput,
    Delay: reactiveData.HT_Delay,
  };
  setEvt(22, {
    ...htEvtDef,
    Function: reactiveData.HT_Enabled === "true" ? "AL" : "OF",
  });
  const hbEvtDef = { // high battery current
    LCDLatch: zeroOne(reactiveData.HB_LcdLatch),
    RelayLatch: zeroOne(reactiveData.HB_RelayLatch),
    Shutdown: "0",
    CommonAlarm: commonAlarmEnabled,
    RelayNumber: reactiveData.HB_RelayOutput,
    Delay: reactiveData.HB_Delay,
    Value: toIntAsStr(reactiveData.HB_UpperLimit, 10),
  };
  setEvt(21, {
    ...hbEvtDef,
    Function: reactiveData.HB_Enabled === "true" ? "AL" : "OF",
  });
  const hrEvtDef = { // high rectifier/charger current
    LCDLatch: zeroOne(reactiveData.HR_LcdLatch),
    RelayLatch: zeroOne(reactiveData.HR_RelayLatch),
    Shutdown: "0",
    CommonAlarm: commonAlarmEnabled,
    RelayNumber: reactiveData.HR_RelayOutput,
    Delay: reactiveData.HR_Delay,
    Value: toIntAsStr(reactiveData.HR_UpperLimit, 10),
  };
  setEvt(20, {
    ...hrEvtDef,
    Function: reactiveData.HR_Enabled === "true" ? "AL" : "OF",
  });
  alterObjAttr("COMMISS", "AllowedFromSpare", "0");
  [{
    cmd: "FF",
    select: reactiveData.meta_forcedFloatInput,
  }, {
    cmd: "HC",
    select: reactiveData.meta_highrateInput,
  }, {
    cmd: "CC",
    select: reactiveData.meta_commissioningInput,
  }, {
    cmd: "AA",
    select: reactiveData.meta_alarmAcknowledgmentInput,
  }].forEach(({
    cmd,
    select,
  }, idx) => {
    let inv;
    let msg = `INPUT X9.${idx+1}`;
    if (cmd === "CC") {
      if (select === selectChoices.commissioningInput[3] || select === selectChoices.commissioningInput[4]) {
        cmd = "AL";
        msg = "COMMISS.";
        inv = select === selectChoices.commissioningInput[4] ? "true" : "false";
      }
    } else {
      inv = select === selectChoices.commissioningInput[2] ? "true" : "false";
    }
    setEvt(idx + 14, {
      LCDLatch: "0",
      RelayLatch: "0",
      Shutdown: "0",
      CommonAlarm: "0",
      RelayNumber: "0",
      Delay: "1",
      Text: msg,
      LocalText: msg,
      Function: select === selectChoices.spareInputs[0] ? "OF" : cmd,
    }, false);
    setHexBitField(inv, "SYSTEM", "InRevPol", idx + 4);
    setHexBitField("true", "SYSVAR", "EventEnable", idx + 13);
    if (cmd === "AL") {
      setHexBitField("true", "SYSVAR", "CommissionMenuEnable", 8);
      alterObjAttr("COMMISS", "AllowedFromSpare", "7");
    }
  });
  alterObjAttr("SYSTEM", "ShutdownInput", zeroOne(reactiveData.meta_shutdownThermostat));
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
  setHexBitField("true", "SYSVAR", "MenuGroupEnable", 11);
  alterObjAttr("SYSVAR", "CommunicationMenuEnable", "17");
  alterObjAttr("COMMUN", "SlaveNumber", reactiveData.SlaveAddress);
  switch (reactiveData.meta_communicationType) {
    case selectChoices.communicationType[0]:
      setHexBitField("false", "SYSVAR", "MenuGroupEnable", 11);
      break;
    case selectChoices.communicationType[1]:
      alterObjAttr("COMMUN", "Protocol", "S");
      alterObjAttr("COMMUN", "Baudrate", "38400");
      alterObjAttr("COMMUN", "Hardware", "2");
      alterObjAttr("COMMUN", "Format", "8N1");
      break;
    case selectChoices.communicationType[2]:
      alterObjAttr("COMMUN", "Protocol", "RM");
      alterObjAttr("COMMUN", "Baudrate", "9600");
      alterObjAttr("COMMUN", "Hardware", "4");
      alterObjAttr("COMMUN", "Format", "8N1");
      break;
    case selectChoices.communicationType[3]:
      alterObjAttr("COMMUN", "Protocol", "SAM");
      alterObjAttr("COMMUN", "Baudrate", "38400");
      alterObjAttr("COMMUN", "Hardware", "N");
      alterObjAttr("COMMUN", "Format", "8N1");
      break;
  }
  const disabled = disabledFunctions();
  if (disabled.highrate) {
    setHexBitField("false", "SYSVAR", "MenuGroupEnable", 3);
    setHexBitField("false", "SYSVAR", "NominalSetMenuEnable", 2);
  }
  if (batteryShunt === null) {
    setHexBitField("false", "SYSVAR", "NominalSetMenuEnable", 6);
  }
  if (disabled.commissionning) {
    setHexBitField("false", "SYSVAR", "MenuGroupEnable", 4);
  }
  if (disabled.vo) {
    setHexBitField("false", "SYSVAR", "MenuGroupEnable", 6);
  }
  if (disabled.batteryTest) {
    setHexBitField("false", "SYSVAR", "MenuGroupEnable", 7);
  }
  if (disabled.manualAdjust) {
    setHexBitField("false", "SYSVAR", "MenuGroupEnable", 5);
  }
  // reset calibration
  const calibr = findInAgcFileStruct({
    section: "GCAUCalibrationData",
    object: "CALIBR",
  }, agcFileData.struct);
  if (calibr !== null) {
    const defaultValue = "1024";
    calibr.attributes.forEach(attribute => {
      const newLineValue = `CALIBR.${attribute.readOnly?"!":""}${attribute.name} = "${defaultValue}"`;
      attribute.value = defaultValue;
      agcFileData.lines[attribute.line - 1] = newLineValue;
    });
  }
  const timeStampOfNow = getTimestampOfNow("-", ":");
  const calibrUpdateStamp = findInAgcFileStruct({
    section: "GCAUCalibrationData",
    metaTag: "Update",
  }, agcFileData.struct);
  if (calibrUpdateStamp !== null && calibrUpdateStamp.length === 1) {
    const newLineValue = `$Update = "${timeStampOfNow}"`;
    calibrUpdateStamp[0].value = timeStampOfNow;
    agcFileData.lines[calibrUpdateStamp[0].line - 1] = newLineValue;
  }
  alterMeta("Update", timeStampOfNow);
}
