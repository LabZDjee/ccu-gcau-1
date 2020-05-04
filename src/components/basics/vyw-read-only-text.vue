<template>
  <span>{{displayedValue}}</span>
</template>

<script>
import { reacterAttach } from "../../mixins";

export default {
  props: {
    dataKey: { type: String, required: true }, // key on reactiveData
  },
  data: () => ({
    displayedValue: undefined,
  }),
  methods: {
    reactOnNewData(newData) {
      this.displayedValue = newData;
    },
  },
  mixins: [reacterAttach],
};
</script>

<style scoped></style>
