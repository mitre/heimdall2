<template>
  <Base
    :show-search="false"
    :minimal-topbar="true"
    :show-back-button="true"
    title="Heimdall - Groups"
  >
    <template #main-content>
      <v-container>
        <v-row>
          <v-col>
            <v-card>
              <GroupManagement :admin-panel="false" />
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </template>
  </Base>
</template>

<script lang="ts">
import GroupManagement from '@/components/global/groups/GroupManagement.vue';
import Base from '@/views/Base.vue';
import Vue from 'vue';
import {Component} from 'vue-property-decorator';

@Component({
  components: {
    Base,
    GroupManagement
  }
})
export default class Groups extends Vue {}
</script>
