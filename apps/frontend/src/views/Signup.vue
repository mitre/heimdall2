<template>
  <v-app id="inspire">
    <RegistrationModal :visible="true" />
  </v-app>
</template>
<script lang="ts">
import RegistrationModal from '@/components/global/RegistrationModal.vue';
import Vue from 'vue';
import Component from 'vue-class-component';

@Component({
  components: {RegistrationModal}
})
export default class Signup extends Vue {}
</script>
