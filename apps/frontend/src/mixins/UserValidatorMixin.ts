import {Component, Vue} from 'vue-property-decorator';
import {ValidationProperties} from 'vue/types/vue';
import {validationMixin} from 'vuelidate';

@Component({
  mixins: [validationMixin]
})
export default class UserValidatorMixin extends Vue {
  get emailErrors() {
    const errors: Array<string> = [];
    if (!this.$v.email.$dirty) {
      return [];
    }
    !this.$v.email.required && errors.push('Email is required.');
    !this.$v.email.email && errors.push('Must be valid email');
    return errors;
  }

  requiredFieldError(field: ValidationProperties<any>, name: string) {
    const errors: Array<string> = [];
    if (!field.$dirty) {
      return [];
    }
    !field.required && errors.push(`${name} is required.`);
    return errors;
  }
}
