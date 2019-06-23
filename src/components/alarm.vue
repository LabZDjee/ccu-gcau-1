<template>
  <v-card>
    <v-container pa-2 ma-2>
      <v-layout wrap column>
        <v-flex xs12>
          <v-container pa-1>
            <v-layout wrap justify-center align-center>
              <v-flex xs6 md5 pl-4>
                <vyw-switch
                  colorWhenOn="success"
                  :data-key="params.enabledId"
                  :labels="enableLabels"
                  :on-changed="valueChanged"
                />
              </v-flex>
              <v-flex xs6 md7 v-if="hp('relayNbId')" pt-1 pb-0 px-1>
                <vyw-default-select
                  :data-key="params.relayNbId"
                  label="Relay number"
                  :item-list="selectChoices.relayNumbers"
                  hint="0: no relay"
                  :on-changed="valueChanged"
                />
              </v-flex>
              <v-flex pr-1 xs4 v-if="hp('latch.relayId') && isCommonAlarm">
                <vyw-switch
                  :data-key="params.latch.relayId"
                  :labels="['Relay latch: OFF', 'Relay latch: ON']"
                  :on-changed="valueChanged"
                />
              </v-flex>
            </v-layout>
          </v-container>
        </v-flex>
        <v-flex xs12 v-if="hp('th1') || hp('th2')">
          <v-container py-0 pr-2 pl-0>
            <v-layout wrap justify-space-around>
              <v-flex pr-1 :class="{xs6: hp('th2'), xs9: !hp('th2')}">
                <vyw-numeric-input
                  :data-key="params.th1.id"
                  :scale="params.th1.scale===undefined?undefined:Number(params.th1.scale)"
                  :bottom="params.th1.min"
                  :top="params.th1.max"
                  :label="params.th1.title"
                  :suffix="params.th1.unit"
                  :hint="params.th1.hint"
                  :on-changed="valueChanged"
                />
              </v-flex>
              <v-flex xs6 v-if="hp('th2')">
                <vyw-numeric-input
                  :data-key="params.th2.id"
                  :scale="params.th2.scale===undefined?undefined:Number(params.th2.scale)"
                  :bottom="params.th2.min"
                  :top="params.th2.max"
                  :label="params.th2.title"
                  :suffix="params.th2.unit"
                  :hint="params.th2.hint"
                  :on-changed="valueChanged"
                />
              </v-flex>
            </v-layout>
          </v-container>
        </v-flex>
        <v-flex xs12 v-if="hp('text')">
          <v-container py-0 px-2>
            <v-layout wrap justify-space-around>
              <v-flex pr-1 xs9 v-if="hp('latch.displayId')">
                <vyw-text-input
                  :data-key="params.text"
                  label="Text"
                  hint="16 characters, maximum"
                  maxChars="16"
                  :on-changed="valueChanged"
                />
              </v-flex>
            </v-layout>
          </v-container>
        </v-flex>
        <v-flex xs12 v-if="(hp('latch') || hp('delayId')) && !isCommonAlarm">
          <v-container py-0 pr-2 pl-1>
            <v-layout wrap justify-space-around>
              <v-flex pr-1 xs4 v-if="hp('latch.displayId')">
                <vyw-switch
                  :data-key="params.latch.displayId"
                  :labels="['Display latch: OFF', 'Display latch: ON']"
                  :on-changed="valueChanged"
                />
              </v-flex>
              <v-flex pr-1 xs4 v-if="hp('latch.relayId')">
                <vyw-switch
                  :data-key="params.latch.relayId"
                  :labels="['Relay latch: OFF', 'Relay latch: ON']"
                  :on-changed="valueChanged"
                />
              </v-flex>
              <v-flex xs4 v-if="hp('delayId')">
                <vyw-integer-input
                  :data-key="params.delayId"
                  :stepper="{down: 1, up: 10, roundUp: true}"
                  :bottom="0"
                  label="Delay"
                  suffix="s"
                  hint="positive integer value"
                  :on-changed="valueChanged"
                />
              </v-flex>
            </v-layout>
          </v-container>
        </v-flex>
      </v-layout>
    </v-container>
  </v-card>
</template>

<script>
import VywTextInput from "./basics/vyw-text-input";
import VywIntegerInput from "./basics/vyw-integer-input";
import VywNumericInput from "./basics/vyw-numeric-input";
import VywSwitch from "./basics/vyw-switch";
import VywDefaultSelect from "./basics/vyw-default-select";
import { selectChoices } from "../data";
import { implementValueChanged } from "../mixins";

export default {
  name: "vyw-alarm",
  // params: {enabledId, [relayNbId], [th1: {id, title, unit, hint, min, max, scale}, [th2: {id, title, [unit]}],
  //         [delayId], [latch: {displayId, relayId}] [text]}
  props: {
    title: String,
    params: Object,
    isCommonAlarm: Boolean,
  },
  data() {
    return { selectChoices };
  },
  mixins: [implementValueChanged],
  methods: {
    // hp: stands for 'has (params) property'
    hp(param) {
      const breakDown = param.split(".");
      const walkThruBreakDown = breakDown.reduce(function(obj, prop) {
        if (obj !== undefined) {
          obj = obj[prop];
        }
        return obj;
      }, this.params);
      return walkThruBreakDown !== undefined;
    },
  },
  computed: {
    enableLabels() {
      return [`${this.title} OFF`, `${this.title} ON`];
    },
  },
  components: {
    VywTextInput,
    VywIntegerInput,
    VywNumericInput,
    VywSwitch,
    VywDefaultSelect,
  },
};
</script>

<style scoped>
</style>
