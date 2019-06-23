<template>
  <v-container pa-0>
    <v-layout wrap>
      <v-flex xs12 md6>
        <v-layout column>
          <v-flex pa-0>
            <vyw-alarm :title="alarm1.title" :params="alarm1.params"/>
            <vyw-alarm :title="alarm2.title" :params="alarm2.params"/>
          </v-flex>
        </v-layout>
      </v-flex>
      <v-flex xs12 md6>
        <v-layout>
          <v-flex>
            <vyw-alarm :title="alarm10.title" :params="alarm10.params"/>
            <vyw-alarm :title="alarm11.title" :params="alarm11.params"/>
            <vyw-alarm :title="alarm20.title" :params="alarm20.params" :isCommonAlarm="true"/>
          </v-flex>
        </v-layout>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
import VywAlarm from "./alarm";

export default {
  components: {
    VywAlarm,
  },
  computed: {
    alarm1() {
      return {
        title: "Mains failure",
        params: {
          enabledId: "Check_TRTHOTB",
          relayNbId: "Combo_TRTHOTB_REL",
          delayId: "Edit_TRTHOTB_TEMP",
          latch: { displayId: "Check_TRTHOTB_AFF", relayId: "Check_TRTHOTB_REL" },
          th1: {
            id: "Edit_TRTHOTB_TMIN",
            title: "Minimum",
            unit: "Vac",
            hint: "threshold",
            min: 90,
            max: 900,
          },
          th2: {
            id: "Edit_TRTHOTB_TMAX",
            title: "Maximum",
            unit: "Vac",
            hint: "threshold",
            min: 90,
            max: 900,
          },
        },
      };
    },
    alarm2() {
      return {
        title: "High DC voltage",
        params: {
          enabledId: "Check_TUH",
          relayNbId: "Combo_TUH_REL",
          delayId: "Edit_TUH_TEMPS",
          latch: { displayId: "Check_TUH_AFF", relayId: "Check_TUH_REL" },
          th1: {
            id: "Edit_TUH_NH",
            title: "Minimum",
            unit: "Vdc",
            hint: "threshold",
            min: "16",
            max: "900",
          },
        },
      };
    },
    alarm10() {
      return {
        title: "Spare 1",
        params: {
          enabledId: "Check_R1",
          relayNbId: "Combo_R1_REL",
          delayId: "Edit_R1_TEMPS",
          latch: { displayId: "Check_R1_AFF", relayId: "Check_R1_REL" },
          text: "Edit_R1_TDA",
        },
      };
    },
    alarm11() {
      return {
        title: "Spare 2",
        params: {
          enabledId: "Check_R2",
          relayNbId: "Combo_R2_REL",
          delayId: "Edit_R2_TEMPS",
          latch: { displayId: "Check_R2_AFF", relayId: "Check_R2_REL" },
          text: "Edit_R2_TDA",
        },
      };
    },
    alarm20() {
      return {
        title: "Common alarm",
        params: {
          enabledId: "Check_AC",
          latch: { relayId: "Check_AC_REL" },
        },
      };
    },
  },
};
</script>

<style scoped>
</style>
