<template>
  <div :watcher="file_num_watch">
    <v-row @click="viewAll">
      <!-- Control ID -->
      <v-col cols="3" xs="3" sm="2" md="1" class="pt-0">
        <div style="text-align: center; padding: 19px">
          {{ control_id }}
        </div>
      </v-col>

      <!-- Various Statuses -->
      <v-col
        v-for="index in shown_files"
        :key="index - 1"
        cols="4"
        xs="4"
        md="5"
        filter
        :value="index - 1"
      >
        <v-btn
          v-if="hdf_controls[index - 1 + shift] != null"
          width="100%"
          :color="`status${hdf_controls[index - 1 + shift].status.replace(
            ' ',
            ''
          )}`"
          centered
          :depressed="selection[index - 1 + shift]"
          :outlined="selection[index - 1 + shift]"
          @click="view(index - 1 + shift)"
        >
          <template
            v-if="hdf_controls[index - 1 + shift].status == 'Not Applicable'"
          >
            Not <br />
            Applicable
          </template>
          <template
            v-else-if="hdf_controls[index - 1 + shift].status == 'Not Reviewed'"
          >
            Not <br />
            Reviewed
          </template>
          <template v-else>
            {{ hdf_controls[index - 1 + shift].status }}
          </template>
        </v-btn>
      </v-col>
    </v-row>
    <div v-if="num_selected > 0">
      <v-row>
        <v-col key="delta" cols="12">
          <DeltaView :delta="delta" :shift="shift" />
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="3" xs="3" sm="2" md="1" />
        <v-col
          v-for="index in shown_files"
          :key="index - 1"
          cols="4"
          xs="4"
          md="5"
        >
          <ControlRowDetails
            v-if="selection[index - 1 + shift]"
            :tab.sync="tab"
            :control="controls[index - 1 + shift]"
          />
        </v-col>
        <!-- </transition-group> -->
      </v-row>
    </div>
    <v-divider dark />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import {context} from 'inspecjs';
import {HDFControl} from 'inspecjs';
import {ControlDelta} from '@/utilities/delta_util';
import DeltaView from '@/components/cards/comparison/DeltaView.vue';
import ControlRowDetails from '@/components/cards/controltable/ControlRowDetails.vue';
import {FilteredDataModule} from '@/store/data_filters';
import {Prop} from 'vue-property-decorator';

@Component({
  components: {
    DeltaView,
    ControlRowDetails
  }
})
export default class CompareRow extends Vue {
  @Prop({type: Array, required: true})
  readonly controls!: context.ContextualizedControl[];
  @Prop({type: Number, required: true}) readonly shown_files!: number;
  @Prop({type: Number, required: true}) readonly shift!: number;

  /** Models the currently selected chips. If it's a number */
  selection: boolean[] = [];
  tab: string = 'tab-test';

  /** Initialize our selection */
  mounted() {
    // Pick the first and last control, or as close as we can get to that
    if (this.controls.length === 0) {
      this.selection.splice(0);
    } else if (this.controls.length === 1) {
      this.selection.push(false);
    } else {
      this.selection = [];
      this.controls.forEach(() => {
        this.selection.push(false);
      });
    }
  }

  get control_id(): string {
    for (let ctrl of this.hdf_controls) {
      if (ctrl != null) {
        return ctrl.wraps.id;
      }
    }
    return 'Error';
  }

  /** Provides actual data about which controls we have selected */
  get selected_controls(): context.ContextualizedControl[] {
    // Multiple selected
    var selected = [];
    var i;
    for (i = 0; i < this.selection.length; i++) {
      if (this.selection[i]) {
        selected.push(this.controls[i]);
      }
    }
    return selected;
  }

  /** Just maps controls to hdf. Makes our template a bit less verbose */
  get hdf_controls(): Array<HDFControl | null> {
    return this.controls.map((c) => {
      if (c == null) {
        return null;
      }
      return c.root.hdf;
    });
  }

  /** If exactly two controls selected, provides a delta. Elsewise gives null */
  get delta(): ControlDelta | null {
    let delt_data = [];
    let parse = 0;
    for (let i = 0; i < this.selection.length; i++) {
      if (this.selection[i]) {
        delt_data.push(this.selected_controls[parse]);
        parse++;
      } else {
        delt_data.push(null);
      }
    }
    return new ControlDelta(delt_data);
  }

  //This is used to SELECT controls to view their data
  view(index: number) {
    Vue.set(this.selection, index, !this.selection[index]);
  }

  viewAll() {
    let allTrue = true;
    for (let i = 0; i < this.selection.length; i++) {
      if (!this.selection[i]) {
        allTrue = false;
        break;
      }
    }
    for (let i = 0; i < this.selection.length; i++) {
      Vue.set(this.selection, i, !allTrue);
    }
  }

  //returns the number of selected controls in a row, used to determine what to show
  get num_selected(): number {
    var selected = 0;
    var i;
    for (i = 0; i < this.selection.length; i++) {
      if (this.selection[i]) {
        selected += 1;
      }
    }
    return selected;
  }

  //Updates selection array to match file count
  get file_num_watch(): string {
    this.selection = FilteredDataModule.selected_file_ids.map(() => false);
    return FilteredDataModule.selected_file_ids.length + '';
  }
  /** If more than one row selected */
}
</script>
