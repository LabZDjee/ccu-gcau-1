/* jshint esversion: 6 */

import Vue from "vue";
import "./plugins/vuetify";
import App from "./app.vue";

Vue.config.productionTip = false;

export function initVue() {
  new Vue({
    render: (h) => h(App),
  }).$mount("#app");
}
