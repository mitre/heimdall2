<template>
  <BaseView
    :show-toolbar="false"
    :show-topbar="serverMode"
    :minimal-topbar="true"
    :topbar-z-index="1000"
  >
    <v-row>
      <v-col center xl="8" md="8" sm="12" xs="12">
        <UploadNexus retain-focus :persistent="true" />
      </v-col>
    </v-row>
  </BaseView>
</template>

<script lang="ts">
import Vue from 'vue';
import Component, {mixins} from 'vue-class-component';
import ServerMixin from '@/mixins/ServerMixin';
import UploadNexus from '@/components/global/UploadNexus.vue';
import BaseView from '@/views/BaseView.vue';
import VueShepherd from 'vue-shepherd';
import '@/assets/onboarding_tour.css';

Vue.use(VueShepherd);

@Component({
  components: {
    UploadNexus,
    BaseView
  }
})
export default class Landing extends mixins(ServerMixin) {
  mounted() {
    this.onboardingTour()
  }

  onboardingTour() {
    this.$nextTick(() => {
      setTimeout(() => {
        const tour = Vue.prototype.$shepherd({
          defaultStepOptions:{
            cancelIcon: {
              enabled: true
            }
          },
          useModalOverlay: true
        });

        const buttonsStart = [
          {
            text: 'YES',
            action: tour.next
          },
          {
            text: 'NO',
            action: tour.cancel
          }
        ]

        const defaultButtons = [
          {
            text: 'BACK',
            action: tour.back
          },
          {
            text: 'NEXT',
            action: tour.next
          }
        ]

        tour.addSteps([
          {
            title: 'Welcome to Heimdall',
            attachTo: {element: '#heimdall-welcome', on: 'auto'},
            text: 'Would you like to take a quick tour of Heimdall?',
            buttons: buttonsStart,
          },
          {
            attachTo: {element: '#select-tab-local', on: 'auto'},
            title: 'Local Files',
            text: 'Here you can easily load any supported Heimdall Data Format files',
            buttons: defaultButtons
          },
          {
            attachTo: {element: '#select-tab-database', on: 'auto'},
            title: 'Database',
            text: "Click here to view files loaded onto your organization's Heimdall Server",
            buttons: defaultButtons
          },
          {
            attachTo: {element: '#select-tab-s3', on: 'auto'},
            title: 'S3 Bucket',
            text: 'Here you can access the S3 buckett',
            buttons: defaultButtons
          },
          {
            attachTo: {element: '#select-tab-splunk', on: 'auto'},
            title: 'Splunk',
            text: 'Click here to access the Splunk HDF plugin',
            buttons: defaultButtons
          },
          {
            attachTo: {element: '#select-tab-sample', on: 'auto'},
            title: 'Samples',
            text: 'Here you can use our sample files to display the power of Heimdall',
            buttons: defaultButtons
          },
          {
            attachTo: {element: '#user-icon', on: 'auto'},
            title: 'Your Account',
            text: 'Here you can access more user information and group information',
            buttons: defaultButtons
          },
          {
            title: 'Further Information',
            text: 'For further information on how to use Heimdall click <a href="https://google.com"> here </a>',
            buttons: [
              {
                text: 'BACK',
                action: tour.back
              },
              {
                text: 'FINISH',
                action: tour.complete
              }
            ]
          }
        ])
        if(!localStorage.getItem('onboarding-tour')) {
          tour.start();
          localStorage.setItem('onboarding-tour', 'yes');
        }
        }, 200)
    });
  }
}
</script>
