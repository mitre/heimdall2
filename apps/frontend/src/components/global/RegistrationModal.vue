<template>
  <Modal
    :visible="visible"
    :max-width="'600px'"
    :persistent="true"
    @close-modal="$emit('close-modal')"
    @update-user-table="$emit('update-user-table')"
  >
    <v-card class="elevation-12">
      <v-toolbar color="primary" dark flat>
        <v-toolbar-title id="registration_form_title">
          Register to Heimdall Server
        </v-toolbar-title>
        <v-spacer />
      </v-toolbar>
      <v-card-text>
        <v-form ref="form" name="signup_form" @submit.prevent="register">
          <v-row>
            <v-col>
              <v-text-field
                id="firstName_field"
                v-model="firstName"
                :error-messages="requiredFieldError($v.firstName, 'First Name')"
                name="firstName"
                label="First Name"
                prepend-icon="mdi-account"
                type="text"
                tabindex="1"
                @blur="$v.firstName.$touch()"
              />
            </v-col>
            <v-col>
              <v-text-field
                id="lastName_field"
                v-model="lastName"
                :error-messages="requiredFieldError($v.lastName, 'Last Name')"
                name="lastName"
                label="Last Name"
                type="text"
                tabindex="2"
                @blur="$v.lastName.$touch()"
              />
            </v-col>
          </v-row>
          <v-text-field
            id="email_field"
            v-model="email"
            :error-messages="emailErrors($v.email)"
            name="email"
            label="Email"
            prepend-icon="mdi-at"
            type="text"
            tabindex="3"
            @blur="$v.email.$touch()"
          />
          <br />
          <v-text-field
            id="password"
            v-model="password"
            prepend-icon="mdi-lock"
            name="password"
            label="Password"
            :type="showPassword ? 'text' : 'password'"
            tabindex="4"
            @blur="$v.password.$touch()"
          >
            <template #append>
              <v-icon @click="showPassword = !showPassword">{{
                showPassword ? 'mdi-eye' : 'mdi-eye-off'
              }}</v-icon>
            </template>
          </v-text-field>
          <v-row
            v-for="(validator, i) in validatorList"
            :key="i"
            :class="
              validator.check(password)
                ? 'd-flex success--text'
                : 'd-flex error--text'
            "
          >
            <v-icon
              class="pl-9"
              :color="validator.check(password) ? 'success' : 'error'"
              small
              >{{
                validator.check(password) ? 'mdi-check' : 'mdi-close'
              }}</v-icon
            >
            <small class="pl-1" color="red">{{ validator.name }}</small>
          </v-row>
          <br />
          <v-text-field
            id="passwordConfirmation"
            v-model="passwordConfirmation"
            name="passwordConfirmation"
            :error-messages="
              requiredFieldError(
                $v.passwordConfirmation,
                'Password Confirmation'
              )
            "
            label="Confirm Password"
            prepend-icon="mdi-lock-alert"
            type="password"
            @blur="$v.passwordConfirmation.$touch()"
          />
          <br />
          <v-btn
            id="register"
            depressed
            large
            :disabled="registrationDisabled"
            color="primary"
            type="submit"
            :loading="buttonLoading"
          >
            Register
          </v-btn>
        </v-form>
      </v-card-text>
      <v-card-actions v-if="!adminRegisterMode">
        <v-spacer />

        <div class="my-2">
          <router-link to="/login">
            <v-btn id="login_button" depressed small>Login</v-btn>
          </router-link>
        </div>
      </v-card-actions>
    </v-card>
  </Modal>
</template>

<script lang="ts">
import Modal from '@/components/global/Modal.vue';
import UserValidatorMixin from '@/mixins/UserValidatorMixin';
import {ServerModule} from '@/store/server';
import {SnackbarModule} from '@/store/snackbar';
import {
  validatePasswordBoolean,
  validators
} from '@heimdall/password-complexity';
import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop} from 'vue-property-decorator';
import {email, required, sameAs} from 'vuelidate/lib/validators';

export interface SignupHash {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  passwordConfirmation: string;
  role: string;
  creationMethod: string;
}

@Component({
  mixins: [UserValidatorMixin],
  components: {Modal},
  validations: {
    firstName: {
      required
    },
    lastName: {
      required
    },
    email: {
      required,
      email
    },
    password: {
      required
    },
    passwordConfirmation: {
      required,
      sameAsPassword: sameAs('password')
    }
  }
})
export default class RegistrationModal extends Vue {
  firstName = '';
  lastName = '';
  email = '';
  password = '';
  passwordConfirmation = '';
  showPassword = false;
  validatorList = validators;
  buttonLoading = false;

  @Prop({type: Boolean, default: false}) readonly adminRegisterMode!: boolean;
  @Prop({default: false}) readonly visible!: boolean;

  login() {
    this.$router.push('/login');
  }

  async register(): Promise<void> {
    this.buttonLoading = true;
    // checking if the input is valid
    if ((this.$refs.form as HTMLFormElement).validate()) {
      const creds: SignupHash = {
        firstName: this.firstName,
        lastName: this.lastName,
        email: this.email,
        password: this.password,
        passwordConfirmation: this.passwordConfirmation,
        role: 'user',
        creationMethod: 'local'
      };

      await ServerModule.Register(creds);

      if (this.adminRegisterMode) {
        SnackbarModule.notify('You have successfully registered a new user');
        await ServerModule.FetchAllUsers();
        this.$emit('close-modal');
        this.$emit('update-user-table');
      } else {
        this.$router.push('/login');
        SnackbarModule.notify(
          'You have successfully registered, please sign in'
        );
      }
      this.buttonLoading = false;
    }
  }

  get registrationDisabled(): boolean {
    return this.$v.$invalid || !validatePasswordBoolean(this.password);
  }

  get passwordConfirmationErrors() {
    const errors: string[] = [];
    if (!this.$v.passwordConfirmation.$dirty) {
      return errors;
    }
    if (!this.$v.passwordConfirmation.sameAsPassword) {
      errors.push('Password and password confirmation must match.');
    }
    return errors;
  }
}
</script>
