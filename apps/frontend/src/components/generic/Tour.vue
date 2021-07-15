<template>
  <span />
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import VueShepherd from 'vue-shepherd';
import {Prop} from 'vue-property-decorator';
import 'shepherd.js/dist/css/shepherd.css';
import {ServerModule} from '../../store/server';

Vue.use(VueShepherd);

@Component({})
export default class Tour extends Vue {
  @Prop({type: String, required: true}) readonly name!: string;
  mounted() {
    // Mounts appropriate tour after real DOM has generated
    this.tours()
  }
  // Generates a tour for user depending on the page they are visiting for the first time
  tours() {
    this.$nextTick(() => {
      // Delay needed to allow tour API to place the tour cards at the correct position
      setTimeout(() => {
        const tour = Vue.prototype.$shepherd({
          defaultStepOptions:{
            cancelIcon: {
              enabled: true
            },
            scrollTo: {behavior: 'smooth', block: 'center'}
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

        switch(this.name){
          // Builds tour for the onboarding user interface
          case('Landing'):
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
                buttons: defaultButtons,
                showOn() {
                  return document.querySelector('#select-tab-database') ? true : false;
                }
              },
              {
                attachTo: {element: '#select-tab-s3', on: 'auto'},
                title: 'S3 Bucket',
                text: 'Here you can access an S3 bucket',
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
                buttons: defaultButtons,
                showOn() {
                  return ServerModule.serverMode;
                }
              },
              {
                title: 'Further Information',
                text: 'For further information on how to use Heimdall click <a href="https://www.youtube.com/watch?v=1jXHWZ0gHQg" target="_blank"> here </a>',
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
            break
          // Builds tour for the results view page once user loads a file for the first time
          case('Results'):
            tour.addSteps([
              {
                title: "Welcome to the Results View Page",
                attachTo: {element: '#page-title', on: 'bottom'},
                text: "Would you like to take a quick tour of Heimdall's Results View?",
                buttons: buttonsStart
              },
              {
                title: "Search Bar",
                attachTo: {element: '#results-search', on: 'bottom'},
                text: "The search bar allows you to filter the reuslts found by Heimdall's scan",
                buttons: defaultButtons
              },
              {
                title: "Clear Filters",
                attachTo: {element: '#clear-filters', on: 'bottom'},
                text: "Click to clear filters on scan",
                buttons: defaultButtons
              },
              {
                title: "Upload Button",
                attachTo: {element: '#upload-btn', on: 'bottom'},
                text: "Click to load additional files into Heimdall to be scanned",
                buttons: defaultButtons
              },
              {
                title: "Export Files Scan",
                attachTo: {element: '#file-export', on: 'bottom'},
                text: "Click to export file scan into a downloadable spreadsheet",
                buttons: defaultButtons
              },
              {
                title: "File Cards",
                attachTo: {element: '#file-cards', on: 'bottom'},
                text: "View the loaded files along with additional info",
                buttons: defaultButtons
              },
              {
                title: "Status Cards",
                attachTo: {element: '#status-card-row', on: 'top'},
                text: "View file status of your scan",
                buttons: defaultButtons
              },
              {
                title: "Compliance Cards",
                attachTo: {element: '#compliance-cards', on: 'top'},
                text: "View file statuses, severity, and compliance level <strong>(To filter by status or severity click on the donut charts)",
                buttons: defaultButtons
              },
              {
                title: "Treemap",
                attachTo: {element: '#treemap', on: 'top'},
                text: "Use the treemap to navigate through your controls by NIST family classifications",
                buttons: defaultButtons
              },
              {
                title: "Data Table",
                attachTo: {element: '#data-table', on: 'top'},
                text: "Use the data table to  to sort your controls and see more details. You can also click on a control to detect which tests passed or failed, or see its details and code.",
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
            if(!localStorage.getItem('result-view-tour')) {
              tour.start();
              localStorage.setItem('result-view-tour', 'yes')
            }
            break
          default:
            tour.complete()
            break
          }
        }, 200)
    });
  }
}
</script>

<style lang="css">
.shepherd-button {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  font-weight: bold;
}

.shepherd-title {
  color: rgba(255, 255, 255, 0.75);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  font-weight: bold;
}

.shepherd-has-title .shepherd-content .shepherd-header {
  background: #3c3c3c;
}

.shepherd-text {
  color: rgba(60, 60, 60, 0.75);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  font-size: 1.1rem;
}
</style>
