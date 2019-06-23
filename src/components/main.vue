<template>
  <v-container px-0 :class="{'py-0': isScrolledDown}">
    <v-layout justify-center>
      <v-flex xs12 lg11 xl7>
        <div ref="header" :class="{headerMargin: !isScrolledDown}">
          <v-toolbar>
            <v-toolbar-title class="headline text-uppercase">
              <span>CCU>GCAU</span>
              <span class="font-weight-light">Config. translator</span>
            </v-toolbar-title>
          </v-toolbar>
          <v-container :class="{hide: isScrolledDown}" pa-0>
            <v-layout justify-center>
              <v-flex xs2>
                <v-btn small @click="$refs.inputUpload.click()">Load</v-btn>
                <input
                  v-show="false"
                  ref="inputUpload"
                  type="file"
                  accept=".tdsa, .tdsn"
                  @change="loadTds"
                >
              </v-flex>
              <v-flex xs2>
                <v-btn small @click="saveOutputFile();">Save</v-btn>
                <a ref="outputSave" v-show="false" href download="sample.agc">Save</a>
              </v-flex>
            </v-layout>
          </v-container>
        </div>
        <div
          ref="tabBar"
          :class="{tabBarFixed: tabBarFixed}"
          :style="{left: `${tabBarDynamicLeftOffset}px`}"
        >
          <v-tabs @change="menuItemSelect">
            <v-tab>Admin</v-tab>
            <v-tab>System</v-tab>
            <v-tab>Alarms</v-tab>
          </v-tabs>
        </div>

        <div :class="{hide: !tabBarFixed}">
          <v-tabs>
            <v-tab/>
            <v-tab/>
            <v-tab/>
          </v-tabs>
        </div>

        <div ref="contentFrame">
          <v-tabs v-model="menuItemSelected" height="0">
            <v-tab/>
            <v-tab/>
            <v-tab/>
            <v-tab-item>
              <vyw-admin :tdsFileName="tdsFileName" :contentsAltered="contentsAltered"/>
            </v-tab-item>
            <v-tab-item>
              <vyw-system/>
            </v-tab-item>
            <v-tab-item>
              <vyw-alarms/>
            </v-tab-item>
          </v-tabs>
          <vyw-react-test/>
        </div>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
import VywAdmin from "./admin";
import VywSystem from "./system";
import VywAlarms from "./alarms";
import VywReactTest from "./react-test";
import { dataKeys, eventBus, processTdsFile, reactiveData } from "../data";
import { makeUrlTextFile } from "../utils";

export default {
  components: {
    VywAdmin,
    VywSystem,
    VywAlarms,
    VywReactTest,
  },
  data: () => ({
    menuItemSelected: undefined,
    dataKeys,
    headerHeight: undefined,
    tabBarHeight: undefined,
    tabBarInitialLeftOffset: undefined,
    contentInitialLeftOffset: undefined,
    tabBarDynamicLeftOffset: undefined,
    isScrolledDown: false,
    tabBarFixed: false,
    tdsFileName: "",
    contentsAltered: false,
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
      reader.readAsText(file);
      reader.onload = (e) => {
        const fileContents = e.target.result;
        processTdsFile(fileContents);
        this.tdsFileName = file.name;
        this.contentsAltered = false;
      };
    },
    saveOutputFile() {
      let sampleText = "";
      for (let i = 0; i < 500; i++) {
        sampleText += `this is line #${i + 1} of sample text...\n`;
      }
      this.$refs.outputSave.href = makeUrlTextFile(sampleText, true);
      this.$refs.outputSave.click();
    },
  },
  created() {
    eventBus.$on("item-should-update", (item) => {
      if (reactiveData[item.dataKey] !== item.value) {
        reactiveData[item.dataKey] = item.value;
      }
      if (item.dataKey.startsWith("meta_") === false) {
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
