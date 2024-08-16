<template>
  <v-container fluid class="font-weight-bold">
    <!-- Body -->
    <v-row>
      <v-col>
        <v-data-table
          :items="components"
          :headers="headers"
          :expanded.sync="expanded"
          show-expand
          :items-per-page="100"
          item-key="key"
          :footer-props="{'items-per-page-options': [25, 50, 100, 250, -1]}"
        >
          <!--           fixed-header
          height="calc(100vh - 250px)" -->
          <template #top>
            <v-card-title> Components ({{ components.length }})</v-card-title>
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

          <template #[`item.treeView`]="{item}">
            <v-chip
              small
              outlined
              @click="$emit('show-components-in-tree', [item['bom-ref']])"
            >
              Go
            </v-chip>
          </template>

          <template #expanded-item="{item}">
            <td
              v-if="expanded.find((e) => e.key == item.key)"
              :colspan="headers.length"
            >
              <ComponentContent
                :component="item"
                :vulnerabilities="affectingVulns.get(item['bom-ref'])"
                @show-components-in-table="showComponentsInTable"
                @show-components-in-tree="showComponentsInTree"
              />
            </td>
          </template>
        </v-data-table>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import {FilteredDataModule, SBOMFilter} from '@/store/data_filters';
import {ContextualizedControl} from 'inspecjs';
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
  @Prop({type: Object, required: true}) readonly filter!: SBOMFilter;
  @Prop({type: Array, required: true}) currentHeaders!: string[];

  componentRef = this.$route.query.componentRef ?? null;
  expanded: ContextualizedSBOMComponent[] = [];

  get headers() {
    // ensure that the header columns are in a consistent order and not determined by
    // the order in which they are selected
    let h = this.currentHeaders.map((v) => {
      return {value: v, class: 'header-box', text: _.startCase(v)};
    });
    h.push({value: 'data-table-expand', text: 'More', class: 'header-box'});
    return h;
  }

  get components(): readonly ContextualizedSBOMComponent[] {
    // TODO: Change this to have a refernece to the source evaluation in some way. File name?? Like List ELT in result table
    return FilteredDataModule.components(this.filter);
  }

  get affectingVulns(): Map<string, ContextualizedControl[]> {
    let vulnMap: Map<string, ContextualizedControl[]> = new Map();
    for (const c of this.components) {
      // get the component's affecting vulnerabilities
      const componentVulns = [];
      const controls = FilteredDataModule.controls({fromFile: this.filter.fromFile});
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

  showComponentsInTable(bomRefs: string[]) {
    this.$emit('show-components-in-table', bomRefs);
  }

  showComponentsInTree(bomRefs: string[]) {
    this.$emit('show-components-in-tree', bomRefs);
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

/** Blue bar on the bottom to show where expanded content ends */
::v-deep .v-data-table__expanded__content {
  border-bottom: 5px solid var(--v-primary-base) !important;
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
