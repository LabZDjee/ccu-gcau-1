<template>
<div>
  <v-container pt-3>
    <v-layout wrap>
      <v-flex xs12 sm6 px-1 align-content-center>
        <v-card>
          <v-card-title class="headline blue lighten-4">Hardware configuration</v-card-title>
          <v-card-text>
            <div class="d-flex">
              <div>
                <vyw-switch data-key="meta_hasLedBox" :labels="['No LED box', 'LED box']"></vyw-switch>
              </div>
              <div>
                <vyw-switch data-key="meta_duplicatedRelays" :labels="['Relays not duplicated', 'Relays duplicated']"></vyw-switch>
              </div>
            </div>
            <div class="d-flex">
              <div>
                <vyw-numeric-input data-key="meta_earthFaultThreshold" label="Earth fault threshold" suffix="Ω/V" :bottom="Number(20)" :top="Number(2000)" hint="20~2,000"></vyw-numeric-input>
              </div>
              <div>
                <vyw-switch data-key="meta_shutdownThermostat" :labels="['No shutdown bridge thermosat (X9.5)', 'Shutdown bridge thermosat (X9.5)']"></vyw-switch>
              </div>
            </div>
            <div class="d-flex">
              <div class="pr-1">
                <vyw-select-input data-key="meta_forcedFloatInput" label="Forced float (X9.1)" :item-list="selectChoices.spareInputs"></vyw-select-input>
              </div>
              <div>
                <vyw-select-input data-key="meta_highrateInput" label="Highrate (X9.2)" :item-list="selectChoices.spareInputs"></vyw-select-input>
              </div>
            </div>
            <div class="d-flex">
              <div class="pr-1">
                <vyw-select-input data-key="meta_commissioningInput" label="Commissioning (X9.3)" :item-list="selectChoices.spareInputs"></vyw-select-input>
              </div>
              <div>
                <vyw-select-input data-key="meta_alarmAcknowledgmentInput" label="Alarm ack. (X9.4)" :item-list="selectChoices.spareInputs"></vyw-select-input>
              </div>
            </div>
            <div class="d-flex">
              <div>
                <vyw-switch data-key="meta_displayAmbientTemperature" :labels="['Don\'t display ambiant temperature on LCD', 'Display ambiant temperature on LCD']"></vyw-switch>
              </div>
              <div>
                <vyw-switch data-key="meta_displayBatteryTemperature" :labels="['Don\'t display battery temperature on LCD', 'Display battery temperature on LCD']"></vyw-switch>
              </div>
            </div>
          </v-card-text>
        </v-card>
        <v-card class="mt-1">
          <v-card-title class="headline">Environment</v-card-title>
          <v-card-text>
            <div class="d-flex">
              <div>
                <vyw-numeric-input data-key="Edit_ENV_TA" label="Ambient temperature" suffix="C" :bottom="Number(-30)" :top="Number(60)" hint="[-30~+60]" />
              </div>
              <div>
                <vyw-numeric-input data-key="Edit_ENV_ALT" label="Altitude" suffix="m" :bottom="Number(0)" :top="Number(5000)" hint="[0~5,000]" />
              </div>
            </div>
            <div class="d-flex">
              <div>
                <vyw-numeric-input data-key="Label_Derating_temp" label="Temperature derating" suffix="%" :bottom="Number(0)" :top="Number(50)" hint="[0~50]" />
              </div>
              <div>
                <vyw-numeric-input data-key="Label_Derating_ALT" label="Altitude derating" suffix="%" :bottom="Number(0)" :top="Number(50)" hint="[0~50]" />
              </div>
            </div>
          </v-card-text>
        </v-card>
        <v-card class="mt-1">
          <v-card-title class="headline">Communications</v-card-title>
          <v-card-text>
            <div class="d-flex">
              <div>
                <vyw-integer-input data-key="SlaveAddress" label="Slave number" :bottom="Number(1)" :top="Number(255)" hint="[1~255]"></vyw-integer-input>
              </div>
              <div>
                <vyw-select-input data-key="Baudrate" label="Communication velocity (bps)" :item-list="baudrates" hint="bauds"></vyw-select-input>
              </div>
            </div>
          </v-card-text>
        </v-card>
        <v-card class="mt-1">
          <v-card-title class="headline">Language</v-card-title>
          <v-card-text>
            <div class="d-flex justify-center">
              <div class="half">
                <vyw-select-input data-key="Language" label="Language" :item-list="selectChoices.languages" hint="local language" />
              </div>
            </div>
          </v-card-text>
        </v-card>
        <v-card class="mt-1">
          <v-card-title class="headline">Nominal settings</v-card-title>
          <v-card-text>
            <div class="d-flex">
              <div class="pr-1">
                <vyw-select-input data-key="Combo_RN_NDP" label="Number of phases" :item-list="['1', '3']" hint="phase(s)"></vyw-select-input>
              </div>
              <div>
                <vyw-select-input data-key="Combo_RN_FREQ" label="Frequency (Hz)" :item-list="['50', '60']" hint="Hz"></vyw-select-input>
              </div>
            </div>
            <div class="d-flex">
              <div class="pr-1">
                <vyw-integer-input data-key="UacNom" label="AC voltage" :bottom="Number(1)" :top="Number(700)" hint="[1~700]" suffix="Vac"></vyw-integer-input>
              </div>
              <div>
                <vyw-integer-input data-key="IdcNom" label="DC current" :bottom="Number(1)" :top="Number(9999)" hint="[1~9,999]" suffix="Adc"></vyw-integer-input>
              </div>
            </div>
            <div class="d-flex">
              <div class="pr-1">
                <vyw-select-input data-key="Combo_RN_UDC" label="DC voltage" :item-list="dcVoltages" hint="Vdc"></vyw-select-input>
              </div>
              <div>
                <vyw-numeric-input data-key="Edit_RN_CN" label="AC inrush current" suffix="A" :bottom="Number(0)" :top="Number(9999)" hint="[0~9,999]" />
              </div>
            </div>
          </v-card-text>
        </v-card>
        <v-card class="mt-1">
          <v-card-title class="headline">Shunt</v-card-title>
          <v-card-text>
            <div class="d-flex justify-center">
              <div class="half">
                <vyw-numeric-input data-key="RectShuntVal" label="Rectifier shunt (@ 100 mV)" suffix="A" :bottom="Number(0.5)" :top="Number(9999)" hint="[0.5~9,999]" />
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-flex>
      <v-flex xs12 sm6 px-1 align-content-center>
        <v-card>
          <v-card-title class="headline">Meter selection</v-card-title>
          <v-card-text>
            <div class="d-flex">
              <div class="oneThird">
                <vyw-switch data-key="AcMeter" :labels="['No AC meter', 'AC meter present']" />
              </div>
              <div class="oneThird">
                <vyw-switch data-key="LoadVoltMeter" :labels="['No VLoad meter', 'VLoad meter present']" />
              </div>
              <div class="oneThird">
                <vyw-switch data-key="AhMeterDisplay" :labels="['No Ah meter', 'Ah meter present']" />
              </div>
            </div>
          </v-card-text>
        </v-card>
        <v-card class="mt-1" :class="{grey: adjustDisabled, 'lighten-3': adjustDisabled}">
          <v-card-title class="headline">Adjust</v-card-title>
          <v-card-text>
            <div class="d-flex">
              <div>
                <vyw-switch data-key="ManCurrAdjust" :labels="['Variable current off', 'Variable current on']" />
              </div>
              <div>
                <vyw-switch data-key="ManVoltAdjust" :labels="['Variable voltage off', 'Variable voltage on']" />
              </div>
            </div>
            <div class="d-flex">
              <div class="oneThird"></div>
              <div class="oneThird">
                <vyw-numeric-input data-key="VoltAdjustMin" label="Min voltage" suffix="V" :bottom="Number(0)" :top="Number(650)" hint="[0~650]" />
              </div>
              <div class="oneThird">
                <vyw-numeric-input data-key="VoltAdjustMax" label="Max voltage" suffix="V" :bottom="Number(0)" :top="Number(650)" hint="[0~650]" />
              </div>
            </div>
          </v-card-text>
        </v-card>
        <v-card class="mt-1">
          <v-card-title class="headline">Rectifier off</v-card-title>
          <v-card-text>
            <div class="d-flex">
              <div class="oneThird">
                <vyw-switch data-key="RfShtdnEnable" :labels="['Not on rectifier failure', 'On rectifier failure']" />
              </div>
              <div class="oneThird">
                <vyw-switch data-key="MfShtdnEnable" :labels="['Not on mains failure', 'On mains failure']" />
              </div>
              <div class="oneThird">
                <vyw-switch data-key="HvShtdnEnable" :labels="['Not on high DC voltage', 'On high DC voltage']" />
              </div>
            </div>
          </v-card-text>
        </v-card>
        <v-card class="mt-1">
          <v-card-title class="headline">Customer information</v-card-title>
          <v-card-text>
            <div class="d-flex">
              <div>
                <vyw-numeric-input data-key="Edit_DC_VMINDLT" label="Low voltage limit" suffix="V" :bottom="Number(0)" :top="Number(999)" />
              </div>
              <div>
                <vyw-numeric-input data-key="Edit_DC_VMAXDLT" label="High voltage limit" suffix="V" :bottom="Number(0)" :top="Number(999)" />
              </div>
            </div>
            <div class="d-flex">
              <div>
                <vyw-numeric-input data-key="Edit_DC_CURA" label="Current when mains off" suffix="A" :bottom="Number(0)" :top="Number(1000)" />
              </div>
              <div>
                <vyw-numeric-input data-key="Edit_DC_CURP" label="Current when mains on" suffix="A" :bottom="Number(0)" :top="Number(1000)" />
              </div>
            </div>
            <div class="d-flex">
              <div>
                <vyw-numeric-input data-key="Edit_DC_PDC" label="Peak current" suffix="A" :bottom="Number(0)" />
              </div>
              <div>
                <vyw-numeric-input data-key="Edit_DC_DDLPDC" label="Duration of peak current" suffix="s" :bottom="Number(0)" />
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-flex>
    </v-layout>
  </v-container>
