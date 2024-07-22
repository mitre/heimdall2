<template>
  <v-container fluid class="font-weight-bold">
    <div
      ref="controlTableTitle"
      :class="
        $vuetify.breakpoint.smAndDown
          ? 'control-table-title'
          : 'pinned-header control-table-title'
      "
      :style="controlTableTitleStyle"
    >
      <!-- Toolbar -->

      <!-- Header. This should mirror the structure of ControlRowHeader -->
    </div>

    <!-- Body -->
    <v-row>
      <v-col>
        <v-data-table
          :items="raw_items"
          :headers="headers"
          :items-per-page="-1"
          :item-key="'bom-ref'"
          show-expand
          hide-default-footer
        >
          <template #top>
            <v-card-title class="pb-0">Component View Data</v-card-title>
          </template>
          <template #expanded-item="{headers, item}">
            <td class="m-10 p-10" :colspan="headers.length">
              More info about {{ item.name }} <br />
              Properties {{ item.properties }} <br />
              <span v-for="reference in item.externalReferences">
                <a href="reference.url">{{ reference.type }}</a
                ><br />
              </span>
              Purl: {{ item.purl }} Licenses: {{ item.licenses }}
            </td>
          </template>
        </v-data-table>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import ControlRowDetails from '@/components/cards/controltable/ControlRowDetails.vue';
import ControlRowHeader from '@/components/cards/controltable/ControlRowHeader.vue';
import ResponsiveRowSwitch from '@/components/cards/controltable/ResponsiveRowSwitch.vue';
import ColumnHeader, {Sort} from '@/components/generic/ColumnHeader.vue';
import {Filter, FilteredData, FilteredDataModule} from '@/store/data_filters';
import {HeightsModule} from '@/store/heights';
import {getControlRunTime} from '@/utilities/delta_util';
import {control_unique_key} from '@/utilities/format_util';
import {ContextualizedControl, severities} from 'inspecjs';
import * as _ from 'lodash';
import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop, Ref} from 'vue-property-decorator';

interface SBOMComponent {
  name: string;
  version: string;
  dependents: number;
  id: string;
  author: string;
}

interface Passthrough {
  auxiliary_data: {
    name: string;
    data: {
      components: SBOMComponent[];
    };
  }[];
}

@Component({
  components: {
    ControlRowHeader,
    ControlRowDetails,
    ColumnHeader,
    ResponsiveRowSwitch
  }
})
export default class ComponentTable extends Vue {
  @Ref('controlTableTitle') readonly controlTableTitle!: Element;
  @Prop({type: Object, required: true}) readonly filter!: Filter;

  // Whether to allow multiple expansions
  singleExpand = true;

  // If the currently selected tab should sync
  syncTabs = false;
  syncTab = 'tab-test';

  // List of currently expanded options. If unique id is in here, it is expanded
  expanded: string[] = [];

  // Sorts
  sortId: Sort = 'none';
  sortStatus: Sort = 'none';
  sortSet: Sort = 'none';
  sortSeverity: Sort = 'none';
  sortRunTime: Sort = 'none';

  // Used for viewed/unviewed controls.
  viewedControlIds: string[] = [];
  displayUnviewedControls = true;

  headers = [
    {
      text: 'Component Name',
      value: 'name'
    },
    {
      text: 'Version',
      value: 'version'
    },
    {
      text: 'Group',
      value: 'group'
    },
    {
      text: 'BOM Ref',
      value: 'bom-ref'
    },
    {
      text: 'Type',
      value: 'type'
    },
    {
      text: 'Author',
      value: 'author'
    },
    {
      text: 'Description',
      value: 'description'
    }
  ];

  get numOfViewed() {
    return this.raw_items.filter((elem) =>
      this.viewedControlIds.some((id) => elem.control.data.id === id)
    ).length;
  }

