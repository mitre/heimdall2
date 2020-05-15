<template>
  <v-card>
    <v-card-subtitle
      >Easily load any supported Heimdall Data Format file</v-card-subtitle
    >
    <v-container>
      <v-list>
        <v-list-item
          v-for="(evaluation, index) in personal_evaluations"
          :key="index"
        >
          <v-list-item-content>
            <v-list-item-title v-text="evaluation_label(evaluation)" />
          </v-list-item-content>
          <v-list-item-action>
            <v-btn icon @click="load_this_evaluation(evaluation)">
              <v-icon>mdi-plus-circle</v-icon>
            </v-btn>
          </v-list-item-action>
        </v-list-item>
      </v-list>
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
import InspecIntakeModule, {
  FileID,
  next_free_file_ID
} from "@/store/report_intake";

export class Content {
  name!: string;
  value!: string;
}
export class Evaluation {
  id!: number;
  version!: string;
  createdAt!: Date;
  updatedAt!: Date;
  tags!: Tag[];
}
export class Tag {
  id!: number;
  tagger_id!: number;
  tagger_type!: string;
  content!: Content;
  createdAt!: Date;
  updatedAt!: Date;
}

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

    // TODO
    let filename = "evaluation";

    // Get intake module
    let intake_module = getModule(InspecIntakeModule, this.$store);
    let mod = getModule(ServerModule, this.$store);
    await mod
      .connect(host)
      .catch(bad => {
        console.error("Unable to connect to " + host);
      })
      .then(() => {
        console.log("here");
        return mod.retrieve_evaluation(evaluation.id);
      })
      .catch(bad => {
        console.error(`bad login ${bad}`);
      })
      .then(() => {
        console.log("here2");
        if (mod.evaluation) {
          console.log("here3");
          //let upload = `{"unique_id": ${unique_id},"filename": "${filename}","execution":${JSON.stringify(
          //  mod.evaluation
          //)}}`;
          intake_module.loadText({
            text: JSON.stringify(mod.evaluation),
            unique_id: unique_id,
            filename: filename
          });
          console.log("Loaded " + unique_id);
          this.$emit("got-files", [unique_id]);
        }
      });
  }
}
</script>
