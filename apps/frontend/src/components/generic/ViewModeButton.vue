<template>
  <div>

    <v-menu offset-y>
        <template v-slot:activator="{ on, attrs }">
          <v-btn
            color="primary"
            dark
            v-bind="attrs"
            v-on="on"
          >
          {{ viewModeText }} 
          </v-btn>
        </template>

        <v-list>
        <v-list-item-group
          v-model="viewModeDropDown"
          mandatory
          color="primary"
        >
          <v-list-item
            v-for="(item, i) in viewModeItems"
            :key="i"
          >           
            <v-list-item-content>
              <v-list-item-title v-text="item.text"></v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list-item-group>
        </v-list>
      </v-menu>

  </div>
</template>

<script lang="ts">
import {ProductModuleState} from '@/store/product_module_state';
import RouteMixin from '@/mixins/RouteMixin';
import Component, {mixins} from 'vue-class-component';

@Component({
  components: {}
})
export default class ViewModeButton extends mixins(RouteMixin) {
 
  get viewModeItems() {
    return ProductModuleState.viewModeTypes;
  }

  get viewModeText() {
    return ProductModuleState.viewModeTypes[ProductModuleState.viewMode].text;
  }

  get viewModeDropDown (): number {
    return ProductModuleState.viewMode;    
  }

  set viewModeDropDown(value: number) {
    ProductModuleState.UpdateViewMode(value);

    switch (value) {
      case 0:        
        this.navigateWithNoErrors(`/certifier`);
        break;
      case 1:
        ProductModuleState.UpdateOverrideValidation(false);
        this.navigateWithNoErrors(`/developer`);
        break;
      case 2:
        ProductModuleState.UpdateOverrideValidation(false);
        this.navigateWithNoErrors(`/cyber`);
        break;        
      default:        
        this.navigateWithNoErrors(`/results`);
        break;
    };   
  }

}
</script>
