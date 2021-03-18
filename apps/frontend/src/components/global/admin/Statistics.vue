<template>
  <v-card>
    <v-card-title> Heimdall Deployment Statistics </v-card-title>
    <div v-if="!loading">
      <v-simple-table dark>
        <template #default>
          <tbody>
            <tr v-for="(value, name) in statistics" :key="name">
              <td>{{ toCapitalizedWords(name) }}</td>
              <td>{{ value }}</td>
            </tr>
          </tbody>
        </template>
      </v-simple-table>
    </div>
    <div v-else>
      <v-progress-linear indeterminate :size="80" :width="20" />
    </div>
  </v-card>
</template>

<script lang="ts">
import Vue from 'vue';
import axios from 'axios';
import {IStatistics} from '@heimdall/interfaces'
import {Component} from 'vue-property-decorator';

@Component({})
export default class Statistics extends Vue {
    statistics: IStatistics = {
        userCount: 0,
        evaluationCount: 0,
        evaluationTagCount: 0,
        groupCount: 0
    };
    loading = true;

    mounted() {
        this.updateStatistics()
    }

    updateStatistics() {
        return axios.get<IStatistics>(`/statistics`).then(({data}) => {
            this.statistics = data;
            this.loading = false;
        });
    }

    toCapitalizedWords(variable: string) {
        var words = variable.match(/[A-Za-z][a-z]*/g) || [];
        return words.map(this.capitalize).join(" ");
    }

    capitalize(word: string) {
        return word.charAt(0).toUpperCase() + word.substring(1);
    }
}
</script>
