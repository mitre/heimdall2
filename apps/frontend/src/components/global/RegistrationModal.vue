<template>
  <Modal
    :visible="visible"
    :max-width="'500px'"
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
            :class="
              passwordValidation.meetsCharRequirement
                ? 'd-flex success--text'
                : 'd-flex error--text'
            "
          >
            <v-icon
              class="pl-9"
              :color="
                passwordValidation.meetsCharRequirement ? 'success' : 'error'
              "
              small
              >{{
                passwordValidation.meetsCharRequirement
                  ? 'mdi-check'
                  : 'mdi-close'
              }}</v-icon
            >
            <small class="pl-1" color="red"
              >Password must be at least 15 characters</small
            >
          </v-row>
          <v-row
            :class="
              passwordValidation.meetsClassRequirement
                ? 'd-flex success--text'
                : 'd-flex error--text'
            "
          >
            <v-icon
              class="pl-9"
              :color="
                passwordValidation.meetsClassRequirement ? 'success' : 'error'
              "
              small
              >{{
                passwordValidation.meetsClassRequirement
                  ? 'mdi-check'
                  : 'mdi-close'
              }}</v-icon
            >
            <small class="pl-1" color="red"
              >Password must contain lowercase letters, uppercase letters,
              numbers, and special characters</small
            >
          </v-row>
          <v-row
            :class="
              passwordValidation.meetsNoRepeatsRequirement
                ? 'd-flex success--text'
                : 'd-flex error--text'
            "
          >
            <v-icon
              class="pl-9"
              :color="
                passwordValidation.meetsNoRepeatsRequirement
                  ? 'success'
                  : 'error'
              "
              small
              >{{
                passwordValidation.meetsNoRepeatsRequirement
                  ? 'mdi-check'
                  : 'mdi-close'
              }}</v-icon
            >
            <small class="pl-1" color="red"
              >Password must not contain 4 consecutive characters of the same
              character class</small
            >
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
            :disabled="$v.$invalid || passwordValidation.errors.length !== 0"
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
import Vue from 'vue';
import Component from 'vue-class-component';

import {ServerModule} from '@/store/server';
import {required, email, sameAs} from 'vuelidate/lib/validators';

import UserValidatorMixin from '@/mixins/UserValidatorMixin';
import Modal from '@/components/global/Modal.vue';
import {SnackbarModule} from '@/store/snackbar';
import {Prop, Watch} from 'vue-property-decorator';
import {IPasswordValidationResult} from '@heimdall/interfaces';

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
  passwordValidation: IPasswordValidationResult = {
    errors: [],
    isString: true,
    meetsCharRequirement: false,
    meetsClassRequirement: false,
    meetsNoRepeatsRequirement: false
  };
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

      ServerModule.Register(creds)
        .then(() => {
          if(this.adminRegisterMode) {
            SnackbarModule.notify(
              'You have successfully registered a new user'
            );
            this.$emit('close-modal')
            this.$emit('update-user-table')
          } else {
            this.$router.push('/login');
            SnackbarModule.notify(
              'You have successfully registered, please sign in'
            );
          }
      }).finally(() => {
          this.buttonLoading = false;
      })
    }
  }

  @Watch('password')
  async onUpdatePassword() {
    this.checkPasswordComplexity();
  }

  async checkPasswordComplexity() {
    ServerModule.CheckPasswordComplexity(this.password).then((passwordErrors) => {
      this.passwordValidation = passwordErrors
    })
  }

  passwordValidationStyle(passedTest: boolean) {
    return passedTest ? {} : {'color': '#ff5252'}
  }

  // password strength bar expects a percentage
  get passwordStrengthPercent() {
    // Minimum length is 15. 100/15 = 6.67 so each char is 6.67% of the way to acceptable
    return this.password.length * 6.67;
  }

  // Since there are 3 colors available, 0-49% displays red, 50% displays yellow, and 51-100% displays green
  get passwordStrengthColor() {
    return ['error', 'warning', 'success'][
      Math.floor(this.passwordStrengthPercent / 50)
    ];
  }

  get passwordConfirmationErrors() {
    const errors: Array<string> = [];
    if (!this.$v.passwordConfirmation.$dirty) {
      return errors;
    }
    if(!this.$v.passwordConfirmation.sameAsPassword) {
      errors.push('Password and password confirmation must match.');
    }
    return errors;
  }
}
</script>
