<template>
    <v-container fluid class="font-weight-bold">
    <div
      ref="prototypeTableTitle"
      :class="
        $vuetify.breakpoint.smAndDown
          ? 'control-table-title'
          : 'pinned-header control-table-title'
      "
      :style="prototypeTableTitleStyle"
    >        

    <v-col data-cy="fileinfo" cols="11">
      <div>
        {{ viewModeText }}
      </div>

      <v-col v-if="isDeveloperMode" cols="3" md="auto" class="text-right pl-6 pb-0">
        <div class="d-flex flex-nowrap">
          <strong class="pt-2 pr-1">Developer Tools</strong>
        </div>
        <v-switch
          v-model="displayNewControls"
          label="Show Only New Controls"
        />
      </v-col> 

    </v-col>

    <v-row v-resize="onResize">        
        <v-row>
          <v-col>
            <v-expansion-panels>
              <v-expansion-panel>
                <v-expansion-panel-header>Extended Options</v-expansion-panel-header>
                <v-expansion-panel-content>
                  <v-row>
                      <v-col cols="3" md="auto" class="text-right pb-0">
                          <v-switch v-model="overrideValidation" label="Override Validation mode" /> 
                      </v-col>
                  </v-row>
                </v-expansion-panel-content>
              </v-expansion-panel>
          </v-expansion-panels>
          </v-col>
        </v-row>

    </v-row>

  </div>
    </v-container>
</template>


<script lang="ts">
import {HeightsModule} from '@/store/heights';
import {ProductModuleState} from '@/store/product_module_state';
import {ViewModeType} from '@/enums/product_model_view_mode';
import _ from 'lodash';
import Vue from 'vue';
import Component from 'vue-class-component';
import {Ref} from 'vue-property-decorator';

  @Component({
    components: {}
  })
  export default class ProductControlsPanel extends Vue {
    @Ref('prototypeTableTitle') readonly prototypeTableTitle!: Element;

    mounted() {
        this.onResize();
    }

    onResize() {
        // Allow the page to settle before checking the controlTableHeader height
        setTimeout(() => {
        HeightsModule.setControlTableHeaderHeight(
            this.prototypeTableTitle?.clientHeight
        );
        }, 2000);
    }

    get prototypeTableTitleStyle() {
        return {top: `${HeightsModule.topbarHeight}px`};
    }
  
    
    get displayNewControls() {
      return ProductModuleState.displayNewControls;
    }

    set displayNewControls(value: boolean) {
      ProductModuleState.UpdateDisplayNewControls(value)      
    }

    set overrideValidation(value: boolean){
      ProductModuleState.UpdateOverrideValidation(value)
    }

    get overrideValidation(){
      return ProductModuleState.overrideValidation;
    }

    get isDeveloperMode() {
      return ProductModuleState.viewMode == ViewModeType.Developer;
    }

    get viewModeItems() {
      return ProductModuleState.viewModeTypes;
    }

    get viewModeText() {
      return ProductModuleState.viewModeTypes[ProductModuleState.viewMode].text;
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
  