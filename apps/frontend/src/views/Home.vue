<template>
  <div>
    <FileReader />
    <ResultsView />
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import ResultsView from "@/components/ResultsView.vue";
import FileReader from "@/components/FileReader.vue";

export default Vue.extend({
  components: {
    FileReader,
    ResultsView
  }
});
</script>
