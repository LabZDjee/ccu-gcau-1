<template>
<v-container pt-3>
  <v-layout wrap>
    <v-flex xs12 sm6 px-1 align-content-center>
      <v-card>
        <v-card-title class="headline">Cell arrangement</v-card-title>
        <v-card-text>
          <vyw-radios :dataKeysAndLabels="elementRadioDefs" />
          <div class="d-flex">
            <div>
              <vyw-integer-input data-key="Edit_QDB_NDB" label="Number of blocks" :bottom="Number(1)" :top="Number(1000)" hint="Nb of cells = number of bloks x nb cell(s) per block"></vyw-integer-input>
            </div>
            <div class="align-self-center">
              Number of cells:
              <vyw-read-only-text data-key="NrOfCells"></vyw-read-only-text>
            </div>
          </div>
        </v-card-text>
      </v-card>
      <v-card class="py-1 px-2 mt-1">
        <div class="d-flex">
          <div class="pr-2 half">
            <vyw-default-select data-key="Combo_DEF_TDB" label="Battery type" :item-list="batteryTypes"></vyw-default-select>
          </div>
          <div>
            <vyw-text-input data-key="Edit_BattName" label="Battery name" :maxChars="Number(16)"></vyw-text-input>
          </div>
        </div>
        <div class="d-flex">
          <div>
            <vyw-numeric-input data-key="BattCapacity" label="Battery capacity" suffix="Ah" :bottom="Number(0)" :top="Number(9999)"></vyw-numeric-input>
          </div>
          <div>
            <vyw-numeric-input data-key="Edit_DEF_CDCC" label="Short circuit current" suffix="kA"></vyw-numeric-input>
          </div>
        </div>
        <div class="d-flex">
          <div>
            <vyw-numeric-input data-key="UflPerCell" label="Floating charge voltage per cell" suffix="V/cell" :bottom="Number(0)" :top="Number(24)" hint="[0~24]"></vyw-numeric-input>
          </div>
          <div class="align-self-center">
            Total:
            <vyw-read-only-text data-key="Label_DEF_TDFLPETOT2"></vyw-read-only-text>&nbsp;V
          </div>
        </div>
        <div class="d-flex">
          <div>
            <vyw-numeric-input data-key="IbattNom" label="Current limit" suffix="A" :bottom="Number(1)" :top="Number(9999)" hint="[1~9,999]">
            </vyw-numeric-input>
          </div>
        </div>
        <div class="d-flex">
          <div>
            <vyw-switch data-key="TempComp" :labels="['No', 'Yes']"></vyw-switch>
          </div>
          <div>
            <vyw-numeric-input data-key="CompPerC" label="Temperature compensation" :bottom="Number(0)" :top="Number(0.6)" suffix="%/C"></vyw-numeric-input>
          </div>
          <div>
            <div>
              <vyw-read-only-text data-key="Edit_DEF_CET"></vyw-read-only-text>&nbsp;mV/C/Cell
            </div>
            <div>{{vPerC}} mV/C</div>
          </div>
        </div>
        <div class="d-flex">
          <div>
            <vyw-switch data-key="BattShunt" :labels="['No battery shunt', 'Has battery shunt']"></vyw-switch>
          </div>
          <div>
            <vyw-numeric-input data-key="BattShuntVal" label="Shunt value @ 100 mV" suffix="A" :bottom="Number(0.5)" :top="Number(9999)" hint="[0.5~9999]"></vyw-numeric-input>
          </div>
        </div>
        <div class="d-flex">
          <div>
            <vyw-numeric-input data-key="Edit_DEF_TDFDDPE" label="Discharge end voltage / cell" :bottom="Number(0)" :top="Number(1000)" suffix="V"></vyw-numeric-input>
          </div>
          <div class="align-self-center">
            Total:
            <vyw-read-only-text data-key="Label_DEF_TDFDDTOT2"></vyw-read-only-text>&nbsp;V
          </div>
        </div>
      </v-card>
      <v-card class="mt-1" :class="{grey: voDisabled, 'lighten-3': voDisabled}">
        <v-card-title class="headline">VO settings</v-card-title>
        <v-card-text>
          <div class="d-flex">
            <div>
              <vyw-numeric-input data-key="DTmin" label="ΔΘ min" suffix="C" :bottom="Number(0)" :top="Number(20)"></vyw-numeric-input>
            </div>
            <div>
              <vyw-numeric-input data-key="DTmax" label="ΔΘ max" suffix="C" :bottom="Number(0)" :top="Number(20)"></vyw-numeric-input>
            </div>
          </div>
          <div class="d-flex">
            <div>
              <vyw-numeric-input data-key="IbattLow" label="Current limit" suffix="A" :bottom="Number(1)" :top="Number(9999)"></vyw-numeric-input>
            </div>
            <div>
              <vyw-numeric-input data-key="VoChargeTime" label="Extra time" suffix="h" :bottom="Number(0)" :top="Number(20)"></vyw-numeric-input>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-flex>
    <v-flex xs12 sm6 px-1 align-content-center>
      <v-card :class="{grey: highrateDisabled, 'lighten-3': highrateDisabled}">
        <v-card-title class="headline">Highrate</v-card-title>
        <v-card-text>
          <div class="d-flex">
            <div>
              <vyw-numeric-input data-key="UhrPerCell" label="Highrate charge voltage / cell" suffix="V/cell" :bottom="Number(0)" :top="Number(24)"></vyw-numeric-input>
            </div>
            <div class="align-self-center">
              Total:
              <vyw-read-only-text data-key="Label_DEF_TDEPETOT2"></vyw-read-only-text>&nbsp;V
            </div>
          </div>
          <div class="d-flex">
            <div>
              <vyw-radios :dataKeysAndLabels="hrModeRadioDefs" />
            </div>
            <div>
              <vyw-default-select data-key="HrRelayOutput" label="Relay number" :item-list="relayNumbers" hint="0: no relay" />
            </div>
          </div>
          <div class="d-flex">
            <div>
              <vyw-switch data-key="ManHrEnable" :labels="['Manual start disabled', 'Manual start enabled']"></vyw-switch>
            </div>
            <div>
              <vyw-default-select data-key="PeriodicHr" :item-list="hrPeriodicTimes" label="Periodic time (months)"></vyw-default-select>
            </div>
          </div>
          <div class="d-flex">
            <div>
              <vyw-switch data-key="ClHrEnable" :labels="['No start on current limit', 'Starts on current limit']"></vyw-switch>
            </div>
            <div>
              <vyw-integer-input data-key="ClHrTime" label="Delay" suffix="s" :bottom="Number(0)" :top="Number(255)"></vyw-integer-input>
            </div>
          </div>
          <div class="d-flex">
            <div>
              <vyw-switch data-key="MfHrEnable" :labels="['No start on mains failure', 'Starts on mains failure']"></vyw-switch>
            </div>
            <div>
              <vyw-integer-input data-key="MfHrTime" label="Delay" suffix="s" :bottom="Number(0)" :top="Number(255)"></vyw-integer-input>
            </div>
          </div>
          <div class="d-flex">
            <div>
              <vyw-numeric-input data-key="ChargeTime" label="Charge time" suffix="h" :bottom="Number(0)" :top="Number(99)"></vyw-numeric-input>
            </div>
            <div>
              <vyw-numeric-input data-key="BattFanDelay" label="Fan delay" suffix="h" :bottom="Number(0)" :top="Number(24)"></vyw-numeric-input>
            </div>
          </div>
        </v-card-text>
      </v-card>
      <v-card class="mt-1" :class="{grey: commissioningDisabled, 'lighten-3': commissioningDisabled}">
        <v-card-title class="headline">Commissioning</v-card-title>
        <v-card-text>
          <div class="d-flex">
            <div>
              <vyw-switch data-key="CommEnable" :labels="['Commissioning disabled', 'Commissioning enabled']"></vyw-switch>
            </div>
            <div>
              <vyw-default-select data-key="CommRelayOutput" label="Relay number" :item-list="relayNumbers" hint="0: no relay" />
            </div>
          </div>
          <div class="d-flex">
            <div>
              <vyw-numeric-input data-key="UcommPerCell" label="Commissioning charge voltage / cell" suffix="V/cell" :bottom="Number(0)" :top="Number(24)"></vyw-numeric-input>
            </div>
            <div class="align-self-center">
              Total:
              <vyw-read-only-text data-key="Label_DEF_TDFOTOT2"></vyw-read-only-text>&nbsp;V
            </div>
          </div>
          <div class="d-flex">
            <div>
              <vyw-numeric-input data-key="CommCurrent" label="Commiss. charge current" suffix="A" :bottom="Number(1)" :top="Number(9999)"></vyw-numeric-input>
            </div>
            <div>
              <vyw-numeric-input data-key="CommTime" label="Commiss. charge time" suffix="h" :bottom="Number(0)" :top="Number(24)"></vyw-numeric-input>
            </div>
          </div>
        </v-card-text>
      </v-card>
      <v-card class="mt-1" :class="{grey: battTestDisabled, 'lighten-3': battTestDisabled}">
        <v-card-title class="headline">Battery test</v-card-title>
        <v-card-text>
          <div class="d-flex">
            <div class="one-third">
              <vyw-switch data-key="BattTestEnable" :labels="['Disabled', 'Enabled']"></vyw-switch>
            </div>
            <div class="px-1">
              <vyw-default-select data-key="AutoTestPeriod" :itemList="months" label="Period (months)"></vyw-default-select>
            </div>
            <div class="one-third">
              <vyw-numeric-input data-key="DischrgPercent" label="Discharge" suffix="%" :bottom="Number(0)" :top="Number(30)"></vyw-numeric-input>
            </div>
          </div>
          <div class="d-flex">
            <div>
              <vyw-numeric-input data-key="TestEndVoltage" label="Test end voltage" suffix="V" :bottom="Number(0)" :top="Number(650)"></vyw-numeric-input>
            </div>
            <div>
              <vyw-numeric-input data-key="EndVoltageAlarm" label="Discharge end voltage alarm" suffix="V" :bottom="Number(0)" :top="Number(650)"></vyw-numeric-input>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-flex>
  </v-layout>
