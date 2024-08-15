<template>
  <v-container fluid grid-list-md pa-2>
    <!--     <v-card class="ma-3"> -->
    <v-row no-gutters style="text-align: center">
      <v-col :cols="2"
        >Navigate between components that match current filter. See
        <v-icon>mdi-filter</v-icon> for filter details.</v-col
      >
      <v-col :cols="1" style="text-align: center">
        <v-btn :disabled="!filterActive" @click="nextPath">
          Next <v-icon>mdi-chevron-down</v-icon>
        </v-btn>
      </v-col>
      <v-col :cols="1" style="text-align: center">
        <v-btn :disabled="!filterActive" @click="prevPath">
          Prev <v-icon small right>mdi-chevron-up</v-icon>
        </v-btn>
      </v-col>
      <v-col :cols="8">
        <v-breadcrumbs :items="selectionPathBreadcrumbs" style="padding: 0px" />
      </v-col>
    </v-row>
    <v-row>
      <v-col :cols="12" pt-0>
        <v-treeview
          :items="root ? [root] : []"
          :load-children="loadChildren"
          :active.sync="activeNodes"
          :open="openNodes"
          dense
          activatable
          selection-type="independent"
          return-object
          @update:active="activateComponent"
        >
          <template #prepend="{item}">
            <v-tooltip
              v-if="
                item.component &&
                filter['bom-refs']?.includes(item.component['bom-ref'])
              "
              right
            >
              <template #activator="{on}">
                <v-icon color="red" v-on="on"> mdi-star </v-icon>
              </template>
              <span>This component matches the current filter</span>
            </v-tooltip>
          </template>

          <template #label="{item, leaf, active}">
            {{ item.name }}
            <template v-if="!leaf && item.component" ml-5>
              <template
                v-if="
                  item.children.length &&
                  item.children.length < item.component.children.length
                "
              >
                <v-chip
                  v-if="active"
                  class="ml-5"
                  @click="
                    loadChildren(item);
                    openNodes.push(item);
                  "
                >
                  Load
                  {{ item.component.children.length - item.children.length }}
                  hidden dependents
                </v-chip>
                <template v-else>
                  ({{ item.component.children.length - item.children.length }}
                  hidden dependents)
                </template>
              </template>
              <template v-else-if="active">
                ({{ item.component.children.length }} dependents)
              </template>
            </template>
          </template>

          <template #append="{item, active}">
            <v-chip
              v-if="active"
              @click="
                $emit('show-components-in-table', [item.component['bom-ref']])
              "
            >
              Open in Component Table
            </v-chip>
          </template>
        </v-treeview>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import {SBOMFilter} from '@/store/data_filters';
import {
  ContextualizedSBOMComponent,
  matchesFilter,
  SBOMData
} from '@/utilities/sbom_util';
import _ from 'lodash';
import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop} from 'vue-property-decorator';

interface TreeNode {
  name: string;
  children?: TreeNode[];
  id: number;
  component: ContextualizedSBOMComponent;
  parent?: TreeNode;
}
@Component({
  components: {}
})
export default class DependencyTree extends Vue {
  @Prop({type: Object, required: true}) readonly filter!: SBOMFilter;
  @Prop({type: Boolean, required: true}) readonly filterActive!: boolean;
  @Prop({type: Object, required: true}) readonly sbomData!: SBOMData;

  selectionPath: ContextualizedSBOMComponent[] | undefined = [];
  root: TreeNode | null = null;

  mounted() {
    // ensures that there is a root component
    const root = this.sbomData.metadata?.component;
    if (root) {
      this.root = this.componentToTreeNode(root);
      this.nextPath(); // activates the first component that matches the filter
    }
  }

  /** counter used to give every tree node a unique id */
  nextId = 0;

  /** list of nodes to force to be opened */
  openNodes: TreeNode[] = [];

  /** list of one node (due to type requirements) that is activated */
  activeNodes: TreeNode[] = [];

  /** Opens up all the tree nodes that are part of the selection path */
  openSelectionPath() {
    if (!this.selectionPath || !this.root?.component) {
      return;
    }
    let currentNode: TreeNode = this.root;
    this.openNodes = [];
    for (const component of this.selectionPath) {
      this.openNodes.push(currentNode);
      if (component === this.root.component) {
        continue;
      }
      this.loadChildren(currentNode, component);
      const nextNode = currentNode.children?.find(
        (node) => node.component === component
      );
      if (!nextNode) {
        break;
      }
      currentNode = nextNode;
    }
    this.activeNodes = [currentNode];
  }

  nextPath() {
    if (!this.root?.component) {
      return;
    }
    this.selectionPath = this.recurseNextPath(
      this.root.component,
      this.selectionPath || [],
      new Set()
    );
    if (!this.selectionPath) {
      // loop around if no filter matches are found
      this.recurseNextPath(this.root.component, [], new Set());
    }
    this.openSelectionPath();
  }

