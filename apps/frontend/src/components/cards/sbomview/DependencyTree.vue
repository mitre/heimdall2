<template>
  <div>
    <v-treeview
      :items="loadedDependencies"
      :load-children="getStructure"
      dense
      activatable
    >
      <!-- Searching can be added, but it might be more complex if we are loading
     the structure only when that node is opened. So it cannot find deeply nested components 
     that match the search term automatically -->

      <!-- TODO: change the ref for a unique identifier like component.key -->
      <template #append="{item, active}">
        <v-chip
          v-if="active"
          @click="$emit('show-component-in-table', item.ref)"
        >
          Open in Component Table
        </v-chip>
      </template>
    </v-treeview>
  </div>
</template>

<script lang="ts">
import {FilteredDataModule} from '@/store/data_filters';
import {
  getSbomMetadata,
  SBOMDependency,
  getStructuredSbomDependencies
} from '@/utilities/sbom_util';
import _ from 'lodash';
import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop} from 'vue-property-decorator';

interface TreeNode {
  name: string;
  children?: DependencyStructure[];
  id: number;
}

type DependencyStructure = TreeNode & SBOMDependency;

@Component({
  components: {}
})
export default class DependencyTree extends Vue {
  @Prop({type: String, required: false}) readonly searchTerm!: string;
  @Prop({type: String, required: false}) readonly targetComponent!:
    | string
    | null;

  loadedDependencies: DependencyStructure[] = [];
  nextId = 0;
  mounted() {
    this.loadedDependencies = this.rootComponentRefs.map(this.getRootStructure);
    console.log('Mounted ' + this.targetComponent);
  }

  severityColor(severity: string): string {
    return `severity${_.startCase(severity)}`;
  }

  get structuredDependencies() {
    return getStructuredSbomDependencies();
  }

  get rootComponentRefs(): string[] {
    return FilteredDataModule.sboms(FilteredDataModule.selected_sbom_ids)
      .map(getSbomMetadata)
      .map((result) =>
        result.ok ? _.get(result.value, 'component.bom-ref', '') : ''
      );
  }

  getRootStructure(ref: string): DependencyStructure {
    const root = this.structuredDependencies.get(ref);
    const id = this.nextId;
    this.nextId += 1;
    if (root) return {...root, name: ref, children: [], id};
    return {ref, name: ref, id, children: [], dependsOn: []};
  }

  getStructure(item: DependencyStructure) {
    const children: DependencyStructure[] = [];
    for (const ref of item.dependsOn || []) {
      const child = this.structuredDependencies.get(ref);
      if (child) {
        if (child.dependsOn?.length)
          // used to indicate that this tree node has more dependents to load in
          children.push({
            ...child,
            name: child.ref,
            children: [],
            id: this.nextId
          });
        else children.push({...child, name: child.ref, id: this.nextId});
        this.nextId += 1;
      }
    }
    item.children = children;
  }
}

/**
 * TODO: Figure out why loading multiple breaks everything
 * comment code thoroughly
 * add buttons to reference back to component table (both ways)
 * fix issue with things closing
 * add bread crumbs thing
 */
</script>

<style scoped></style>
