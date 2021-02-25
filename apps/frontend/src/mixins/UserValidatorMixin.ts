import {Component, Vue} from 'vue-property-decorator';
import {ValidationProperties} from 'vue/types/vue';
import {validationMixin} from 'vuelidate';

@Component({
  mixins: [validationMixin]
})
export default class UserValidatorMixin extends Vue {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  emailErrors(field: ValidationProperties<any>) {
    const errors: Array<string> = [];
    if (!field.$dirty) {
      return [];
    }
    !field.required && errors.push('Email is required.');
    !field.email && errors.push('Must be valid email');
    return errors;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  requiredFieldError(field: ValidationProperties<any>, name: string) {
    const errors: Array<string> = [];
    if (!field.$dirty) {
      return [];
    }
    !field.required && errors.push(`${name} is required.`);
    return errors;
  }
}