  prevPath() {
    if (!this.root?.component) {
      return;
    }
    this.selectionPath = this.recurseNextPath(
      this.root.component,
      this.selectionPath || this.endPath(this.root.component, new Set()),
      new Set(),
      true
    );
    if (!this.selectionPath) {
      // loop around if no filter matches are found
      this.recurseNextPath(
        this.root.component,
        this.endPath(this.root.component, new Set()),
        new Set(),
        true
      );
    }
    this.openSelectionPath();
  }

  recurseNextPath(
    component: ContextualizedSBOMComponent,
    path: ContextualizedSBOMComponent[],
    visited: Set<string>,
    reverse: boolean = false
  ): ContextualizedSBOMComponent[] | undefined {
    // prevent infinite loops from circular dependencies
    if (visited.has(component['bom-ref'])) {
      return;
    }

    // check if component satisfies the current filter and
    // isn't the end of the starting path
    const validTarget: boolean = matchesFilter(component, this.filter);
    if (validTarget) {
      if (!path.length || path[0] !== component) {
        return [component];
      }
    }

    // go through every component
    let passedPath: boolean = false;
    let children = component.children;
    if (reverse) {
      children = [...component.children].reverse();
    }
    for (const child of children) {
      if (path.length > 1 && !passedPath) {
        if (child['bom-ref'] === path[1]['bom-ref']) {
          passedPath = true;
        }
      }
      if (path.length <= 1 || passedPath) {
        const possiblePath = this.recurseNextPath(
          child,
          path.slice(1),
          new Set([...visited, component['bom-ref']])
        );
        if (possiblePath) {
          return [component, ...possiblePath];
        }
      }
    }
  }

  /** a representation of the selection path in a form that v-breadcrumbs can render */
  get selectionPathBreadcrumbs() {
    return this.selectionPath?.map((p) => ({
      text: this.componentDisplayName(p)
    }));
  }

  /**
   * A function called when a user opens a TreeNode element and new TreeNodes
   * need to be generated
   * @param item The TreeNode that is being opened
   * @param only A component given if it should only display this child of `item`
   */
  loadChildren(item: TreeNode, only?: ContextualizedSBOMComponent) {
    if (item.component) {
      const children: TreeNode[] = [];
      for (const component of item.component.children) {
        const existingNode = item.children?.find(
          (node) => node.component === component
        );
        if (existingNode) {
          children.push(existingNode);
        } else {
          if (!only || component === only) {
            children.push(this.componentToTreeNode(component, item));
          }
        }
      }
      item.children = children;
    }
  }

  /**
   * Turns a component into a structure that the v-treeview can use to represent a component
   * @param component The component that the TreeNode represents
   * @param parent A reference back to the TreeNode that this node falls under
   */
  componentToTreeNode(
    component: ContextualizedSBOMComponent,
    parent?: TreeNode
  ): TreeNode {
    return {
      name: this.componentDisplayName(component),
      id: this.nextId++, // use this.nextId and then increment it
      component: component,
      // having a children array indicates that children can be loaded
      // the UI will reflect this
      children: component.children?.length ? [] : undefined,
      parent
    };
  }

  /** Computes the main name that will show for each component */
  componentDisplayName(component: ContextualizedSBOMComponent): string {
    const group = _.get(component, 'group');
    const version = _.get(component, 'version');
    const name = component.name;
    if (group && version) {
      return `${group}/${name} ${version}`;
    }
    if (group) {
      return `${group}/${name}`;
    }
    if (version) {
      return `${name} ${version}`;
    }
    return component.name;
  }

  activateComponent(nodes: TreeNode[]) {
    if (nodes.length) {
      // user should only be able to select one component at a time
      this.selectionPath = this.getPath(nodes[0]);
    }
  }

  /**
   * recursively navigates the dependency structure to find the node that comes last in the filter search
   */
  endPath(
    component: ContextualizedSBOMComponent,
    visited: Set<string>
  ): ContextualizedSBOMComponent[] {
    // ensure circular dependencies can't cause infinite loops
    if (visited.has(component['bom-ref'])) {
      return [];
    }

    const last = component.children.at(-1);
    if (last) {
      return [
        component,
        ...this.endPath(last, new Set([...visited, component['bom-ref']]))
      ];
    } else {
      return [component];
    }
  }

  /** recursively navigates the dependency structure to construct the path to a given TreeNode */
  getPath(node: TreeNode): ContextualizedSBOMComponent[] {
    if (node.parent) {
      return [...this.getPath(node.parent), node.component];
    }
    return [node.component];
  }
}
</script>

<style scoped></style>
