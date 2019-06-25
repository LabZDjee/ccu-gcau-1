<template>
  <v-text-field
    :label="label"
    box
    :suffix="suffix"
    v-model="editedValue"
    @change="changed"
    @input="input"
    :error="error"
    :error-messages="errorMessages"
    :hint="hint"
    :append-icon="stepperIcon"
    @click:append="stpperIconClicked"
  />
</template>

<script>
import { reacterAttach } from "../../mixins";

export default {
  props: {
    dataKey: { type: String, required: true }, // key on reactiveData
    scale: {
      type: Number, // rounds input multiplied by scale and rounds on divide back on output
      default() {
        return 1;
      },
    },
    bottom: [Number, String], // optional: minimum value (inclusive, scaled value)
    top: [Number, String], // optional: maximum value (inclusive, scaled value)
    // if defined, will add an up/down icon, takes an object with properties:
    //  up/down: values for click on up and down
    //  roundUp: if true, will always round-up to n times 'up' properties
    stepper: {
      type: Object /* properties: up, down[, roundUp], up and down are scaled */,
      validator(stepper) {
        return typeof stepper === "undefined" || (typeof stepper.up === "number" && typeof stepper.down === "number");
      },
    },
    label: String,
    suffix: String, // e.g. unit
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
      return isNaN(this.bottom) ? undefined : this.numToInt(Number(this.bottom));
    },
    max() {
      return isNaN(this.top) ? undefined : this.numToInt(Number(this.top));
    },
    stepperInc() {
      const stepperPropValue = this.stepper ? this.stepper.up : undefined;
      if (typeof stepperPropValue === undefined || isNaN(stepperPropValue)) {
        return undefined;
      }
      const stepperValue = Math.floor(Number(stepperPropValue));
      return stepperValue > 0 ? stepperValue : undefined;
    },
    stepperDec() {
      const stepperPropValue = this.stepper ? this.stepper.down : undefined;
      if (typeof stepperPropValue === undefined || isNaN(stepperPropValue)) {
        return undefined;
      }
      const stepperValue = Math.floor(Number(stepperPropValue));
      return stepperValue > 0 ? stepperValue : undefined;
    },
    stepperIcon() {
      return this.stepperInc && this.stepperDec ? "unfold_more" : undefined;
    },
  },
  methods: {
    test() {
      const v = Number(this.editedValue);
      if (isNaN(v)) {
        return { msg: "Not a number!", def: this.initialValue };
      }
      if (this.isAnInt(Number(v)) == false) {
        return { msg: `Only integer values!`, def: this.numToInt(Number(v)) };
      }
      if (this.min !== undefined && Number(v) < this.min) {
        return { msg: `Too small (minimum: ${this.min})!`, def: this.min };
      }
      if (this.max !== undefined && Number(v) > this.max) {
        return { msg: `Too large (maximum: ${this.max})!`, def: this.max };
      }
      this.initialValue = v;
      return false;
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
      let correctedValue = this.editedValue;
      if (rTest !== false) {
        correctedValue = rTest.def;
      }
      this.editedValue = correctedValue;
      this.input();
      let scaledValue = correctedValue;
      if (this.scale >= 1.5 || this.scale <= 2 / 3) {
        scaledValue = Math.round(scaledValue * this.scale);
      }
      if (typeof this.onChanged === "function") {
        this.onChanged({ dataKey: this.dataKey, value: this.isNumber ? scaledValue : scaledValue.toString() });
      }
    },
    numToInt(num) {
      if (isNaN(num)) {
        return NaN;
      }
      return Math.round(num);
    },
    isAnInt(num) {
      return isNaN(num) == false && Math.floor(num) === num;
    },
    cropDown(value) {
      return typeof this.min === "number" ? Math.max(this.min, value) : value;
    },
    cropUp(value) {
      return typeof this.max === "number" ? Math.min(this.max, value) : value;
    },
    stpperIconClicked(event) {
      let n = Number(this.editedValue);
      if (isNaN(n)) {
        return;
      }
      if (event.offsetY > event.target.offsetHeight / 2) {
        n = this.cropDown(n - this.stepperDec);
      } else {
        n += this.stepperInc;
        if (this.stepper.roundUp) {
          n = Math.floor(n / this.stepperInc) * this.stepperInc;
        }
        n = this.cropUp(n);
      }
      if (this.editedValue !== n) {
        this.editedValue = n;
        this.changed();
      }
    },
    reactOnNewData(newData) {
      let conformedData = newData;
      this.isNumber = typeof conformedData === "number";
      if (isNaN(newData)) {
        conformedData = "0";
      } else {
        conformedData = Math.round(Number(newData).toString());
        if (this.scale >= 1.5 || this.scale <= 2 / 3) {
          conformedData = Math.round(conformedData / this.scale);
        }
      }
      this.initialValue = conformedData;
      this.editedValue = conformedData;
    },
  },
  mixins: [reacterAttach],
  mounted() {
    if (this.scale <= 0) {
      // destroy the vue listeners, etc
      this.$destroy();
      // remove the element from the DOM
      this.$el.parentNode.removeChild(this.$el);
      throw `unsupported scale: ${this.scale}`;
    }
  },
};
</script>

<style scoped>
</style>
