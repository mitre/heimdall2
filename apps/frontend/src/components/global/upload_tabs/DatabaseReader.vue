<template>
  <v-card class="elevation-0">
    <v-card-subtitle
      >Easily load any supported Heimdall Data Format file</v-card-subtitle
    >
    <v-container>
      <v-data-table
        dense
        :headers="headers"
        :items="items"
        :search="search"
        :hide-default-header="hideHeaders"
        :show-select="showSelect"
        :loading="isLoading"
        item-key="name"
        class="elevation-1"
      >
        <template v-slot:body="{ items }">
          <tbody>
            <tr v-for="item in items" :key="item.name">
              <td>{{ item.filename }}</td>
              <td>{{ item.version }}</td>
              <td>
                <v-btn icon @click="load_this_evaluation(item)">
                  <v-icon>mdi-plus-circle</v-icon>
                </v-btn>
              </td>
            </tr>
          </tbody>
        </template>
      </v-data-table>
    </v-container>
  </v-card>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { getModule } from "vuex-module-decorators";
import ServerModule from "@/store/server";
import AppInfoModule from "@/store/app_info";
import { plainToClass } from "class-transformer";
import { LocalStorageVal } from "@/utilities/helper_util";
import InspecIntakeModule, {
  FileID,
  next_free_file_ID
} from "@/store/report_intake";
import { Evaluation } from "@/types/models.ts";

export interface RetrieveHash {
  unique_id: number;
  eva: Evaluation;
}

const local_evaluation_id = new LocalStorageVal<number | null>("evaluation_id");

// We declare the props separately to make props types inferable.
const Props = Vue.extend({
  props: {}
});
/**
 * File reader component for taking in inspec JSON data.
 * Uploads data to the store with unique IDs asynchronously as soon as data is entered.
 * Emits "got-files" with a list of the unique_ids of the loaded files.
 */
@Component({
  components: {}
})
export default class DatabaseReader extends Props {
  get headers(): Object[] {
    return [
      {
        text: "Filename",
        align: "start",
        sortable: true,
        value: "filename"
      },
      { text: "Version", sortable: true, value: "version" },
      { text: "Select", value: "select" }
    ];
  }
  get search(): string {
    return "";
  }
  get hideHeaders(): Boolean {
    return false;
  }
  get showSelect(): Boolean {
    return false;
  }
  get isLoading(): Boolean {
    return false;
  }

  get items(): Evaluation[] {
    let mod = getModule(ServerModule, this.$store);
    if (mod.user_evaluations) {
      let eval_obj = Array.from(mod.user_evaluations) || [];
      const evals: Evaluation[] = eval_obj.map((x: any) =>
        plainToClass(Evaluation, x)
      );
      console.log("evals: " + evals.length);
      evals.forEach(eva => {
        eva.filename = this.evaluation_label(eva);
      });
      return evals;
    } else {
      return [new Evaluation()];
    }
  }

  get personal_evaluations(): Evaluation[] {
    let mod = getModule(ServerModule, this.$store);
    if (mod.user_evaluations) {
      let eval_obj = Array.from(mod.user_evaluations) || [];
      const evals: Evaluation[] = eval_obj.map((x: any) =>
        plainToClass(Evaluation, x)
      );
      console.log("evals: " + evals.length);
      return evals;
    } else {
      return [new Evaluation()];
    }
  }

  evaluation_label(evaluation: Evaluation): string {
    let label = evaluation.version;
    if (evaluation.tags) {
      evaluation.tags.forEach(tag => {
        console.log("tag " + tag.content.name + ": " + tag.content.value);
        if (tag.content.name == "filename") {
          label = tag.content.value;
        }
      });
    }
    return label;
  }

  async load_this_evaluation(evaluation: Evaluation): Promise<void> {
    console.log("load this file: " + evaluation.id);
    const host = process.env.VUE_APP_API_URL!;
    // Generate an id
    let unique_id = next_free_file_ID();

    let mod = getModule(ServerModule, this.$store);
    await mod
      .connect(host)
      .catch(bad => {
        console.error("Unable to connect to " + host);
      })
      .then(() => {
        console.log("here");
        let eva_hash: RetrieveHash = {
          unique_id: unique_id,
          eva: evaluation
        };
        return mod.retrieve_evaluation(eva_hash);
      })
      .catch(bad => {
        console.error(`bad login ${bad}`);
      })
      .then(() => {
        console.log("Loaded " + unique_id);
        this.$emit("got-files", [unique_id]);
      });
  }
}
</script>
