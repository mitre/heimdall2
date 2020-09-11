import Vue from 'vue';
import {ToastOptions, ToastObject} from 'vue-toasted/types/index';

const baseToastOptions: ToastOptions = {
  position: 'top-center',
  containerClass: 'background v-application',
  duration: 10000
};

const defaultToastActions = [
  {
    text: 'Dismiss',
    onClick: (_: Event, toast_object: ToastObject) => toast_object.goAway(0)
  }
];

let successToastOptions: ToastOptions = {...baseToastOptions};
successToastOptions.action = [...defaultToastActions];

const errorToastOptions: ToastOptions = {...baseToastOptions};
errorToastOptions.action = [
  {
    text: 'Report Issue',
    href: 'https://github.com/mitre/heimdall2/issues/new/choose'
  },
  ...defaultToastActions
];

export default function SetupToasted() {
  Vue.toasted.register(
    'error',
    payload => {
      if (!payload.message) {
        return `ERROR: An unidentified error has occured, if functionality
          has degraded please try refreshing the page. If that does not fix the
          issue you are experiencing, then please report the issue`;
      }
      return 'ERROR: ' + payload.message;
    },
    errorToastOptions
  );

  Vue.toasted.register(
    'success',
    payload => {
      if (!payload.message) {
        return 'The action completed successfully.';
      }

      return payload.message;
    },
    successToastOptions
  );
}
