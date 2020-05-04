/*jshint esversion: 6 */

import "@babel/polyfill";
import Vue from "vue";
import Vuetify from "vuetify/lib";
import "vuetify/src/stylus/app.styl";
import colors from "vuetify/es5/util/colors";

Vue.use(Vuetify, {
  theme: {
    primary: colors.purple,
    secondary: colors.blue,
    accent: colors.shades.black,
    error: colors.red.accent3,
  },
});
