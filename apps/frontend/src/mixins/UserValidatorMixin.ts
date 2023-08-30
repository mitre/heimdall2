import * as _ from 'lodash';
import {Component, Vue} from 'vue-property-decorator';
import ValidationProperties from 'vue/types/vue';
import {validationMixin} from 'vuelidate';

@Component({
  mixins: [validationMixin]
})
export default class UserValidatorMixin extends Vue {
  emailErrors(field: typeof ValidationProperties) {
    const errors: string[] = [];
    const dirty = _.get(field, '$dirty');
    const required = _.get(field, 'required');
    const email = _.get(field, 'email');
    if (!dirty) {
      return [];
    }
    !required && errors.push('Email is required.');
    !email && errors.push('Must be valid email');
    return errors;
  }

  requiredFieldError(field: typeof ValidationProperties, name: string) {
    const errors: string[] = [];
    const dirty = _.get(field, '$dirty');
    const required = _.get(field, 'required');
    if (!dirty) {
      return [];
    }
    !required && errors.push(`${name} is required.`);
    return errors;
  }
}
