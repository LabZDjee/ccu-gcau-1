<template>
  <v-app>
    <v-content>
      <main-contents/>
    </v-content>
  </v-app>
</template>

<script>
import mainContents from "./components/main";

export default {
  name: "App",
  components: {
    mainContents,
  },
};
</script>

<style scoped>
</style>
