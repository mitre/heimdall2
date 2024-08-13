<template>
  <div>
    <v-treeview
      :items="loadedDependencies"
      :load-children="loadChildren"
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
          @click="$emit('show-component-in-table', item.component['bom-ref'])"
        >
          Open in Component Table
        </v-chip>
      </template>
    </v-treeview>
  </div>
</template>

<script lang="ts">
import {SBOMFilter} from '@/store/data_filters';
import {ContextualizedSBOMComponent, SBOMData} from '@/utilities/sbom_util';
import _ from 'lodash';
import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop} from 'vue-property-decorator';

interface TreeNode {
  name: string;
  children?: TreeNode[];
  id: number;
  component: ContextualizedSBOMComponent;
}

@Component({
  components: {}
})
export default class DependencyTree extends Vue {
  @Prop({type: Object, required: true}) readonly filter!: SBOMFilter;
  @Prop({type: Object, required: true}) readonly sbomData!: SBOMData;
  @Prop({type: Array, required: false}) readonly targetComponents!:
    | string[]
    | null;

  loadedDependencies: TreeNode[] = [];
  nextId = 0;

  mounted() {
    const root = this.sbomData.metadata?.component;
    if (root) this.loadedDependencies = [this.componentToTreeNode(root)];
  }

  severityColor(severity: string): string {
    return `severity${_.startCase(severity)}`;
  }

  loadChildren(item: TreeNode) {
    item.children = item.component.children.map(this.componentToTreeNode);
  }

  componentToTreeNode(component: ContextualizedSBOMComponent): TreeNode {
    return {
      name: this.componentDisplayName(component),
      id: this.nextId++, // use this.nextId and then increment it
      component: component,
      // having a children array indicates that children can be loaded
      // the UI will reflect this
      children: component.children?.length ? [] : undefined
    };
  }

  componentDisplayName(component: ContextualizedSBOMComponent): string {
    const group = _.get(component, 'group');
    const version = _.get(component, 'version');
    const name = component.name;
    if (group && version) return `${group}/${name} ${version}`;
    if (group) return `${group}/${name}`;
    if (version) return `${name} ${version}`;
    return component.name;
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
