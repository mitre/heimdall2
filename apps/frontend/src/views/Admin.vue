<template>
  <BaseView title="Heimdall - Admin Panel">
    <template #main-content>
      <v-tabs v-model="activeTab" fixed-tabs dark>
        <v-tab key="users"> User Management </v-tab>
      </v-tabs>
      <v-container>
        <v-row>
          <v-col>
            <v-card>
              <v-tabs-items v-model="activeTab">
                <v-tab-item key="users">
                  <UserManagement />
                </v-tab-item>
              </v-tabs-items>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </template>
  </BaseView>
</template>

<script lang="ts">
import Vue from 'vue';
import BaseView from '@/views/BaseView.vue';
import UserManagement from '@/components/global/admin/UserManagement.vue'
import {Component} from 'vue-property-decorator';

@Component({
  components: {
    BaseView,
    UserManagement
  }
})
export default class Admin extends Vue {
  activeTab = 'users';
}
</script>
