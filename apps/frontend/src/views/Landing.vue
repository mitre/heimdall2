<template>
  <Base
    :show-toolbar="false"
    :show-topbar="serverMode"
    :minimal-topbar="true"
    :topbar-z-index="1000"
    :show-search="true"
    @changed-files="evalInfo = null"
  >
    <v-row>
      <v-col center xl="8" md="8" sm="12" xs="12">
        <ProjectModal v-if="isProjectMode" retain-focus :persistent="true" />
        <UploadNexus v-else retain-focus :persistent="true" />
      </v-col>
    </v-row>
  </Base>
</template>

<script lang="ts">
import ProjectModal from '@/components/global/ProjectModal.vue';
import UploadNexus from '@/components/global/UploadNexus.vue';
import ServerMixin from '@/mixins/ServerMixin';
import {ServerModule} from '@/store/server';
import Base from '@/views/Base.vue';
import Component, {mixins} from 'vue-class-component';
@Component({
  components: {
    ProjectModal,
    UploadNexus,
    Base
  }
})
export default class Landing extends mixins(ServerMixin) {
  get isProjectMode() {
    return ServerModule.projectMode;
  }
}
</script>
