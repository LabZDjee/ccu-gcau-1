<template>
  <v-select
    :label="label"
    :items="itemList"
    box
    @change="changed"
    :hint="hint"
    v-model="editedValue"
  />
</template>

<script>
import { reacterAttach, implementValueChanged } from "../../mixins";

export default {
  props: {
    dataKey: { type: String, required: true }, // key on reactiveData
    itemList: {
      type: Array, // of strings
      required: true,
      validator(value) {
        return value.every((item) => typeof item === "string");
      },
    },
    label: String,
    hint: String,
    onChanged: {
      type: Function,
      // parameter is an object with following properties:
      //  'dataKey', 'value', and 'index' (0-based in itemList)
    },
  },
  data: () => ({
    editedValue: undefined,
  }),
  computed: {
    index() {
      if (this.itemList instanceof Array) {
        return this.itemList.indexOf(this.editedValue);
      }
      return -1;
    },
  },
  methods: {
    changed() {
      const objectToDispatch = { dataKey: this.dataKey, value: this.editedValue, index: this.index };
      if (typeof this.onChanged === "function") {
        this.onChanged(objectToDispatch);
      } else {
        this.defaultOnChanged(objectToDispatch);
      }
    },
    reactOnNewData(newData) {
      if (this.itemList instanceof Array) {
        this.editedValue = this.itemList[0];
        if (typeof newData === "number") {
          const wildIndex = Math.round(newData);
          const trimmedIndex = Math.max(0, Math.min(wildIndex, this.itemList.length - 1));
          this.editedValue = this.itemList[trimmedIndex];
        } else if (typeof newData === "string") {
          if (this.itemList.indexOf(newData) >= 0) {
            this.editedValue = newData;
          }
        }
      }
    },
  },
  mixins: [reacterAttach, implementValueChanged],
};
</script>

<style scoped>
</style>
