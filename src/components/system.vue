<template>
  <v-card>
    <v-container pt-3>
      <v-layout wrap>
        <v-flex xs12 sm6 px-1 align-content-center>
          <v-container pa-0>
            <v-layout column>
              <v-flex>
                <vyw-select-input
                  data-key="Combo_LANGUE"
                  label="Language"
                  :item-list="selectChoices.languages"
                  hint="local language"
                  :on-changed="valueChanged"
                />
              </v-flex>
              <v-flex>
                <vyw-numeric-input
                  data-key="Edit_ENV_TA"
                  label="Room temperature"
                  suffix="C"
                  :bottom="Number(-30)"
                  :top="Number(60)"
                  hint="[-30; +60]"
                  :on-changed="valueChanged"
                />
              </v-flex>
              <v-flex>
                <vyw-numeric-input
                  data-key="Edit_ENV_ALT"
                  label="Altitude"
                  suffix="m"
                  :bottom="Number(0)"
                  :top="Number(8000)"
                  hint="[0-8,000]"
                  :on-changed="valueChanged"
                />
              </v-flex>
              <v-flex>
                <v-container pa-0>
                  <v-layout pa-0 justify-center>
                    <v-flex xs5>
                      <vyw-switch
                        data-key="Check_SDM_TR"
                        :labels="['No AC meter', 'AC meter present']"
                        :on-changed="valueChanged"
                      />
                    </v-flex>
                    <v-flex xs5>
                      <vyw-switch
                        data-key="Check_SDM_TU"
                        :labels="['No VLoad meter', 'VLoad meter present']"
                        :on-changed="valueChanged"
                      />
                    </v-flex>
                  </v-layout>
                </v-container>
              </v-flex>
            </v-layout>
          </v-container>
        </v-flex>
        <v-flex xs12 sm6 px-1>
          <v-container pa-0>
            <v-layout column>
              <v-flex>
                <vyw-numeric-input
                  data-key="Edit_DEF_TDFLPE"
                  label="Vfloat per cell"
                  suffix="V"
                  :bottom="Number(1)"
                  :top="Number(3)"
                  hint="[1~3]"
                  :on-changed="valueChanged"
                />
              </v-flex>
              <v-flex>
                <vyw-numeric-input
                  data-key="Edit_DEF_CET2"
                  label="Temperature compensation"
                  suffix="%/C"
                  :bottom="Number(0.1)"
                  :top="Number(0.4)"
                  hint="[0.1~0.4]"
                  :on-changed="valueChanged"
                />
              </v-flex>
              <v-flex>
                <vyw-numeric-input
                  data-key="Edit_SHUNT_CN"
                  label="Battery current"
                  suffix="Amps"
                  :bottom="Number(1)"
                  :top="Number(9999)"
                  hint="[1~9,999]"
                  :on-changed="valueChanged"
                />
              </v-flex>
            </v-layout>
          </v-container>
        </v-flex>
      </v-layout>
    </v-container>
  </v-card>
</template>

<script>
import VywNumericInput from "./basics/vyw-numeric-input";
import VywSelectInput from "./basics/vyw-default-select";
import VywSwitch from "./basics/vyw-switch";
import { selectChoices } from "../data";
import { implementValueChanged } from "../mixins";

export default {
  components: {
    VywNumericInput,
    VywSelectInput,
    VywSwitch,
  },
  data: () => ({
    selectChoices,
  }),
  mixins: [implementValueChanged],
};
</script>

<style scoped>
</style>
