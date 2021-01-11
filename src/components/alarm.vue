<template>
<v-card class="ma-1">
  <div class="d-flex justify-space-around">
    <div class="pa-1">
      <vyw-switch colorWhenOn="success" :data-key="params.enabledId" :labels="enableLabels" />
    </div>
    <div class="pa-1" style="margin-left: 25%; max-width: 40%" v-if="hp('delayId')">
      <vyw-integer-input :data-key="params.delayId" :stepper="{ down: 1, up: 10, roundUp: true }" :bottom="0" label="Delay" suffix="s" hint="positive integer value" />
    </div>
  </div>
  <div class="d-flex">
    <div class="pa-1" v-if="hp('relayNbId')">
      <vyw-default-select :data-key="params.relayNbId" :label="relayNumberLabel" :item-list="selectChoices.relayNumbers" hint="0: no relay" />
    </div>
    <div class="pa-1" v-if="hp('latch.displayId')">
      <vyw-switch :data-key="params.latch.displayId" :labels="['Display latch: OFF', 'Display latch: ON']" />
    </div>
    <div class="pa-1" v-if="hp('latch.relayId')">
      <vyw-switch :data-key="params.latch.relayId" :labels="['Relay latch: OFF', 'Relay latch: ON']" />
    </div>
  </div>
  <div class="d-flex pa-1" v-if="hp('th1.id')">
    <div class="pa-1">
      <vyw-numeric-input :data-key="params.th1.id" :scale="params.th1.scale === undefined ? undefined : Number(params.th1.scale)" :bottom="params.th1.min" :top="params.th1.max" :label="params.th1.title" :suffix="params.th1.unit" :hint="params.th1.hint" />
    </div>
    <div class="pa-1" v-if="hp('th2.id')">
      <vyw-numeric-input :data-key="params.th2.id" :scale="params.th2.scale === undefined ? undefined : Number(params.th2.scale)" :bottom="params.th2.min" :top="params.th2.max" :label="params.th2.title" :suffix="params.th2.unit" :hint="params.th2.hint" />
    </div>
  </div>
  <div class="d-flex pa-1" v-if="hp('text')">
    <div class="pa-1">
      <vyw-text-input :data-key="params.text" label="Text" hint="16 characters, maximum" maxChars="16" />
    </div>
  </div>
</v-card>
</template>

<script>
import VywTextInput from "./basics/vyw-text-input";
import VywIntegerInput from "./basics/vyw-integer-input";
import VywNumericInput from "./basics/vyw-numeric-input";
import VywSwitch from "./basics/vyw-switch";
import VywDefaultSelect from "./basics/vyw-default-select";
import { selectChoices, reactiveData, tdsAlias } from "../data";
import { reactiveStuffAttach } from "../mixins";
import { removeEltInArray } from "../utils";

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
    return {
      selectChoices,
      relayNumberLabel: "Relay number",
    };
  },
  methods: {
    // hp: stands for 'has (params) property'
    hp(param) {
      const breakDown = param.split(".");
      const walkThruBreakDown = breakDown.reduce(function (obj, prop) {
        if (obj !== undefined) {
          obj = obj[prop];
        }
        return obj;
      }, this.params);
      return walkThruBreakDown !== undefined;
    },
    updateMiscStuff(v, o, k) {
      if (k === tdsAlias[this.params.relayNbId] || k === tdsAlias[this.params.enabledId]) {
        const relayNb = parseInt(reactiveData[this.params.relayNbId], 10);
        const alarmEnabled = reactiveData[this.params.enabledId] === "true";
        if (alarmEnabled && relayNb > 8 && reactiveData.meta_hasLedBox !== "true") {
          reactiveData.meta_hasLedBox = "true"; // this one should call 'relayNumberLabelUpdate'
        } else {
          this.relayNumberLabelUpdate();
        }
      }
    },
    reactSources() {
      if (typeof this.params.relayNbId === "string") {
        return [this.params.relayNbId, this.params.enabledId];
      }
      return [];
    },
    relayNumberLabelUpdate() {
      const relayNb = parseInt(reactiveData[this.params.relayNbId], 10);
      const hasLedBoxTicked = reactiveData.meta_hasLedBox === "true";
      if (relayNb > 8) {
        this.relayNumberLabel = `LED number${!hasLedBoxTicked && reactiveData[this.params.enabledId] === "true"? "!!!" : ""}`;
      } else {
        this.relayNumberLabel = hasLedBoxTicked ? "Relay/LED number" : "Relay number";
      }
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
  created() {
    const reactiveFunction = this.relayNumberLabelUpdate.bind(this);
    reactiveData.$watchers.meta_hasLedBox.push(reactiveFunction);
  },
  beforeDestroy() {
    // clean up of reactive hook
    const reactiveFunction = this.relayNumberLabelUpdate.bind(this);
    const watcherArray = reactiveData.$watchers.meta_hasLedBox;
    removeEltInArray(reactiveFunction, watcherArray);
  },
  mixins: [reactiveStuffAttach],
};
</script>

<style scoped></style>
