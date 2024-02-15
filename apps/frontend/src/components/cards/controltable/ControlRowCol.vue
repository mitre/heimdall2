<template>
  <v-row dense
    v-if="!isOverridenAndDisplayNewOnly"
  >
    <v-col cols="12" sm="2" lg="2">
      <v-layout class="pl-2" fill-height justify-center align-center>
        <v-btn
          class="unclickable-button"
          :color="status_color"
          elevation="2"
          block
          depressed
        >
          <h3>{{ result.status.toUpperCase() }}</h3>
        </v-btn>
      </v-layout>
    </v-col>
    <v-col
      class="pa-2"
      cols="2"
      :sm="resultMessage ? 5 : 5"
      :lg="resultMessage ? 5 : 5"

    >

      <h3 class="pa-2">Test</h3>
      <v-divider />
      <!-- HTML is sanitized with sanitize-html -->
      <!-- eslint-disable vue/no-v-html -->
      <div
        class="pa-2 mono pre-formatted"
        v-html="sanitize_html(result.code_desc.trim())"
      />
      <!-- eslint-enable vue/no-v-html -->
    </v-col>
    <v-col v-if="resultMessage" cols=resultsSize()  >
      <h3 class="pa-2">Result</h3>
      <v-divider />
      <!-- eslint-disable vue/no-v-html -->
      <div
        class="pa-2 mono pre-formatted"
        v-html="sanitize_html(resultMessage.trim())"
      />
    </v-col>
    <v-col v-if="!noOverride" sm="5" lg="5">
      <h3 class="pa-2">CAB Description</h3>
      <v-divider />
      <!-- eslint-disable vue/no-v-html -->
      <div
        class="pa-2 mono pre-formatted"
        v-html="resultOverrideDesc"
      />
      <!-- eslint-enable vue/no-v-html -->
    </v-col>
    <v-col v-if="result['backtrace'] !== undefined" cols="12" class="pa-2">
      <v-expansion-panels>
        <v-expansion-panel>
          <v-expansion-panel-header>Backtrace</v-expansion-panel-header>
          <v-expansion-panel-content>
            <span
              v-for="(trace, i) in result.backtrace"
              :key="i"
              class="inline-text"
            >
              {{ trace }}
            </span>
          </v-expansion-panel-content>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import HtmlSanitizeMixin from '@/mixins/HtmlSanitizeMixin';
import {HDFControlSegment} from 'inspecjs';
import {ProductModuleState} from '@/store/product_module_state';
import Component, {mixins} from 'vue-class-component';
import {Prop} from 'vue-property-decorator';

@Component({})
export default class ControlRowCol extends mixins(HtmlSanitizeMixin) {
  @Prop({type: String, required: true}) readonly statusCode!: string;
  @Prop({type: Object, required: true}) readonly result!: HDFControlSegment;
  @Prop({default: false}) readonly visible!: boolean;

  /**
   * If the displayNewControls switch is toggled on and this result has overrides, hide this result.
  */
  get isOverridenAndDisplayNewOnly(): boolean {
    return (this.result.override !== undefined) && ProductModuleState.displayNewControls
  }

  get noOverride(): boolean {
    return (this.result.override == undefined);
  }

  get resultsSize(): string {
    if (this.result.override == undefined){
        return "5";
    }else{
      return "5";
    }
  }

  /**
   * maps stuff like "not applicable" -> "statusnotapplicable", which is a defined color name
   */
  get status_color(): string {
    // maps stuff like "not applicable" -> "statusnotapplicable", which is a defined color name
    return `status${this.statusCode.replace(' ', '')}`;
  }

  get resultMessage(): string | undefined {
    return this.result.message || this.result.skip_message;
  }

  get resultSource(): string | undefined {
    if (this.result.result_source == undefined) {
      return "";
    }
    return this.result.result_source
  }

  get resultOverrideDesc(): string | undefined {
    if (this.result.override?.description == undefined) {
      return "";
    }
    return this.result.override.description
  }

  get overrideApproved(): boolean {
    if(this.result.override?.is_approved !== undefined && this.result.override?.is_approved !== null){
        return this.result.override?.is_approved;
    }
    return false;
  }

}
</script>

<style lang="scss" scoped>
@import '@/sass/control-row-format.scss';

button.unclickable-button {
  pointer-events: none;
}

.pre-formatted {
  white-space: pre-wrap;
}

.inline-text {
  display: inline-block;
}
</style>
