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
    :counter="maxLength"
    :maxLength="maxLength"
    :mask="mask"
  />
</template>

<script>
import { reacterAttach, implementValueChanged } from "../../mixins";

export default {
  props: {
    dataKey: { type: String, required: true }, // key on reactiveData
    filter: Function /* parameter: value, return: false or {errorMessage: String[, filteredValue: String]} */,
    maxChars: [Number, String] /* display char count and controls max number of chars of string */,
    mask: String /* optional, pattern as defined in 'v-text-field' Vuetify input control, e.g.: "Annn_#" */,
    label: String,
    suffix: String,
    hint: String,
    onChanged: {
      type: Function,
      // parameter is an object with following properties
      //  'dataKey', 'value', and 'index' (0-based in itemList)
    },
  },
  data: () => ({
    editedValue: undefined,
    lastCorrectValue: undefined,
    initialValue: undefined,
    error: false,
    errorMessages: [],
  }),
  computed: {
    maxLength() {
      if (isNaN(this.maxChars)) {
        return undefined;
      }
      const length = Math.round(Number(this.maxChars));
      return length > 0 ? length : undefined;
    },
    test() {
      if (typeof this.filter === "function") {
        return this.filter;
      }
      return () => false;
    },
  },
  methods: {
    input() {
      const rTest = this.test(this.editedValue);
      if (rTest === false) {
        this.lastCorrectValue = this.editedValue;
        this.error = false;
        this.errorMessages = [];
      } else {
        this.error = true;
        this.errorMessages = [rTest.errorMessage];
      }
    },
    changed() {
      let correctedValue = this.editedValue;
      const rTest = this.test(correctedValue);
      if (rTest !== false) {
        if (typeof rTest.filteredValue !== "undefined") {
          correctedValue = rTest.filteredValue;
        } else if (typeof this.lastCorrectValue !== "undefined") {
          correctedValue = this.initialValue;
        }
        this.editedValue = correctedValue;
        this.input();
      }
      const objectToDispatch = { dataKey: this.dataKey, value: correctedValue };
      if (typeof this.onChanged === "function") {
        this.onChanged(objectToDispatch);
      } else {
        this.defaultOnChanged(objectToDispatch);
      }
    },
    reactOnNewData(newData) {
      this.initialValue = newData;
      this.editedValue = newData;
    },
  },
  mixins: [reacterAttach, implementValueChanged],
};
</script>

<style scoped></style>
