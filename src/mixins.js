/*jshint esversion: 6 */
/* eslint-disable no-undef */

import { reactiveData, eventBus, tdsAlias } from "./data";
import { removeEltInArray } from "./utils";

export const reacterAttach = {
  created() {
    const reactiveFunction = this.reactOnNewData.bind(this);
    // with this, every alteration of reactiveData[this.dataKey] will update component
    reactiveData.$watchers[this.dataKey].push(reactiveFunction);
    const tdsKey = tdsAlias[this.dataKey];
    if (tdsKey !== undefined) {
      reactiveData.$watchers[tdsKey].push(reactiveFunction);
    }
    // ensure initialization upon component creation
    this.reactOnNewData(reactiveData[this.dataKey]);
  },
  beforeDestroy() {
    // clean up of reactive hook
    const reactiveFunction = this.reactOnNewData.bind(this);
    const watcherArray = reactiveData.$watchers[this.dataKey];
    removeEltInArray(reactiveFunction, watcherArray);
    const tdsKey = tdsAlias[this.dataKey];
    if (tdsKey !== undefined) {
      const watcherArray = reactiveData.$watchers[tdsKey];
      removeEltInArray(reactiveFunction, watcherArray);
    }
  },
};

//
// when used, don't forget to declare those in module:
//  method updateMiscStuff(value, oldValue, key) to react on data defined in
//  reactSources function which return an array composed of keys to watch in the module
//
export const reactiveStuffAttach = {
  created() {
    const watcherFct = this.updateMiscStuff.bind(this);
    this.reactSources().forEach((source) => {
      reactiveData.$watchers[source].push(watcherFct);
      const otherName = tdsAlias[source];
      if (otherName !== undefined) {
        reactiveData.$watchers[otherName].push(watcherFct);
      }
    });
    this.updateMiscStuff();
  },
  beforeDestroy() {
    const watcherFct = this.updateMiscStuff.bind(this);
    this.reactSources().forEach((source) => {
      removeEltInArray(watcherFct, reactiveData.$watchers[source]);
      const otherName = tdsAlias[source];
      if (otherName != undefined) {
        removeEltInArray(watcherFct, reactiveData.$watchers[otherName]);
      }
    });
  },
};

export const implementValueChanged = {
  methods: {
    defaultOnChanged(v) {
      // const index = v.index !== undefined ? ` (index: ${v.index})` : "";
      // eslint-disable-next-line no-console
      // console.log(`new value for '${v.dataKey}' => '${v.value}'${index}: ${typeof v.value}`);
      eventBus.dataChanged(v);
    },
  },
};
