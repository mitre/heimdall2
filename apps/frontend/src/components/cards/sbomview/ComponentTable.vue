<template>
  <v-container fluid class="font-weight-bold">
    <!-- Body -->
    <v-row>
      <v-col>
        <v-data-table
          :items="components"
          :headers="headers"
          :search="searchTerm"
          :expanded.sync="expanded"
          show-expand
          :items-per-page="-1"
          item-key="key"
          hide-default-footer
        >
          <!--           fixed-header
          height="calc(100vh - 250px)" -->
          <template #top>
            <v-card-title>
              Components
              <v-spacer />

              <!-- Table settings menu -->
              <v-menu offset-y offset-overflow :close-on-content-click="false">
                <template #activator="{on}">
                  <v-btn fab small v-on="on">
                    <v-icon> mdi-cog-outline </v-icon>
                  </v-btn>
                </template>
                <v-card max-width="400" class="px-5">
                  <v-card-title class="py-5">Column Select</v-card-title>
                  <v-chip-group
                    v-model="headerColumns"
                    active-class="primary--text"
                    center-active
                    column
                    multiple
                  >
                    <v-chip
                      v-for="field in headerOptions"
                      :key="field.key"
                      :value="field.key"
                    >
                      {{ field.name }}
                    </v-chip>
                  </v-chip-group>
                  <v-divider />
                  <v-card-title class="py-2">Severity Filters</v-card-title>
                  <v-chip-group
                    v-model="severityFilter"
                    active-class="primary--text"
                    center-active
                    column
                    multiple
                  >
                    <v-chip
                      v-for="severity in severities"
                      :key="severity"
                      :value="severity"
                    >
                      {{ severityName(severity) }}
                    </v-chip>
                  </v-chip-group>
                </v-card>
              </v-menu>
            </v-card-title>
          </template>

          <template #[`item.name`]="{item}">
            {{ item.name }}
            <template v-if="componentRef == item['bom-ref']">
              <a id="scroll-to" />
            </template>
          </template>

          <template #[`item.affectingVulnerabilities`]="{item}">
            <v-chip-group
              v-for="vuln in affectingVulns.get(item['bom-ref'])"
              :key="vuln.data.id"
            >
              <v-tooltip max-width="400" left>
                <template #activator="{on}">
                  <span v-on="on">
                    <v-chip
                      outlined
                      small
                      :color="severityColor(vuln.hdf.severity)"
                      :to="{name: 'results', query: {id: vuln.data.id}}"
                    >
                      {{ vuln.data.id }}
                    </v-chip>
                  </span>
                </template>
                <span style="text-overflow: ellipsis">
                  {{ vuln.data.title }}
                  <br />
                  <b>click to view more details</b>
                </span>
              </v-tooltip>
            </v-chip-group>
          </template>

          <template #expanded-item="{headers, item}">
            <td v-if="expanded.includes(item)" :colspan="headers.length">
              <ComponentContent
                :component="item"
                :vulnerabilities="affectingVulns.get(item['bom-ref'])"
                @show-component-in-table="showComponentInTable"
                @show-component-in-tree="showComponentInTree"
              />
            </td>
          </template>
        </v-data-table>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import {Filter, FilteredDataModule} from '@/store/data_filters';
import {SnackbarModule} from '@/store/snackbar';
import {ContextualizedControl, severities, Severity} from 'inspecjs';
import _ from 'lodash';
import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop} from 'vue-property-decorator';
import ComponentContent from './ComponentContent.vue';
import {
  getVulnsFromBomRef,
  ContextualizedSBOMComponent
} from '@/utilities/sbom_util';

@Component({
  components: {
    ComponentContent
  }
})
export default class ComponentTable extends Vue {
  @Prop({type: String, required: false}) readonly searchTerm!: string;

  componentRef = this.$route.query.componentRef ?? null;
  severityFilter: Severity[] = this.severities;
  expanded: ContextualizedSBOMComponent[] = [];
  /** The list of columns that are currently displayed */
  headerColumns = [
    'name',
    'version',
    'group',
    'type',
    'description',
    'affectingVulnerabilities'
  ];

  /**
   * A list of options (selectable in the column select menu) for which
   * headers to display
   */
  headerOptions = [
    'name',
    'version',
    'description',
    'author',
    'affectingVulnerabilities',
    'type',
    'bom-ref',
    'copyright',
    'purl',
    'cpe',
    'group',
    'publisher',
    'scope',
    'mime-type'
  ].map((option) => ({name: _.startCase(option), key: option}));

  mounted() {
    this.$nextTick(() => {
      if (!this.componentRef) return;
      try {
        this.$vuetify.goTo(`#scroll-to`, {duration: 300});
      } catch (e) {
        SnackbarModule.failure(
          `The component you are trying to view is not currently loaded (bom-ref: ${this.componentRef})`
        );
        return;
      }

      const item = this.components.find(
        (i) => i['bom-ref'] === this.componentRef
      );
      if (item) {
        this.expanded = [item];
      }
    });
  }

  headerIndex(str: string) {
    return this.headerOptions.findIndex((option) => option.key === str);
  }

  get headers() {
    // ensure that the header columns are in a consistent order and not determined by 
    // the order in which they are selected
    this.headerColumns.sort((a, b) => this.headerIndex(a) - this.headerIndex(b))
    let h = this.headerColumns.map((v) => {
      return {value: v, class: 'header-box', text: _.startCase(v)};
    });
    h.push({value: 'data-table-expand', text: 'More', class: 'header-box'});
    return h;
  }

  get components(): readonly ContextualizedSBOMComponent[] {
    return FilteredDataModule.components(this.all_filter);
  }

  get all_filter(): Filter {
    return {
      fromFile: FilteredDataModule.selected_sbom_ids,
      severity: this.severityFilter
    };
  }

  get affectingVulns(): Map<string, ContextualizedControl[]> {
    let vulnMap: Map<string, ContextualizedControl[]> = new Map();
    for (const c of this.components) {
      // get the component's affecting vulnerabilities
      const componentVulns = [];
      const controls = FilteredDataModule.controls(this.all_filter);
      for (const vulnBomRef of c.affectingVulnerabilities || []) {
        let result = getVulnsFromBomRef(vulnBomRef, controls);
        if (result.ok) componentVulns.push(result.value); // TODO: show components with unloaded vulns as errors?
      }
      // associate component bom-ref with vuln info
      if (c['bom-ref']) vulnMap.set(c['bom-ref'], componentVulns);
    }
    return vulnMap;
  }

  severityColor(severity: string): string {
    return `severity${_.startCase(severity)}`;
  }

  severityName(severity: string): string {
    return _.startCase(severity);
  }

  get severities(): Severity[] {
    // returns the list of severities defined by inspecJS
    return [...severities];
  }

  showComponentInTable(ref: string) {
    this.$emit('show-component-in-table', ref);
  }

  showComponentInTree(ref: string) {
    this.$emit('show-component-in-tree', ref);
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

.components-table-title {
  background-color: var(--v-secondary-lighten1);
  z-index: 10;
}

/* Blue bar on the left side of the row that is currently expanded */
::v-deep .v-data-table__expanded {
  border-left: 5px solid var(--v-primary-base);
}

/** Allows blue bar to be visible */
::v-deep .v-data-table__wrapper table {
  border-collapse: collapse;
}

/** Keep hover effect when expanded */
::v-deep .v-data-table__expanded__row {
  background-color: #616161;
}

/** Ensure there is no line break between the header text and header icon */
::v-deep .v-data-table .header-box {
  white-space: nowrap;
}
</style>
