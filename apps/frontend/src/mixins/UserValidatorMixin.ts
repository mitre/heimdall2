import {Component, Vue} from 'vue-property-decorator';
import {ValidationProperties} from 'vue/types/vue';
import {validationMixin} from 'vuelidate';

@Component({
  mixins: [validationMixin]
})
export default class UserValidatorMixin extends Vue {
  emailErrors(field: ValidationProperties<any>) {
    const errors: Array<string> = [];
    if (!field.$dirty) {
      return [];
    }
    !field.required && errors.push('Email is required.');
    !field.email && errors.push('Must be valid email');
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
