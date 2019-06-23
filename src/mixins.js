/*jshint esversion: 6 */
/* eslint-disable no-undef */

import { reactiveData, eventBus } from "./data";

export const reacterAttach = {
  created() {
    // with this, every alteration of reactiveData[this.dataKey] will update component
    reactiveData.$watchers[this.dataKey].push(this.reactOnNewData.bind(this));
    // ensure initialization upon component creation
    this.reactOnNewData(reactiveData[this.dataKey]);
  },
  beforeDestroy() {
    // clean up of reactive hook
    const reactiveFunction = this.reactOnNewData.bind(this);
    let watcherArray = reactiveData.$watchers[this.dataKey];
    for (let i = 0; i < watcherArray.length; i++) {
      if (watcherArray[i] === reactiveFunction) {
        watcherArray.splice(i, 1); // remove function
        break;
      }
    }
  },
};

export const implementValueChanged = {
  methods: {
    valueChanged(v) {
      const index = v.index !== undefined ? ` (index: ${v.index})` : "";
      // eslint-disable-next-line no-console
      console.log(`new value for '${v.dataKey}' => '${v.value}'${index}: ${typeof v.value}`);
      eventBus.dataChanged(v);
    },
  },
};
