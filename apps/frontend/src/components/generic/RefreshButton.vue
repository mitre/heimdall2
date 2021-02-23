<template>
  <LinkItem
    id="refresh_button"
    key="user"
    text="Refresh"
    icon="mdi-refresh"
    @click="refreshEvaluations"
    >Refresh</LinkItem
  >
</template>

<script lang="ts">
import LinkItem from '@/components/global/sidebaritems/IconLinkItem.vue';
import Component from 'vue-class-component';
import Vue from 'vue';

@Component({
  components: {
    LinkItem
  }
})
export default class RefreshButton extends Vue {
  refreshEvaluations() {
    this.$emit('updateEvaluations')
  }
}
</script>
