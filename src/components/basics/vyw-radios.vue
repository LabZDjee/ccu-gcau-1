<template>
  <v-radio-group v-model="editedValue" :mandatory="true" :column="false" @change="changed">
    <v-radio
      v-for="kl in dataKeysAndLabels"
      :label="kl.label"
      :key="kl.key"
      :value="kl.key"
      :color="colorWhenOn"
    ></v-radio>
  </v-radio-group>
</template>

<script>
import { reactiveData, tdsAlias } from "../../data";
import { implementValueChanged } from "../../mixins";
import { removeEltInArray } from "../../utils";

export default {
  props: {
    dataKeysAndLabels: {
      type: Array /* array of objects of type {key, label}*/,
      required: true,
    },
    hint: String,
    colorWhenOn: String,
    onChanged: {
      type: Function,
      // parameter is an object with following properties
      //  'dataKey' and 'value'
      //   type and format of value depends on what provided by ReacTer:
      //    if boolean, a boolean is returned
      //    if number, 0 or 1 is returned
      //    if string of value "true"/"false" either of those two values is returned
      //    if string of value "1"/"0" either of those two values is returned
    },
  },
  data: () => ({
    editedValue: undefined,
    externalType: "boolean",
  }),
  methods: {
    typedValue(trueOrFalse) {
      switch (this.externalType) {
        case "number":
          return trueOrFalse ? 1 : 0;
        case "stringLiteral":
          return trueOrFalse ? "true" : "false";
        case "stringNumeric":
          return trueOrFalse ? "1" : "0";
        default:
          return trueOrFalse;
      }
    },
    changed() {
      const onChanged = typeof this.onChanged === "function" ? this.onChanged : this.defaultOnChanged;
      this.dataKeysAndLabels.forEach((kl) => {
        const { key } = kl;
        onChanged({ dataKey: key, value: this.typedValue(key === this.editedValue) });
      });
    },
    reactOnNewData(newData, _oldData, key) {
      switch (typeof newData) {
        case "number":
          if (newData === 0) {
            return;
          }
          this.externalType = "number";
          break;
        case "string":
          if (newData.toLowerCase() === "false" || newData === "0") {
            return;
          }
          this.externalType = isNaN(newData) ? "stringLiteral" : "stringNumeric";
          break;
        case "boolean":
          if (newData === false) {
            return;
          }
          this.externalType = "boolean";
          break;
        default:
          return;
      }
      for (let i = 0; i < this.dataKeysAndLabels.length; i++) {
        const dataKey = this.dataKeysAndLabels[i].key;
        if (dataKey === key || tdsAlias[dataKey] === key || dataKey === tdsAlias[key]) {
          this.editedValue = dataKey;
          break;
        }
      }
    },
  },
  created() {
    const reactiveFunction = this.reactOnNewData.bind(this);
    for (let n = 0; n < this.dataKeysAndLabels.length; n++) {
      const key = this.dataKeysAndLabels[n].key;
      const tdsKey = tdsAlias[key] === undefined ? key : tdsAlias[key];
      // with this, every alteration of reactiveData[this.dataKey] will update component
      reactiveData.$watchers[key].push(reactiveFunction);
      if (tdsKey !== key) {
        reactiveData.$watchers[tdsKey].push(reactiveFunction);
      }
      // ensure initialization upon component creation
      this.reactOnNewData(reactiveData[this.dataKeysAndLabels[n].key]);
    }
  },
  beforeDestroy() {
    // clean up of reactive hook
    const reactiveFunction = this.reactOnNewData.bind(this);
    for (let n = 0; n < this.dataKeysAndLabels.length; n++) {
      const key = this.dataKeysAndLabels[n].key;
      const tdsKey = tdsAlias[key] === undefined ? key : tdsAlias[key];
      removeEltInArray(reactiveFunction, reactiveData.$watchers[key]);
      if (tdsKey !== key) {
        removeEltInArray(reactiveFunction, reactiveData.$watchers[tdsKey]);
      }
    }
  },
  mixins: [implementValueChanged],
};
</script>

<style scoped></style>
