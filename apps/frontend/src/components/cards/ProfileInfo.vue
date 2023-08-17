<template>
  <v-tabs grow>
    <v-tab href="#tab-profileInfo"> Profile Info </v-tab>
    <v-tab href="#tab-inputs"> Inputs </v-tab>
    <v-tab-item value="tab-profileInfo">
      <v-scroll-y-transition mode="out-in">
        <div
          v-if="!profile"
          class="title grey--text text--lighten-1 font-weight-light"
          style="align-self: center"
        >
          Select a Profile
        </div>
        <v-card v-else :key="profile.id" flat>
          <v-card-title>
            <div class="mb-2">{{ profile.data.title }}</div>
          </v-card-title>
          <v-divider />
          <v-row class="text-left pa-4" dense data-cy="profileInfoFields">
            <v-col cols="12">
              <div v-if="from_file">
                <strong>From File:</strong> {{ from_file }}
              </div>
              <div v-if="version"><strong>Version:</strong> {{ version }}</div>
              <div v-if="sha256_hash">
                <strong>SHA256 Hash:</strong> {{ sha256_hash }}
              </div>
              <div v-if="maintainer">
                <strong>Maintainer:</strong> {{ maintainer }}
              </div>
              <div v-if="copyright">
                <strong>Copyright:</strong> {{ copyright }}
              </div>
              <div v-if="copyright_email">
                <strong>Copyright Email:</strong> {{ copyright_email }}
              </div>
              <div v-if="control_count">
                <strong>Control Count:</strong> {{ control_count }}
              </div>
            </v-col>
          </v-row>
        </v-card>
      </v-scroll-y-transition>
    </v-tab-item>
    <v-tab-item value="tab-inputs">
      <v-scroll-y-transition mode="out-in">
        <div
          v-if="!profile"
          class="title grey--text text--lighten-1 font-weight-light"
          style="align-self: center"
        >
          Select a Profile
        </div>
        <v-card v-else :key="profile.id" flat>
          <v-card-title>
            <div class="mb-2">Inputs for {{ profile.data.title }}</div>
          </v-card-title>
          <div v-if="inputs.length !== 0">
            <v-data-table :headers="headers" :items="inputs"
              ><template #[`item.options`]="{item}">
                {{ item.options.value }}
              </template>
            </v-data-table>
          </div>
          <div v-else>
            <v-card-text> No inputs found. </v-card-text>
          </div>
        </v-card>
      </v-scroll-y-transition>
    </v-tab-item>
  </v-tabs>
</template>

<script lang="ts">
import {SourcedContextualizedProfile} from '@/store/report_intake';
import * as _ from 'lodash';
import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop} from 'vue-property-decorator';

interface Attribute {
  name: string;
  options: {
    value: unknown;
  };
}

@Component({})
export default class ProfileInfo extends Vue {
  @Prop({required: false}) readonly profile:
    | SourcedContextualizedProfile
    | undefined;

  headers: Object[] = [
    {
      text: 'Name',
      align: 'start',
      sortable: true,
      value: 'name'
    },
    {text: 'Value', value: 'options', sortable: true}
  ];

  get from_file(): string | undefined {
    return _.get(this.profile, 'sourcedFrom.from_file.filename') as unknown as
      | string
      | undefined;
  }

  get version(): string | undefined {
    return _.get(this.profile, 'data.version') as unknown as string | undefined;
  }

  get sha256_hash(): string | undefined {
    return _.get(this.profile, 'data.sha256') as unknown as string | undefined;
  }

  get maintainer(): string | undefined {
    return _.get(this.profile, 'data.maintainer') as unknown as
      | string
      | undefined;
  }

  get copyright(): string | undefined {
    return _.get(this.profile, 'data.copyright') as unknown as
      | string
      | undefined;
  }

  get copyright_email(): string | undefined {
    return _.get(this.profile, 'data.copyright_email') as unknown as
      | string
      | undefined;
  }

  get control_count(): string | undefined {
    return `${
      (
        _.get(this.profile, 'data.controls') as unknown as Record<
          string,
          unknown
        >[]
      ).length
    }`;
  }

  get inputs(): Attribute[] {
    if (this.profile?.data.hasOwnProperty('attributes')) {
      return _.get(this.profile, 'data.attributes') as unknown as Attribute[];
    } else {
      return _.get(this.profile, 'data.inputs') as unknown as Attribute[];
    }
  }
}
</script>
