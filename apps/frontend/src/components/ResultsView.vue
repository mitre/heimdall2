<template>
  <v-container fluid grid-list-md pa-5>
    <!-- Count Cards -->
    <StatusCardRow />

    <!-- Compliance Cards -->
    <v-layout align-start justify-space-around row>
      <v-flex
        v-for="card in cards_two"
        :key="card.title"
        v-bind="{ [`xs${card.flex}`]: true }"
      >
        <v-card>
          <v-img
            :src="card.src"
            class="white--text"
            height="200px"
            gradient="to bottom, rgba(0,0,0,.1), rgba(0,0,0,.5)"
          >
            <v-card-title
              class="fill-height"
              v-text="card.title"
            ></v-card-title>
          </v-img>
        </v-card>
      </v-flex>
    </v-layout>

    <!-- TreeMap and Partition Map -->
    <v-sheet class="my-4 px-4" elevation="2" title="test">
      <h2>TreeMap and Others</h2>
    </v-sheet>

    <!-- DataTable -->
    <v-sheet class="my-4 px-4" elevation="2">
      <h2>Results View Data</h2>
      <ControlTable />
    </v-sheet>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import StatusCardRow from "@/components/cards/StatusCardRow.vue";
import TreeMap from "@/components/TreeMap.vue";
import ControlTable from "@/components/ControlTable.vue";

interface Card {
  title: string;
  src: string;
  flex: number;
}

// We declare the props separately
// to make props types inferable.
const ResultsProps = Vue.extend({
  props: {}
});

@Component({
  components: {
    StatusCardRow,
    TreeMap,
    ControlTable
  }
})
export default class Results extends ResultsProps {
  cards_two: Card[] = [
    {
      title: "Pre-fab homes",
      src: "https://cdn.vuetifyjs.com/images/cards/house.jpg",
      flex: 4
    },
    {
      title: "Favorite road trips",
      src: "https://cdn.vuetifyjs.com/images/cards/road.jpg",
      flex: 4
    },
    {
      title: "Bestest airlines",
      src: "https://cdn.vuetifyjs.com/images/cards/plane.jpg",
      flex: 4
    }
  ];
}
</script>
