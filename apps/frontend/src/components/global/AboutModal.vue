<template>
  <v-dialog
    v-model="dialog"
    width="75%"
  >
    <!-- clickable slot passes the activator prop up to parent
        This allows the parent to pass in a clickable icon -->
    <template #activator="{on}">
      <slot
        name="clickable"
        :on="on"
      />
    </template>
    <v-card>
      <v-card-title
        class="headline grey"
        primary-title
      >
        About Heimdall {{ instanceMode }}
      </v-card-title>

      <v-card-text>
        <p>
          <br>
          <span class="title">
            {{ version }}
          </span>
          <br>
          <br>
          <span class="subtitle-2">
            <strong>Changelog:</strong>
            <a :href="'' + repository + changelog + ''">
              {{ repository }}{{ changelog }}
            </a>
          </span>
          <br>
          <span class="subtitle-2">
            <strong>Github:</strong>
            <a :href="'' + repository + ''">
              {{ repository }}
            </a>
          </span>
          <br>
          <span class="subtitle-2">
            <br>
            If you would like to report an Issue or Feature Request,
            <a :href="'' + repository + issues + ''">
              let us know on github.
            </a>
          </span>
        </p>
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-btn
          color="primary"
          text
          @click="dialog = false"
        >
          Close Window
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import Component, { mixins } from 'vue-class-component';
import ServerMixin from '@/mixins/ServerMixin';
import { AppInfoModule } from '@/store/app_info';

@Component
export default class AboutModal extends mixins(ServerMixin) {
  dialog = false;

  get branch(): string {
    return AppInfoModule.branch;
  }

  get changelog(): string {
    return AppInfoModule.changelog;
  }

  // serverMode is define in ServerMixin
  get instanceMode(): string {
    return this.serverMode ? 'Server' : 'Lite';
  }

  get issues(): string {
    return AppInfoModule.issues;
  }

  get passedClickable(): boolean | undefined {
    return this.$slots.clickable ? true : false;
  }

  get repository(): string {
    return AppInfoModule.repository;
  }

  get version(): string {
    return AppInfoModule.version;
  }
}
</script>
