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
import { reacterAttach } from "../../mixins";

export default {
  props: {
    dataKey: { type: String, required: true }, // key on reactiveData
    label: String,
    hint: String,
    onChanged: {
      type: Function,
      // parameter is an object with following properties
      //  'dataKey' and 'value'
      default: function(/* keyValueObject */) {},
    },
  },
  data: () => ({
    editedValue: undefined,
  }),
  methods: {
    changed() {
      if (typeof this.onChanged === "function") {
        this.onChanged({ dataKey: this.dataKey, value: this.editedValue });
      }
    },
    reactOnNewData(newData) {
      this.editedValue = newData;
    },
  },
  mixins: [reacterAttach],
};
</script>

<style scoped>
</style>
