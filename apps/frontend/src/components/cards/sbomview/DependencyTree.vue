<template>
  <v-container fluid grid-list-md pa-2>
    <!-- A row with buttons to navigate between components that match the current filter and 
     a display for the path to the current activated component -->
    <v-row no-gutters>
      <v-col :cols="2" ml-2>
        Navigate between components that match current filter. See
        <v-icon>mdi-filter-outline</v-icon> filter on the right for more
        details.
      </v-col>
      <v-col :cols="1" style="text-align: center">
        <v-btn :disabled="!filterActive" @click="changePath(false)">
          Next <v-icon>mdi-chevron-down</v-icon>
        </v-btn>
      </v-col>
      <v-col :cols="1" style="text-align: center">
        <v-btn :disabled="!filterActive" @click="changePath(true)">
          Prev <v-icon right>mdi-chevron-up</v-icon>
        </v-btn>
      </v-col>
      <v-col :cols="8">
        <v-breadcrumbs :items="selectionPathBreadcrumbs" style="padding: 0px" />
      </v-col>
    </v-row>

    <v-row>
      <v-col :cols="12" pt-0>
        <!-- The main component to show the tree structure -->
        <v-treeview
          v-if="root"
          :items="[root]"
          :load-children="loadChildren"
          :active.sync="activeNodes"
          :open="openNodes"
          dense
          activatable
          selection-type="independent"
          return-object
          @update:active="activateComponent"
        >
          <!-- Show red star with tool tip on any components that match the filter 
              Do not show red start if there is no filter active -->
          <template #prepend="{item}">
            <v-tooltip
              v-if="filterActive && componentMatchesFilter(item.component)"
              right
            >
              <template #activator="{on}">
                <v-icon color="red" v-on="on"> mdi-star </v-icon>
              </template>
              <span>This component matches the current filter</span>
            </v-tooltip>
          </template>

          <!-- Label with component name, group, version, and dependency count -->
          <template #label="{item, leaf, active}">
            {{ item.name }}
            <template v-if="!leaf && item.component">
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
              v-if="item.component.affectingVulnerabilities.length"
              :to="{
                name: 'results',
                query: {id: item.component.affectingVulnerabilities}
              }"
            >
              {{ item.component.affectingVulnerabilities.length }}

              <template
                v-if="item.component.affectingVulnerabilities.length === 1"
              >
                Vulnerability
              </template>
              <template v-else> Vulnerabilities </template>
              <v-icon right> mdi-alert-outline </v-icon>
            </v-chip>
            <v-chip
              v-if="active"
              @click="
                $emit('show-components-in-tree', [item.component['bom-ref']])
              "
            >
              Show all in Dependency Tree
            </v-chip>
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

        <!-- Show error message if trying to view SBOM with no root component-->
        <v-card v-else>
          <v-card-title> Error! </v-card-title>
          <v-card-text>
            The current SBOM has no root component to generate the tree from.
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import {SBOMFilter} from '@/store/data_filters';
import {
  ContextualizedSBOMComponent,
  createVulnMap,
  matchesFilter,
  SBOMData
} from '@/utilities/sbom_util';
import {ContextualizedControl} from 'inspecjs';
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

  /** A list of components that lead to a particular instance of a component in the dependency tree */
  selectionPath: ContextualizedSBOMComponent[] | undefined = [];
  root: TreeNode | null = null;

  mounted() {
    this.openToFilter();
  }

  /** counter used to give every tree node a unique id */
  nextId = 0;

  /** list of nodes to force to be opened */
  openNodes: TreeNode[] = [];

  /** list of one node (due to type requirements) that is activated */
  activeNodes: TreeNode[] = [];

  /** Opens up to the new filter that is being applied and clears
   * the loaded TreeNodes so they don't clutter the view
   */
  openToFilter() {
    const root = this.sbomData.metadata?.component;
    if (root) {
      this.root = this.componentToTreeNode(root); // overwrites previous TreeNodes
      this.selectionPath = [];
      this.changePath(false); // opens to and activates the first component that matches the filter
    }
  }

  /** Opens up all the tree nodes that are part of the selection path */
  openSelectionPath() {
    if (!this.selectionPath || !this.root?.component) {
      return;
    }
    let currentNode: TreeNode = this.root;
    // traverse down the path and convert components into TreeNodes
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
    // activate the last node in the path
    this.activeNodes = [currentNode];
  }

  /**
   * Navigates to the next or previous component that
   * matches the filter
   * @param reverse true if searching backwards from `this.selectionPath`
   */
  changePath(reverse: boolean) {
    if (!this.root?.component) {
      return;
    }
    this.selectionPath = this.recurseNextPath(
      this.root.component,
      this.selectionPath || [],
      new Set(),
      reverse
    );
    if (!this.selectionPath) {
      // loop around if no filter matches are found
      const startPath = reverse
        ? this.endPath(this.root.component, new Set())
        : [];
      this.selectionPath = this.recurseNextPath(
        this.root.component,
        startPath,
        new Set(),
        reverse
      );
    }
    this.openSelectionPath();
  }

  /**
   * recursively finds a path (list of components) to
   * components that match the current filter
   */
  recurseNextPath(
    component: ContextualizedSBOMComponent,
    path: ContextualizedSBOMComponent[],
    visited: Set<string>,
    reverse: boolean
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

    // go through every child component to see if they
    // are a filter match or contain any filter matches
    let children = component.children;
    if (reverse) {
      children = [...component.children].reverse();
    }
    let canTest = path.length <= 1;
    for (const child of children) {
      // uses a pre-order traversal algorithm to maintain the
      // ordering of the paths by ensuring that the path to the
      // next found component comes "after" or "before" (dependig on `reverse`)
      // the current path
      if (!canTest && child['bom-ref'] !== path[1]['bom-ref']) {
        continue;
      }

      const possiblePath = this.recurseNextPath(
        child,
        canTest ? [] : path.slice(1), // if `child` is part of path, we must pass `path` down
        new Set([...visited, component['bom-ref']]),
        reverse
      );
      canTest = true;
      if (possiblePath) {
        return [component, ...possiblePath];
      }
    }
  }

  get affectingVulns(): Map<string, ContextualizedControl[]> {
    return createVulnMap(this.sbomData.components, {
      fromFile: this.filter.fromFile
    });
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
        } else if (!only || component === only) {
          children.push(this.componentToTreeNode(component, item));
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

  /**
   * Computes the main name that will show for each component
   */
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

  /**
   * recursively navigates the dependency structure to construct the path to a given TreeNode
   */
  getPath(node: TreeNode): ContextualizedSBOMComponent[] {
    if (node.parent) {
      return [...this.getPath(node.parent), node.component];
    }
    return [node.component];
  }

  /**
   * determines if the given component matches the current filter
   */
  componentMatchesFilter(component?: ContextualizedSBOMComponent): boolean {
    if (!component) {
      return false;
    }
    return matchesFilter(component, this.filter);
  }
}
</script>
