<template>
  <div>
    <v-container pa-0>
      <v-layout wrap>
        <v-flex xs12 md6>
          <v-layout column>
            <v-flex pa-0>
              <vyw-alarm :title="alarmMF.title" :params="alarmMF.params" />
              <vyw-alarm :title="alarmHC.title" :params="alarmHC.params" />
              <vyw-alarm :title="alarmLC.title" :params="alarmLC.params" />
              <vyw-alarm :title="alarmHD.title" :params="alarmHD.params" />
              <vyw-alarm :title="alarmLD.title" :params="alarmLD.params" />
              <vyw-alarm :title="alarmRF.title" :params="alarmRF.params" />
              <vyw-alarm :title="alarmEFP.title" :params="alarmEFP.params" />
              <vyw-alarm :title="alarmEFM.title" :params="alarmEFM.params" />
            </v-flex>
          </v-layout>
        </v-flex>
        <v-flex xs12 md6>
          <v-layout>
            <v-flex>
              <vyw-alarm :title="alarmS1.title" :params="alarmS1.params" />
              <vyw-alarm :title="alarmS2.title" :params="alarmS2.params" />
              <vyw-alarm :title="alarmS3.title" :params="alarmS3.params" />
              <vyw-alarm :title="alarmS4.title" :params="alarmS4.params" />
              <vyw-alarm :title="alarmHT.title" :params="alarmHT.params" />
              <vyw-alarm :title="alarmHB.title" :params="alarmHB.params" />
              <vyw-alarm :title="alarmHR.title" :params="alarmHR.params" />
              <vyw-alarm :title="alarmCM.title" :params="alarmCM.params" :isCommonAlarm="false" />
            </v-flex>
          </v-layout>
        </v-flex>
      </v-layout>
    </v-container>
  </div>
</template>

<script>
import VywAlarm from "./alarm";

