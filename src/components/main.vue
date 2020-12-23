<template>
<v-container px-0 :class="{ 'py-0': isScrolledDown }">
  <v-layout justify-center>
    <v-flex xs12 lg11 xl7>
      <div ref="header" :class="{ headerMargin: !isScrolledDown }">
        <v-toolbar class="lime lighten-5">
          <v-toolbar-title class="headline text-uppercase">
            <span>CCU>GCAU</span>
            <span class="font-weight-light">Config. translator</span>
            <span class="caption text-lowercase">  - v{{appVersion}}</span>
          </v-toolbar-title>
        </v-toolbar>
        <v-container :class="{ hide: isScrolledDown }" pa-0 class="lime lighten-5">
          <v-layout justify-center>
            <v-flex xs2>
              <v-btn small @click="$refs.inputTds.click()">Load</v-btn>
              <input v-show="false" ref="inputTds" type="file" accept=".tdsa, .tdsn" @change="loadTds" />
            </v-flex>
            <v-flex xs2>
              <v-btn small @click="$refs.inputAgc.click()">Load AGC</v-btn>
              <input v-show="false" ref="inputAgc" type="file" accept=".agc" @change="loadAgc" />
            </v-flex>
            <v-flex xs2>
              <v-btn small @click="saveOutputFile()" :disabled="agcFileName === null">Save AGC</v-btn>
              <!-- <a ref="outputSave" v-show="false" href download="sample.agc">Save</a> -->
            </v-flex>
          </v-layout>
        </v-container>
      </div>
      <div ref="tabBar" :class="{ tabBarFixed: tabBarFixed }" :style="{ left: `${tabBarDynamicLeftOffset}px` }">
        <v-tabs @change="menuItemSelect">
          <v-tab>Admin</v-tab>
          <v-tab>System</v-tab>
          <v-tab>Battery</v-tab>
          <v-tab>Alarms</v-tab>
        </v-tabs>
      </div>

      <div :class="{ hide: !tabBarFixed }">
        <v-tabs>
          <v-tab />
          <v-tab />
          <v-tab />
        </v-tabs>
      </div>

      <div ref="contentFrame">
        <v-tabs v-model="menuItemSelected" height="0">
          <v-tab />
          <v-tab />
          <v-tab />
          <v-tab />
          <v-tab-item>
            <vyw-admin :tdsFileName="tdsFileName" :contentsAltered="contentsAltered" />
          </v-tab-item>
          <v-tab-item>
            <vyw-system />
          </v-tab-item>
          <v-tab-item>
            <vyw-battery />
          </v-tab-item>
          <v-tab-item>
            <vyw-alarms />
          </v-tab-item>
        </v-tabs>
        <vyw-react-test v-if="nodeEnv === 'development'" />
      </div>
    </v-flex>
    <v-dialog v-model="agcFileErrorDialog" max-width="400">
      <v-card>
        <v-card-title class="headline">AGC File Error</v-card-title>
        <v-card-text>{{ agcErrorDetails }}</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="agcFileErrorDialog = false">OK</v-btn>
          <v-spacer></v-spacer>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-layout>
</v-container>
</template>

<script>
import {
  analyzeAgcFile,
} from "@labzdjee/agc-util";
import download from "downloadjs";
import VywAdmin from "./admin";
import VywSystem from "./system";
import VywBattery from "./battery";
import VywAlarms from "./alarms";
import VywReactTest from "./react-test";
import { eventBus, processTdsFile, reactiveData, processAgcFile, processP0File, agcFileData, tdsAlias, setImportedFileName, appVersion } from "../data";
import { translateCcu2gcau } from "../cfg-trans";