</v-container>
</template>

<script>
import VywRadios from "./basics/vyw-radios";
import VywIntegerInput from "./basics/vyw-integer-input";
import VywNumericInput from "./basics/vyw-numeric-input";
import VywTextInput from "./basics/vyw-text-input";
import VywReadOnlyText from "./basics/vyw-read-only-text";
import VywDefaultSelect from "./basics/vyw-default-select";
import VywSwitch from "./basics/vyw-switch";
import { reactiveData, selectChoices } from "../data";
import { scrapDecimalsAsString } from "../utils";
import { reactiveStuffAttach } from "../mixins";

export default {
  data() {
    return {
      vPerC: null,
      voDisabled: false,
      highrateDisabled: false,
      commissioningDisabled: false,
      battTestDisabled: false,
    };
  },
  components: {
    VywRadios,
    VywIntegerInput,
    VywNumericInput,
    VywReadOnlyText,
    VywDefaultSelect,
    VywSwitch,
    VywTextInput,
  },
  computed: {
    hrPeriodicTimes() {
      return selectChoices.hrPeriodicTimes;
    },
    relayNumbers() {
      return selectChoices.relayNumbers;
    },
    months() {
      return [...Array(12)].map((_, i) => (i + 1).toString());
    },
    elementRadioDefs() {
      return [
        { key: "Option_1_elemt", label: "1 cell / block" },
        { key: "Option_2_elemt", label: "2 cells / block" },
        { key: "Option_3_elemt", label: "3 cells / block" },
        { key: "Option_6_elemt", label: "6 cells / block" },
      ];
    },
    hrModeRadioDefs() {
      return [
        { key: "ChrgTimerMode", label: "Direct" },
        { key: "Option_DEF_POST", label: "Post" },
      ];
    },
    batteryTypes() {
      return [
        "None",
        "VO",
        "Ni CD (SBH-SBM)",
        "Ni CD (SBL)",
        "Ni CD (SPH)",
        "Ni CD (SLM)",
        "Sealed lead acid",
        "Open lead acid",
      ];
    },
  },
  methods: {
    updateMiscStuff(v, o, k) {
      let multiplier = 1;
      if (reactiveData.Option_2_elemt === "1") {
        multiplier = 2;
      } else if (reactiveData.Option_3_elemt === "1") {
        multiplier = 3;
      } else if (reactiveData.Option_6_elemt === "1") {
        multiplier = 6;
      }
      const nbOfCells = Number(reactiveData.Edit_QDB_NDB) * multiplier;
      reactiveData.NrOfCells = nbOfCells.toString();
      reactiveData["Label_DEF_TDFLPETOT2"] = scrapDecimalsAsString(Number(reactiveData.UflPerCell) * nbOfCells, 4);
      reactiveData["Label_DEF_TDFDDTOT2"] = scrapDecimalsAsString(
        Number(reactiveData["Edit_DEF_TDFDDPE"]) * nbOfCells,
        4
      );
      reactiveData["Label_DEF_TDFOTOT2"] = scrapDecimalsAsString(Number(reactiveData.UcommPerCell) * nbOfCells, 4);
      reactiveData["Label_DEF_TDEPETOT2"] = scrapDecimalsAsString(Number(reactiveData.UhrPerCell) * nbOfCells, 4);
      reactiveData["Edit_DEF_CET"] = scrapDecimalsAsString(
        Number(reactiveData.CompPerC) * Number(reactiveData.UflPerCell),
        4
      );
      this.vPerC = scrapDecimalsAsString(
        Number(reactiveData.CompPerC) * Number(reactiveData.UflPerCell) * nbOfCells,
        4
      );
      if (v !== o) {
        if (k === "VoApplEnable" || k === "Frame_OPBV") {
          if (v === "true") {
            reactiveData["Combo_DEF_TDB"] = "VO";
          } else {
            if (reactiveData["Combo_DEF_TDB"] === "VO") {
              reactiveData["Combo_DEF_TDB"] = "None";
            }
          }
        } else if (k === "Combo_DEF_TDB") {
          reactiveData.VoApplEnable = v === "VO" ? "true" : "false";
        }
      }
      this.voDisabled = reactiveData.VoApplEnable === "false";
      if (!this.voDisabled)
        this.highrateDisabled =
        reactiveData.ManHrEnable === "false" &&
        reactiveData.PeriodicHr === "None" &&
        reactiveData.ClHrEnable === "false" &&
        reactiveData.MfHrEnable === "false";
      this.commissioningDisabled = reactiveData.CommEnable === "false";
      this.battTestDisabled = reactiveData.BattTestEnable === "false";
    },
    reactSources() {
      return [
        "Option_2_elemt",
        "Option_3_elemt",
        "Option_6_elemt",
        "Edit_QDB_NDB",
        "UflPerCell",
        "Edit_DEF_TDFDDPE",
        "UcommPerCell",
        "UhrPerCell",
        "CompPerC",
        "Combo_DEF_TDB",
        "VoApplEnable",
        "ManHrEnable",
        "PeriodicHr",
        "ClHrEnable",
        "MfHrEnable",
        "CommEnable",
        "BattTestEnable",
      ];
    },
  },
  mixins: [reactiveStuffAttach],
};
</script>

<style scoped>
.half {
  max-width: 48%;
}

.one-third {
  max-width: 31%;
}
</style>
