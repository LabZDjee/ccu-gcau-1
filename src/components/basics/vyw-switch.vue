<template>
  <v-switch
    :label="label"
    box
    @change="changed"
    :hint="hint"
    v-model="editedValue"
    :color="colorWhenOn"
  />
</template>

<script>
import { reacterAttach } from "../../mixins";

export default {
  props: {
    dataKey: { type: String, requied: true }, // key on reactiveData
    labels: {
      type: Array /* array of two strings: one for 'off' state on for 'on' state */,
      required: true,
      default() {
        return ["off", "on"];
      },
    },
    hint: String,
    colorWhenOn: String,
    onChanged: {
      type: Function,
      // parameter is an object with following properties
      //  'dataKey' and 'value'
      //   type and format of value depends on what provided by ReacTer:
      //    of boolean, a boolean is returned
      //    if number, 0 or 1 is returned
      //    if string of value "true"/"false" either of those two values is returned
      //    if string of value "1"/"0" either of those two values is returned
      default: function(/* keyValueObject */) {},
    },
  },
  data: () => ({
    editedValue: undefined,
    externalType: "boolean",
  }),
  computed: {
    label() {
      return this.labels[this.editedValue ? 1 : 0];
    },
    typedValue() {
      const value = this.editedValue;
      switch (this.externalType) {
        case "number":
          return value ? 1 : 0;
        case "stringLiteral":
          return value ? "true" : "false";
        case "stringNumeric":
          return value ? "1" : "0";
        default:
        case "boolean":
          return value;
      }
    },
  },
  methods: {
    changed() {
      if (typeof this.onChanged === "function") {
        this.onChanged({ dataKey: this.dataKey, value: this.typedValue });
      }
    },
    reactOnNewData(newData) {
      switch (typeof newData) {
        case "number":
          this.editedValue = newData !== 0;
          this.externalType = "number";
          break;
        case "string":
          this.editedValue = ["false", "0"].indexOf(newData.toLowerCase()) === -1;
          this.externalType = isNaN(newData) ? "stringLiteral" : "stringNumeric";
          break;
        case "boolean":
          this.editedValue = newData;
          this.externalType = "boolean";
          break;
        default:
          this.editedValue = false;
          break;
      }
    },
  },
  mixins: [reacterAttach],
};
</script>

<style scoped>
</style>
