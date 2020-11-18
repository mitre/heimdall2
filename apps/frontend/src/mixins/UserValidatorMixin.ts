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

  get currentPasswordErrors() {
    const errors: Array<string> = [];
    if (!this.$v.currentPassword.$dirty) {
      return [];
    }
    !this.$v.currentPassword.required && errors.push('Password is required.');
    return errors;
  }

  get newPasswordErrors() {
    const errors: Array<string> = [];
    if (!this.$v.newPassword.$dirty) {
      return [];
    }
    !this.$v.newPassword.required && errors.push('New Password is required.');
    return errors;
  }

  get repeatPasswordErrors() {
    const errors: Array<string> = [];
    console.log(this.$v);
    if (!this.$v.passwordConfirmation.$dirty) {
      return [];
    }
    !this.$v.passwordConfirmation.required &&
      errors.push('Repeated password is required.');
    return errors;
  }
}
