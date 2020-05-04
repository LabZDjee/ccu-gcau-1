<template>
  <v-textarea
    :label="label"
    :hint="hint"
    :no-resize="true"
    v-model="editedValue"
    @change="changed"
    box
  />
</template>

<script>
import { reacterAttach, implementValueChanged } from "../../mixins";

export default {
  props: {
    dataKey: { type: String, required: true }, // key on reactiveData
    label: String,
    hint: String,
    onChanged: {
      type: Function,
      // parameter is an object with following properties
      //  'dataKey' and 'value'
    },
  },
  data: () => ({
    editedValue: undefined,
  }),
  methods: {
    changed() {
      const objectToDispatch = { dataKey: this.dataKey, value: this.editedValue };
      if (typeof this.onChanged === "function") {
        this.onChanged(objectToDispatch);
      } else {
        this.defaultOnChanged(objectToDispatch);
      }
    },
    reactOnNewData(newData) {
      this.editedValue = newData;
    },
  },
  mixins: [reacterAttach, implementValueChanged],
};
</script>

<style scoped>
</style>
