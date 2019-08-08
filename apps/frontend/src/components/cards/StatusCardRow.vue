<template>
  <v-layout align-start justify-space-around row>
    <v-flex v-for="card in cardProps" :key="card.title" xs12 sm6 md3>
      <v-card :color="card.color" dark height="100px">
        <v-card-title>
          <v-icon large left>mdi-{{ card.icon }}</v-icon>
          <span class="title">{{ card.title + ": " + card.number }}</span>
        </v-card-title>
        <v-card-text v-text="card.subtitle" />
      </v-card>
    </v-flex>
  </v-layout>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

interface CardProps {
  icon: string;
  title: string;
  number: number;
  subtitle: string;
  color: string;
}

// We declare the props separately to make props types inferable.
const StatusCardRowProps = Vue.extend({
  props: {}
});

@Component({
  components: {}
})
export default class StatusCardRow extends StatusCardRowProps {
  // Cards
  get cardProps(): CardProps[] {
    return [
      {
        icon: "check-circle",
        title: "Passed",
        subtitle: "All tests passed.",
        color: "#0f0", // These shouldn't be hard coded
        number: this.$store.getters["statusCounts/passed"]({})
      },
      {
        icon: "close-circle",
        title: "Failed",
        subtitle: "Has tests that failed.",
        color: "#f00",
        number: this.$store.getters["statusCounts/failed"]({})
      },
      {
        icon: "minus-circle",
        title: "Not Applicable",
        subtitle: "System exception/absent component.",
        color: "#00f",
        number: this.$store.getters["statusCounts/notApplicable"]({})
      },
      {
        icon: "alert-circle",
        title: "Not Reviewed",
        subtitle: "Manual testing required/disabled test.",
        color: "#888",
        number: this.$store.getters["statusCounts/notReviewed"]({})
      }
    ];
  }
}
</script>
