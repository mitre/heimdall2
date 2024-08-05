<template>
   <v-container fluid class="font-weight-bold">

    <!-- Body -->
    <v-row>
      <v-col>
        <v-data-table
          :items="components"
          :headers="headers"
          :items-per-page="-1"
          :item-key="'bom-ref'"
          :search="searchTerm"
          :expanded.sync="expanded"
          show-expand
          hide-default-footer
        >
<!--           fixed-header
          height="calc(100vh - 250px)" -->
          <template #top>
            <v-card-title>
              Component View Data
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
                  <v-card-title class="py-2">Filters</v-card-title>
                  <v-switch class="my-0" v-model="showOnlyVulns" label="Only show vulnerable components"></v-switch>
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
                      :color="severity_color(vuln.hdf.severity)"
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
            <ComponentContent
              :component="item"
              :vulnerabilities="affectingVulns.get(item['bom-ref'])"
              :colspan="headers.length"
            />
          </template>
         </v-data-table>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import {Filter, FilteredDataModule} from '@/store/data_filters';
import {SnackbarModule} from '@/store/snackbar';
import {Result} from '@mitre/hdf-converters/src/utils/result';
import {ContextualizedControl} from 'inspecjs';
import _ from 'lodash';
import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop, Ref} from 'vue-property-decorator';
import ComponentContent from './ComponentContent.vue';

export interface SBOMComponent {
  // TODO: UPDATE ME!!!!
  type: string;
  'mime-type'?: string;
  'bom-ref'?: string;
  supplier?: Record<string, unknown>;
  manufacturer?: Record<string, unknown>;
  authors?: Record<string, unknown>[];
  author?: string;
  publisher?: string;
  group?: string;
  name: string;
  version?: string;
  description?: string;
  scope?: string;
  hashes?: Record<string, unknown>[];
  licenses?: Record<string, unknown>[];
  copyright?: string;
  cpe?: string;
  purl?: string;
  omniborId?: string[];
  swhid?: string[];
  swid?: Record<string, unknown>[];
  modified?: boolean; // deprecated
  pedigree?: Record<string, unknown>;
  externalReferences?: {
    url: string;
    comment?: string;
    type: string;
    hashes: Record<string, unknown>[];
  }[];
  components?: SBOMComponent[];
  evidence?: Record<string, unknown>;
  releaseNotes?: Record<string, unknown>;
  modelCard?: Record<string, unknown>;
  data?: Record<string, unknown>[];
  cryptoProperties?: Record<string, unknown>;
  properties?: {name: string; value: string}[];
  tags?: string[];
  signature?: Record<string, unknown>[];

  // custom
  affectingVulnerabilities: string[]; // an array of bom-refs
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
    ComponentContent
  }
})
export default class ComponentTable extends Vue {
  @Ref('controlTableTitle') readonly controlTableTitle!: Element;
  @Prop({type: Object, required: true}) readonly filter!: Filter;
  @Prop({type: String, required: false}) readonly searchTerm!: string;

  componentRef = this.$route.query.componentRef ?? null;
  headerColumns = [
    'name',
    'version',
    'author',
    'group',
    'type',
    'description',
    'affectingVulnerabilities'
  ];
  showOnlyVulns: Boolean = false;

  expanded: SBOMComponent[] = [];

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

  get headers() {
    let h = this.headerColumns.map((v) => {
      return {value: v, class: 'header-box', text: _.startCase(v)}
    });
    h.push({value: 'data-table-expand', text: 'More', class: 'header-box'});
    console.log(h);
    return h;
  }

  get components(): SBOMComponent[] {
    const evaluations = FilteredDataModule.evaluations(
      FilteredDataModule.selectedEvaluationIds
    );
    // get each section of the auxiliary data as one large section 
    const auxDataSections: Passthrough['auxiliary_data'] = evaluations.flatMap((e) =>
      _.get(e, 'data.passthrough.auxiliary_data', [])
    );
    let components: SBOMComponent[] = [];
    // grab every component from each section and apply a the filter if necessary
    for (const section of auxDataSections) {
      if (_.matchesProperty('name', 'SBOM')(section)) {
        for (const component of _.get(section, 'components', []) as SBOMComponent[]) {
          if (!this.showOnlyVulns || (component.affectingVulnerabilities && component.affectingVulnerabilities.length > 0))
            components.push(component);
        }
      }
    }
    return components;
  }

  get all_filter(): Filter {
    return {
      fromFile: FilteredDataModule.selectedEvaluationIds
    };
  }

  get affectingVulns(): Map<string, ContextualizedControl[]> {
    let vulnMap: Map<string, ContextualizedControl[]> = new Map();
    for (const c of this.components) {
      // get the component's affecting vulnerabilities
      const componentVulns = [];
      for (const vulnBomRef of c.affectingVulnerabilities || []) {
        let result = this.getVulns(vulnBomRef);
        if (result.ok) componentVulns.push(result.value); // TODO: show components with unloaded vulns as errors?
      }
      // associate component bom-ref with vuln info
      if (c['bom-ref']) vulnMap.set(c['bom-ref'], componentVulns);
    }
    return vulnMap;
  }

  getVulns(vulnBomRef: string): Result<ContextualizedControl, null> {
    const vuln = FilteredDataModule.controls(this.all_filter).find((c) => {
      // regex to get the value of bom-ref from the vuln code stored as JSON
      let match = c.full_code.match(/"bom-ref": "(?<ref>.*?)"/);
      return match ? match.groups?.ref === vulnBomRef : false;
    });
    if (vuln) return {ok: true, value: vuln};
    return {ok: false, error: null};
  }

  severity_color(severity: string): string {
    return `severity${_.startCase(severity)}`;
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
