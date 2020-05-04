<template>
  <div>
    <v-card>
      <v-container pt-3>
        <v-layout text-xs-center align-content-center wrap>
          <v-flex px-1>
            <v-container pa-0>
              <v-layout column>
                <v-flex pb-3 text-xs-left pl-0 v-show="tdsFileName.length>0">
                  <v-card color="blue-grey lighten-4" class="black--text">
                    <v-card-text class="pl-2 elevation-6">
                      <span class="font-italic">Imported file:</span> &nbsp;
                      <span class="body-2 blue-grey--text text-darken-4">{{tdsFileName}}</span>
                      <span v-show="contentsAltered">
                        &nbsp;
                        <v-icon small>star</v-icon>
                        <v-icon small>star</v-icon>
                      </span>
                    </v-card-text>
                  </v-card>
                </v-flex>
                <v-flex>
                  <vyw-text-input data-key="Text_Nom" label="Name" hint="Project manager" />
                </v-flex>
                <v-flex>
                  <vyw-text-input data-key="Text_Origine" label="Origin" />
                </v-flex>
                <v-flex>
                  <vyw-text-input data-key="Text_Devis" label="Quotation" />
                </v-flex>
                <v-flex>
                  <vyw-text-input data-key="Text_Client" label="Customer" />
                </v-flex>
                <v-flex>
                  <div class="d-flex">
                    <div>
                      <vyw-switch data-key="Check_APP" :labels="['Not approved', 'Approved']"></vyw-switch>
                    </div>
                    <div>
                      <vyw-text-input data-key="Edit_CONTROL" label="Approver" />
                    </div>
                  </div>
                </v-flex>
              </v-layout>
            </v-container>
          </v-flex>
          <v-flex xs12 sm6 px-1>
            <v-container pa-0>
              <v-layout column>
                <v-flex>
                  <v-flex>
                    <vyw-text-input data-key="Text_Commande" label="Order" />
                  </v-flex>
                  <v-flex>
                    <vyw-text-input data-key="Text_Projet" label="Project" />
                  </v-flex>
                  <v-flex>
                    <vyw-text-input data-key="Text_ClientFinal" label="End user" />
                  </v-flex>
                  <v-flex>
                    <vyw-text-input data-key="SystemId" label="Identification number" />
                  </v-flex>
                  <vyw-text-area
                    data-key="Edit_COMMENT"
                    label="Notes"
                    hint="project notes/comments"
                  />
                </v-flex>
              </v-layout>
            </v-container>
          </v-flex>
        </v-layout>
      </v-container>
    </v-card>
  </div>
</template>

<script>
import VywTextArea from "./basics/vyw-text-area";
import VywTextInput from "./basics/vyw-text-input";
import VywSwitch from "./basics/vyw-switch";

export default {
  props: { tdsFileName: String, contentsAltered: Boolean },
  components: {
    VywTextArea,
    VywTextInput,
    VywSwitch,
  },
};
</script>

<style scoped>
</style>
