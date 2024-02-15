<template>
  <v-row no-gutters dense class="pb-1">
    <v-col v-if="hasOverrideData" cols="12" sm="12" lg="12" class="left"> 

    <v-list class="py-0">
     
      <v-list-item class="zebra-table">
        <v-list-item-content class="override-title">
          <v-list-item-title>Test:</v-list-item-title>
        </v-list-item-content>
        <v-list-item-content>
          <v-list-item-subtitle class="text-wrap"><div v-html="workFlowTest" /></v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
    
      <v-list-item class="non-zebra-table">
        <v-list-item-content class="override-title">
          <v-list-item-title>Request Type:</v-list-item-title>
        </v-list-item-content>
        <v-list-item-content>
          <v-list-item-subtitle><div v-html="workFlowRequestType" /></v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>

      <v-list-item class="zebra-table">
        <v-list-item-content class="override-title">
          <v-list-item-title>CAB Status:</v-list-item-title>
        </v-list-item-content>
        <v-list-item-content>
          <v-list-item-subtitle>
            <div v-if=is_override_status() class="override-text" v-html="workFlowCABStatusOverride" />
            <div v-else v-html="workFlowCABStatus" />
          </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>

      <v-list-item class="non-zebra-table">
        <v-list-item-content class="override-title">
          <v-list-item-title>CAB Date:</v-list-item-title>
        </v-list-item-content>
        <v-list-item-content>
          <v-list-item-subtitle><div v-html="workFlowCABDate" /></v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>

      <v-list-item class="zebra-table">
        <v-list-item-content class="override-title">
          <v-list-item-title>Cyber Reviewer	:</v-list-item-title>
        </v-list-item-content>
        <v-list-item-content>
          <v-list-item-subtitle><div v-html="workFlowCyberReviewer" /></v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>

      <v-list-item class="non-zebra-table">
        <v-list-item-content class="override-title">
          <v-list-item-title>Ticket Tracking:</v-list-item-title>
        </v-list-item-content>
        <v-list-item-content>
          <v-list-item-subtitle><div v-html="workFlowTicketTracking" /></v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>

      <v-list-item class="zebra-table">
        <v-list-item-content class="override-title">
          <v-list-item-title>Description:</v-list-item-title>
        </v-list-item-content>
        <v-list-item-content>
          <v-list-item-subtitle class="text-wrap"><div v-html="workFlowDescription" /></v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>

      <v-list-item class="non-zebra-table">
        <v-list-item-content class="override-title">
          <v-list-item-title>Date Modified:</v-list-item-title>
        </v-list-item-content>
        <v-list-item-content>
          <v-list-item-subtitle><div v-html="workFlowDateModified" /></v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>

      <!-- <v-list-item class="zebra-table">
        <v-list-item-content class="override-title">
          <v-list-item-title>Pipeline Hash:</v-list-item-title>
        </v-list-item-content>
        <v-list-item-content>
          <v-list-item-subtitle><div v-html="workFlowPipelineHash" /></v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item> -->

      <v-list-item class="zebra-table">
        <v-list-item-content class="override-title">
          <v-list-item-title>Revised Categorization:</v-list-item-title>
        </v-list-item-content>
        <v-list-item-content>
          <v-list-item-subtitle><div v-html="workFlowRevisedCategorization" /></v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>

      <v-list-item class="zebra-table">
        <v-list-item-content class="override-title">
          <v-list-item-title>Revised Severity:</v-list-item-title>
        </v-list-item-content>
        <v-list-item-content>
          <v-list-item-subtitle>
            <div v-if=is_override_status() class="override-text" v-html="workFlowRevisedSeverityOverride" />
            <div v-else v-html="workFlowRevisedSeverity" />
          </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
      
    </v-list>   
   </v-col>     
  </v-row>
</template>

<script lang="ts">
import HtmlSanitizeMixin from '@/mixins/HtmlSanitizeMixin';
import {HDFControlSegment} from 'inspecjs';
import Component, {mixins} from 'vue-class-component';
import {Prop} from 'vue-property-decorator';

@Component({})
export default class OverrideRowCol extends mixins(HtmlSanitizeMixin) {
  @Prop({type: String, required: true}) readonly statusCode!: string;
  @Prop({type: Object, required: true}) readonly result!: HDFControlSegment;

  get status_color(): string {
    // maps stuff like "not applicable" -> "statusnotapplicable", which is a defined color name
    return `status${this.statusCode.replace(' ', '')}`;
  }

  get hasOverrideData(): boolean | undefined {
    if (this.result.override == undefined) {
      return false;
    }
    return true;
  }

  get workFlowTest(): string | undefined {
    return this.result.code_desc.trim()
  }

  get workFlowRequestType(): string | undefined | null {
    if (this.result.override == undefined) {
      return "";
    }
    return this.result.override.request_type
  }
  
  get workFlowCABStatus(): string | undefined | null {
    if (this.result.override == undefined) {
      return "";
    }
    return this.result.override.cab_status
  }

  get workFlowCABStatusOverride(): string | undefined {
    if (this.result.override == undefined) {
      return "";
    }
    return this.result.originalStatus + " -> " + this.result.status
  }
  
  get workFlowCABDate(): string | undefined | null {
    if (this.result.override == undefined) {
      return "";
    }
    return this.result.override.cab_date
  }
  
  get workFlowCyberReviewer(): string | undefined | null {
    if (this.result.override == undefined) {
      return "";
    }
    return this.result.override.cyber_reviewer
  }

  get workFlowTicketTracking(): string | undefined {
    if (this.result.override == undefined) {
      return "";
    }
    return "<a href=\"" + this.result.override.ticket_tracking + "\">" + this.result.override.ticket_tracking + "</a>"
  }  

  get workFlowDescription(): string | undefined | null {
    if (this.result.override == undefined) {
      return "";
    }
    return this.result.override.description
  }

  get workFlowDateModified(): string | undefined | null {
    if (this.result.override == undefined) {
      return "";
    }
    return this.result.override.date_modified
  }  
  
  get workFlowPipelineHash(): string | undefined | null {
    if (this.result.override == undefined) {
      return "";
    }
    return this.result.override.pipeline_hash
  }

  get workFlowRevisedCategorization(): string | undefined | null {
    if (this.result.override == undefined) {
      return "";
    }
    return this.result.override.revised_categorization
  }

  get workFlowRevisedSeverity(): string | undefined {
    if (this.result.override == undefined || this.result.override.revised_severity == undefined) {
      return "";
    }
    return this.result.override.revised_severity.toString()
  }

  get workFlowRevisedSeverityOverride(): string | undefined {
    if (this.result.override == undefined || this.result.override.revised_severity == undefined || this.result.originalSeverity == undefined) {
      return "";
    }
    return this.result.originalSeverity.toString() + " -> " + this.result.override.revised_severity.toString()
  }

  is_override_status() {
    if (this.result.originalStatus !== "") {
      if (this.result.originalStatus !== this.result.status) {
        return true
      }
    }

    return false
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

.theme--dark .zebra-table {
  background-color: var(--v-secondary-lighten2); 
  max-width: 99.9%;
  margin: auto;
}

.theme--dark .non-zebra-table {
  //background-color: var(--v-secondary-lighten2); 
  max-width: 99.9%;
  margin: auto;
}

.theme--dark .override-title {
  max-width: 10%;
  margin: auto;
}

.theme--dark .override-text {
  color: yellow;
  font-size: 120%;
}
</style>