export default {
  components: {
    VywAlarm,
  },
  computed: {
    alarmMF() {
      return {
        title: "Mains out-of-range",
        params: {
          enabledId: "MF_Enabled",
          relayNbId: "MF_RelayOutput",
          delayId: "MF_Delay",
          latch: { displayId: "MF_LcdLatch", relayId: "MF_RelayLatch" },
          th1: {
            id: "MF_LowerLimit",
            title: "Min voltage",
            unit: "Vac",
            hint: "threshold",
            min: 90,
            max: 900,
          },
          th2: {
            id: "MF_UpperLimit",
            title: "Max voltage",
            unit: "Vac",
            hint: "threshold",
            min: 90,
            max: 900,
          },
        },
      };
    },
    alarmHC() {
      return {
        title: "High charge voltage",
        params: {
          enabledId: "HC_Enabled",
          relayNbId: "HC_RelayOutput",
          delayId: "HC_Delay",
          latch: { displayId: "HC_LcdLatch", relayId: "HC_RelayLatch" },
          th1: {
            id: "HC_LowerLimit",
            title: "Highrate",
            unit: "Vdc",
            hint: "threshold",
            min: "16",
            max: "900",
          },
          th2: {
            id: "HC_UpperLimit",
            title: "Floating",
            unit: "Vdc",
            hint: "threshold",
            min: "16",
            max: "900",
          },
        },
      };
    },
    alarmLC() {
      return {
        title: "Low charge voltage",
        params: {
          enabledId: "LC_Enabled",
          relayNbId: "LC_RelayOutput",
          delayId: "LC_Delay",
          latch: { displayId: "LC_LcdLatch", relayId: "LC_RelayLatch" },
          th1: {
            id: "LC_LowerLimit",
            title: "Low level",
            unit: "Vdc",
            hint: "threshold",
            min: "16",
            max: "900",
          },
        },
      };
    },
    alarmHD() {
      return {
        title: "High DC load voltage",
        params: {
          enabledId: "HD_Enabled",
          relayNbId: "HD_RelayOutput",
          delayId: "HD_Delay",
          latch: { displayId: "HD_LcdLatch", relayId: "HD_RelayLatch" },
          th1: {
            id: "HD_UpperLimit",
            title: "High level",
            unit: "Vdc",
            hint: "threshold",
            min: "16",
            max: "900",
          },
        },
      };
    },
    alarmLD() {
      return {
        title: "Low DC load voltage",
        params: {
          enabledId: "LD_Enabled",
          relayNbId: "LD_RelayOutput",
          delayId: "LD_Delay",
          latch: { displayId: "LD_LcdLatch", relayId: "LD_RelayLatch" },
          th1: {
            id: "LD_LowerLimit",
            title: "Low level",
            unit: "Vdc",
            hint: "threshold",
            min: "16",
            max: "900",
          },
        },
      };
    },
    alarmRF() {
      return {
        title: "Rectifier failure",
        params: {
          enabledId: "RF_Enabled",
          relayNbId: "RF_RelayOutput",
          delayId: "RF_Delay",
          latch: { displayId: "RF_LcdLatch", relayId: "RF_RelayLatch" },
        },
      };
    },
    alarmEFP() {
      return {
        title: "Earth fault plus (+)",
        params: {
          enabledId: "EFP_Enabled",
          relayNbId: "EFP_RelayOutput",
          delayId: "EFP_Delay",
          latch: { displayId: "EFP_LcdLatch", relayId: "EFP_RelayLatch" },
        },
      };
    },
    alarmEFM() {
      return {
        title: "Earth fault minus (-)",
        params: {
          enabledId: "EFM_Enabled",
          relayNbId: "EFM_RelayOutput",
          delayId: "EFM_Delay",
          latch: { displayId: "EFM_LcdLatch", relayId: "EFM_RelayLatch" },
        },
      };
    },
    alarmS1() {
      return {
        title: "Spare 1 (X8.1)",
        params: {
          enabledId: "S1_Enabled",
          relayNbId: "S1_RelayOutput",
          delayId: "S1_Delay",
          latch: { displayId: "S1_LcdLatch", relayId: "S1_RelayLatch" },
          text: "S1_Text",
        },
      };
    },
    alarmS2() {
      return {
        title: "Spare 2 (X8.2)",
        params: {
          enabledId: "S2_Enabled",
          relayNbId: "S2_RelayOutput",
          delayId: "S2_Delay",
          latch: { displayId: "S2_LcdLatch", relayId: "S2_RelayLatch" },
          text: "S2_Text",
        },
      };
    },
    alarmS3() {
      return {
        title: "Spare 3 (X8.3)",
        params: {
          enabledId: "S3_Enabled",
          relayNbId: "S3_RelayOutput",
          delayId: "S3_Delay",
          latch: { displayId: "S3_LcdLatch", relayId: "S3_RelayLatch" },
          text: "S3_Text",
        },
      };
    },
    alarmS4() {
      return {
        title: "Spare 4 (X8.4)",
        params: {
          enabledId: "S4_Enabled",
          relayNbId: "S4_RelayOutput",
          delayId: "S4_Delay",
          latch: { displayId: "S4_LcdLatch", relayId: "S4_RelayLatch" },
          text: "S4_Text",
        },
      };
    },
    alarmHT() {
      return {
        title: "High temperature",
        params: {
          enabledId: "HT_Enabled",
          relayNbId: "HT_RelayOutput",
          delayId: "HT_Delay",
          latch: { displayId: "HT_LcdLatch", relayId: "HT_RelayLatch" },
        },
      };
    },
    alarmHB() {
      return {
        title: "High battery current",
        params: {
          enabledId: "HB_Enabled",
          relayNbId: "HB_RelayOutput",
          delayId: "HB_Delay",
          latch: { displayId: "HB_LcdLatch", relayId: "HB_RelayLatch" },
          th1: {
            id: "HB_UpperLimit",
            title: "High level",
            unit: "Amps",
            hint: "threshold",
            min: "0",
            max: "1000",
          },
        },
      };
    },
    alarmHR() {
      return {
        title: "High rectifier current",
        params: {
          enabledId: "HR_Enabled",
          relayNbId: "HR_RelayOutput",
          delayId: "HR_Delay",
          latch: { displayId: "HR_LcdLatch", relayId: "HR_RelayLatch" },
          th1: {
            id: "HR_UpperLimit",
            title: "High level",
            unit: "Amps",
            hint: "threshold",
            min: "0",
            max: "1000",
          },
        },
      };
    },
    alarmCM() {
      return {
        title: "Common alarm",
        params: {
          enabledId: "CM_Enabled",
          latch: { relayId: "CM_RelayLatch" },
        },
      };
    },
  },
};
</script>

<style scoped></style>