  toggleControlViewed(control: ContextualizedControl) {
    const alreadyViewed = this.viewedControlIds.indexOf(control.data.id);
    // If the control hasn't been marked as viewed yet, mark it as viewed.
    if (alreadyViewed === -1) {
      this.viewedControlIds.push(control.data.id);
    }
    // Else, remove it from the view controls array.
    else {
      this.viewedControlIds.splice(alreadyViewed, 1);
    }
  }

  mounted() {
    this.onResize();
  }

  onResize() {
    // Allow the page to settle before checking the controlTableHeader height
    // (this is what $nextTick is supposed to do but it's firing too quickly)
    setTimeout(() => {
      HeightsModule.setControlTableHeaderHeight(
        this.controlTableTitle?.clientHeight
      );
    }, 2000);
  }

  /** Callback to handle setting a new sort */
  set_sort(column: string, newSort: Sort) {
    this.sortId = 'none';
    this.sortSet = 'none';
    this.sortStatus = 'none';
    this.sortSeverity = 'none';
    this.sortRunTime = 'none';
    switch (column) {
      case 'id':
        this.sortId = newSort;
        break;
      case 'status':
        this.sortStatus = newSort;
        break;
      case 'set':
        this.sortSet = newSort;
        break;
      case 'severity':
        this.sortSeverity = newSort;
        break;
      case 'runTime':
        this.sortRunTime = newSort;
        break;
    }
  }

  get controlTableTitleStyle() {
    return {top: `${HeightsModule.topbarHeight}px`};
  }

  get controlRowPinOffset() {
    // There is ~10px of padding being added which makes the ControlRowHeader look out of place
    return {top: `${this.topOfPage - 10}px`};
  }

  // The top of the page, relative to the topbar and the title bar
  get topOfPage() {
    return HeightsModule.topbarHeight + HeightsModule.controlTableHeaderHeight;
  }

  async updateTab(tab: string) {
    this.syncTab = tab;
  }

  /** Toggles the given expansion of a control details panel */
  toggle(key: string) {
    if (this.singleExpand) {
      // Check if key already there
      const had = this.expanded.includes(key);

      // Clear
      this.expanded = [];

      // If key is new, add it
      if (!had) {
        this.expanded.push(key);
        this.jump_to_key(key);
      }
    } else {
      // Add or remove it from the set, as appropriate. Shortcut this by only adding if delete fails
      const i = this.expanded.indexOf(key);
      if (i < 0) {
        this.expanded.push(key);
        this.jump_to_key(key);
      } else {
        this.expanded.splice(i, 1);
      }
    }
  }

  jump_to_key(key: string) {
    if (!this.$vuetify.breakpoint.smAndDown) {
      this.$nextTick(() => {
        this.$vuetify.goTo(`#${this.striptoChars(key)}`, {
          offset: this.topOfPage,
          duration: 300
        });
      });
    }
  }

  striptoChars(key: string) {
    return key.replace(/[^a-z0-9]/gi, '');
  }

  /** Return items as key, value pairs */
  get raw_items(): any[] {
    const evaluations = FilteredDataModule.evaluations(
      FilteredDataModule.selectedEvaluationIds
    );
    console.log(evaluations);
    const aux_datas: Passthrough['auxiliary_data'][] = evaluations.map((e) =>
      _.get(e, 'data.passthrough.auxiliary_data', [])
    );
    console.log(aux_datas);
    let sboms: SBOMComponent[] = [];
    for (const auxes of aux_datas) {
      for (const a of auxes) {
        if (_.matchesProperty('name', 'SBOM')(a)) {
          sboms = sboms.concat(_.get(a, 'data.components', []));
        }
      }
    }
    console.log(sboms);
    return sboms;
  }
}
</script>

<style scoped>
.pinned-header {
  position: sticky;
  z-index: 2;
  padding-top: 2px;
  padding-bottom: 2px;
}

.control-table-title {
  background-color: var(--v-secondary-lighten1);
  z-index: 10;
}
</style>