</div>
</template>

<script>
import VywNumericInput from "./basics/vyw-numeric-input";
import VywIntegerInput from "./basics/vyw-integer-input";
import VywSelectInput from "./basics/vyw-default-select";
import VywSwitch from "./basics/vyw-switch";
import { selectChoices, reactiveData } from "../data";
import { reactiveStuffAttach } from "../mixins";

export default {
  components: {
    VywNumericInput,
    VywIntegerInput,
    VywSelectInput,
    VywSwitch,
  },
  data: () => ({
    selectChoices,
    adjustDisabled: false,
  }),
  computed: {
    baudrates() {
      return ["1200", "2400", "4800", "9600", "19200"];
    },
    acVoltages() {
      return ["110", "120", "127", "208", "220", "230", "240", "380", "400"];
    },
    dcCurrents() {
      return ["5", "10", "15", "25", "35", "50", "75", "100"];
    },
    dcVoltages() {
      return ["12", "24", "48", "60", "110", "125", "220"];
    },
  },
  methods: {
    updateMiscStuff(v, o, k) {
      this.adjustDisabled = reactiveData.ManCurrAdjust === "false" && reactiveData.ManVoltAdjust === "false";
      if (k === "Edit_ENV_ALT") {
        v = parseFloat(v);
        if (v > 5000) {
          v = 5000;
        }
        if (v >= 1000 && v <= 5000) {
          v = (28 - 7) / (4000 - 1000) * (v - 1000) + 7;
        } else {
          v = 0;
        }
        v = Math.round(10 * v) / 10;
        reactiveData.Label_Derating_ALT = v.toString();
      }
      if (k === "Edit_ENV_TA") {
        v = parseFloat(v);
        if (v > 60) {
          v = 60;
        }
        if (v >= 40) {
          v = 12.5 / 10 * (v - 40);
        } else {
          v = 0;
        }
        v = Math.round(10 * v) / 10;
        reactiveData.Label_Derating_temp = v.toString();
      }
    },
    reactSources() {
      return ["ManCurrAdjust", "ManVoltAdjust", "Edit_ENV_ALT", "Edit_ENV_TA"];
    },
  },
  mixins: [reactiveStuffAttach],
};
</script>

<style scoped>
.half {
  max-width: 48%;
}

.oneThird {
  max-width: 31%;
}
</style>