export default {
  components: {
    VywAdmin,
    VywSystem,
    VywBattery,
    VywAlarms,
    VywReactTest,
  },
  data: () => ({
    menuItemSelected: undefined,
    headerHeight: undefined,
    tabBarHeight: undefined,
    tabBarInitialLeftOffset: undefined,
    contentInitialLeftOffset: undefined,
    tabBarDynamicLeftOffset: undefined,
    isScrolledDown: false,
    tabBarFixed: false,
    tdsFileName: "",
    contentsAltered: false,
    agcFileName: null,
    agcFileErrorDialog: false,
    agcErrorDetails: "??",
    nodeEnv: process.env.NODE_ENV,
    appVersion,
  }),
  methods: {
    menuItemSelect(v) {
      this.menuItemSelected = v;
    },
    onWindowScroll() {
      const documentHeight = document.documentElement.scrollHeight;
      const windowHeight = window.innerHeight;
      const scrollY = window.scrollY;
      this.tabBarFixed = scrollY > this.headerHeight;
      // avoids alteration of header by a rule of thumb... little bit conservative
      if (documentHeight - windowHeight > this.headerHeight) {
        this.isScrolledDown = scrollY > 2;
      } else {
        if (scrollY === 0) {
          this.isScrolledDown = false;
        }
      }
    },
    updateTabBarPosition() {
      this.tabBarDynamicLeftOffset =
        this.tabBarInitialLeftOffset +
        this.$refs["contentFrame"].getBoundingClientRect().left -
        this.contentInitialLeftOffset;
    },
    loadTds(event) {
      const file = event.target.files[0];
      if (!file) {
        return;
      }
      const reader = new FileReader();
      const typeIsP0 = /.P0$/i.test(file.name);
      if (typeIsP0) {
        reader.readAsArrayBuffer(file);
      } else {
        reader.readAsText(file);
      }
      reader.onload = (e) => {
        const fileContents = e.target.result;
        this.tdsFileName = file.name;
        setImportedFileName(file.name);
        if (typeIsP0) {
          processP0File(fileContents);
        } else {
          processTdsFile(fileContents);
        }
        this.contentsAltered = false;
      };
    },
    loadAgc(event) {
      const file = event.target.files[0];
      if (!file) {
        return;
      }
      const reader = new FileReader();
      reader.readAsText(file);
      reader.onload = (e) => {
        const fileContents = e.target.result;
        processAgcFile(fileContents);
        if (agcFileData.lines === null) {
          this.agcFileErrorDialog = true;
          this.agcFileName = null;
          if (agcFileData.error.explicit) {
            this.agcErrorDetails = `Error at line ${agcFileData.error.line}: ${agcFileData.error.explicit}`;
          } else {
            this.agcErrorDetails = `Unexpected error: ${agcFileData.error}`;
          }
        } else {
          this.agcFileName = file.name;
        }
      };
    },
    saveOutputFile() {
      const importedFileName = setImportedFileName(null);
      const appSuffix = reactiveData.Check_APP === "true" ? "_APP.agc" : "_NAP.agc";
      const agcFileName = importedFileName.shortFileName.length ? `${importedFileName.shortFileName}${appSuffix}` : this.agcFileName;
      translateCcu2gcau();
      const fileContents = agcFileData.lines.reduce((acc, val) => acc + `${val}\r\n`, "");
      download(fileContents, agcFileName, "text/plain");
      agcFileData.lines = agcFileData.refLines.map(l => l);
      agcFileData.struct = analyzeAgcFile(agcFileData.lines);
    },
  },
  created() {
    eventBus.$on("item-should-update", (item) => {
      const dataKey = tdsAlias[item.dataKey] === undefined ? item.dataKey : tdsAlias[item.dataKey];
      const isPartOfTda = dataKey.startsWith("meta_") === false;
      if (reactiveData[dataKey] !== item.value) {
        reactiveData[dataKey] = item.value;
        if (isPartOfTda) {
          this.contentsAltered = true;
        }
      }
      if (isPartOfTda) {
        reactiveData["meta_testKey"] = item.dataKey;
        reactiveData["meta_testValue"] = item.value;
      }
    });
  },
  mounted() {
    this.headerHeight = this.$refs["header"].offsetHeight;
    this.tabBarHeight = this.$refs["tabBar"].offsetHeight;
    this.tabBarInitialLeftOffset = this.$refs["tabBar"].getBoundingClientRect().left;
    this.tabBarDynamicLeftOffset = this.tabBarInitialLeftOffset;
    this.contentInitialLeftOffset = this.$refs["contentFrame"].getBoundingClientRect().left;
    this.updateTabBarPosition();
    window.addEventListener("scroll", this.onWindowScroll);
    window.addEventListener("resize", this.updateTabBarPosition);
  },
  destroyed() {
    window.removeEventListener("scroll", this.onWindowScroll);
    window.removeEventListener("resize", this.updateTabBarPosition);
  },
};
</script>

<style scoped>
.tabBarFixed {
  position: fixed;
  top: 0;
  z-index: 1;
}

.hide {
  display: none;
}

.headerMargin {
  margin-bottom: 6px;
}
</style>
