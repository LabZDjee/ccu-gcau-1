<template>
  <v-text-field
    :label="label"
    box
    light
    :suffix="suffix"
    v-model="editedValue"
    @change="changed"
    @input="input"
    :error="error"
    :error-messages="errorMessages"
    :hint="hint"
  />
</template>

<script>
import { reacterAttach } from "../../mixins";

export default {
  props: {
    dataKey: { type: String, requied: true }, // key on reactiveData
    scale: {
      type: Number, // multiplied by this upon input / divided by this upon output
      default: 1,
    },
    bottom: [Number, String], // optional: minimum value (inclusive, taking scale into account)
    top: [Number, String], // optional: maximum value (inclusive, taking scale into account)
    maxPrecision: {
      type: Number, // max number of significant digits - if undefined or null, ignore
      default: 5,
    },
    label: String,
    suffix: String, // optional, e.g. for unit
    hint: String,
    onChanged: {
      type: Function,
      // parameter is an object with following properties:
      //  'dataKey' and 'value' (which is a number or a string depending on the provided value type by ReacTer)
      default: function(/* keyValueObject */) {},
    },
  },
  data: () => ({
    editedValue: undefined,
    initialValue: undefined,
    isNumber: false,
    error: false,
    errorMessages: [],
  }),
  computed: {
    min() {
      return isNaN(this.bottom) ? undefined : Number(this.bottom);
    },
    max() {
      return isNaN(this.top) ? undefined : Number(this.top);
    },
  },
  methods: {
    test() {
      const v = Number(this.editedValue);
      if (isNaN(v)) {
        return { msg: "Not a number!", def: this.initialValue };
      }
      if (this.min !== undefined && v < this.min) {
        return { msg: `Too small (minimum: ${this.min})!`, def: this.min };
      }
      if (this.max !== undefined && v > this.max) {
        return { msg: `Too large (maximum: ${this.max})!`, def: this.max };
      }
      this.initialValue = v;
      return false;
    },
    applyPrecision(value) {
      const precision = Math.round(Number(this.maxPrecision));
      if (!isNaN(precision) && precision > 0) {
        return Number(value.toPrecision(this.maxPrecision));
      }
      return value;
    },
    input() {
      const rTest = this.test();
      if (rTest === false) {
        this.error = false;
        this.errorMessages = [];
      } else {
        this.error = true;
        this.errorMessages = [rTest.msg];
      }
    },
    changed() {
      const rTest = this.test();
      let correctedValue = Number(this.editedValue);
      if (rTest !== false) {
        correctedValue = rTest.def;
      }
      this.editedValue = correctedValue;
      this.input();
      if (typeof this.onChanged === "function") {
        const scaledValue = this.applyPrecision(correctedValue / this.scale);
        this.onChanged({ dataKey: this.dataKey, value: this.isNumber ? scaledValue : scaledValue.toString() });
      }
    },
    reactOnNewData(newData) {
      let conformedData = newData;
      this.isNumber = typeof conformedData === "number";
      if (isNaN(newData)) {
        conformedData = 0;
      } else {
        conformedData = this.applyPrecision(Number(newData) * this.scale);
      }
      this.initialValue = conformedData;
      this.editedValue = conformedData;
    },
  },
  mounted() {
    if (this.scale <= 0) {
      // destroy the vue listeners, etc
      this.$destroy();
      // remove the element from the DOM
      this.$el.parentNode.removeChild(this.$el);
      throw `unsupported scale: ${this.scale}`;
    }
  },
  mixins: [reacterAttach],
};
</script>

<style scoped>
</style>
