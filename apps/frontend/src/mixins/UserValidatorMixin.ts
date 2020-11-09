import {Component, Vue} from 'vue-property-decorator';
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

  get passwordErrors() {
    const errors: Array<string> = [];
    if (!this.$v.password.$dirty) {
      return [];
    }
    !this.$v.password.required && errors.push('Password is required.');
    return errors;
  }
}
