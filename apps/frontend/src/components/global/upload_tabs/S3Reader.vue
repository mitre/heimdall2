<template>
  <div>
    <div v-if="shown_window === 'NoAuth'">
      <span>
        Provide S3 credentials
      </span>
      <div v-if="shown_error">
        <p class="font-italic error--text">{{ shown_error }}</p>
      </div>
      <v-form v-model="valid">
        <!-- :rules="nameRules" -->
        <v-text-field
          v-model="base_access_token"
          label="Access Token"
          lazy-validation="lazy"
          required
          :rules="field_rules"
        />
        <v-text-field
          v-model="base_secret_token"
          label="Secret Token"
          required
          :rules="field_rules"
          :append-icon="show_secret ? 'mdi-eye' : 'mdi-eye-off'"
          :type="show_secret ? 'text' : 'password'"
          @click:append="show_secret = !show_secret"
        />
        <v-text-field
          v-model="s3_role_arn"
          label="AWS S3 Role ARN"
          required
          :rules="field_rules"
        />
        <v-text-field v-model="bucket_name" label="Bucket" required />
        <v-btn :disabled="!valid" @click="refresh"> Submit </v-btn>
      </v-form>
    </div>
    <div v-else-if="shown_window === 'BaseAuth'">
      <div class="d-flex justify-space-between">
        <v-btn small title="Back" @click="back">
          <v-icon>
            mdi-arrow-left
          </v-icon>
        </v-btn>
        <span>MFA Auth Required</span>
        <div />
      </div>
      <div v-if="shown_error">
        <p class="font-italic error--text">{{ shown_error }}</p>
      </div>
      <v-form v-model="valid">
        <v-text-field
          v-model="mfa_serial"
          label="MFA Auth Device Serial Key"
          required
        />
        <v-text-field v-model="mfa_token" label="MFA Auth Token" required />
        <v-btn :disabled="!valid" @click="refresh"> Submit </v-btn>
      </v-form>
    </div>
    <div v-else-if="shown_window === 'FullyAuthed'">
      <div class="d-flex justify-space-between">
        <v-btn small title="Back" @click="back">
          <v-icon>
            mdi-arrow-left
          </v-icon>
        </v-btn>
        <span>From {{ bucket_name }}</span>
        <v-btn small title="Reload" @click="refresh">
          <v-icon>
            mdi-refresh
          </v-icon>
        </v-btn>
      </div>
      <v-list :two-line="true">
        <v-list-item v-if="files.length === 0">
          No items found! Try refreshing?
        </v-list-item>
        <v-list-item v-for="(val, index) in files" :key="val.Key">
          <v-list-item-content>
            <!-- Title: The item key -->
            <v-list-item-title>{{ val.Key }}</v-list-item-title>
            <!-- Subtitle: Date of creation -->
            <v-list-item-subtitle>{{ val.LastModified }}</v-list-item-subtitle>
          </v-list-item-content>
          <!-- Action: Click to add -->
          <v-list-item-action>
            <v-btn icon @click="load_file(index)">
              <v-icon>mdi-plus-circle</v-icon>
            </v-btn>
          </v-list-item-action>
        </v-list-item>
      </v-list>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { getModule } from "vuex-module-decorators";
import S3, { ObjectKey } from "aws-sdk/clients/s3";
import STS from "aws-sdk/clients/sts";
import IAM from "aws-sdk/clients/iam";
import InspecIntakeModule, {
  FileID,
  next_free_file_ID
} from "@/store/report_intake";
import { AWSError } from "aws-sdk/lib/error";
import { defined } from "@/utilities/async_util";
import { PromiseResult } from "aws-sdk/lib/request";

// We declare the props separately to make props types inferable.
const Props = Vue.extend({
  props: {}
});

type AuthStatus = "NoAuth" | "BaseAuth" | "FullyAuthed";

/** MFA Config */
const AUTH_DURATION_SECONDS = 8 * 60 * 60; // 8 hours

/** Localstorage keys */
const BASE_ACCESS_STORAGE_KEY = "aws_s3_access_token";
const BASE_SECRET_STORAGE_KEY = "aws_s3_secret_token";
const MFA_ACCESS_STORAGE_KEY = "aws_s3_mfa_access_token";
const MFA_SECRET_STORAGE_KEY = "aws_s3_mfa_secret_token";
const MFA_SESSION_STORAGE_KEY = "aws_s3_mfa_session_token";
const MFA_SERIAL_STORAGE_KEY = "aws_s3_mfa_serial_date";
const BUCKET_STORAGE_KEY = "aws_s3_bucket_name";
const ROLE_STORAGE_KEY = "aws_s3_role";

/** represents the auth credentials for aws stuff */
interface AuthCreds {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
}

/**
 * File reader component for taking in inspec JSON data.
 * Uploads data to the store with unique IDs asynchronously as soon as data is entered.
 * Emits "got-files" with a list of the unique_ids of the loaded files.
 */
@Component({
  components: {}
})
export default class S3Reader extends Props {
  /** Models if currently displayed form is valid.
   * Shouldn't be used to interpret literally anything else as valid
   */
  valid: boolean = false;
  show_secret: boolean = false;

  /** Form required field rules. Maybe eventually expand to other stuff */
  field_rules = [(v: string) => !!v || "Field is required"];

  /** S3 configuration info */
  base_access_token: string = "";
  base_secret_token: string = "";
  s3_role_arn: string = "";
  bucket_name: string = "";

  /** MFA Field model if that ends ups being relevant */
  mfa_serial: string = ""; // Is there a way to get this programatically?
  mfa_token: string = "";
  assumed_role_creds: AuthCreds | null = null;

  /** Fields tracking actual auth status. */
  shown_window: AuthStatus = "NoAuth";
  shown_error: string | null = null;

  /** Currently visible files */
  files: S3.Object[] = [];

  /**
   * Logs out of current auth stage
   */
  async back() {
    this.assumed_role_creds = null;
    this.shown_error = null;
    this.files = [];
    this.shown_window = "NoAuth";
  }

  /** Attempts to authorize and show files with currently provided/loaded credentials.
   * This is the callback used by all "login" buttons.
   */
  async refresh() {
    this.shown_error = null;
    // First try to get files if we're already authed. Failing that, auth!
    if (this.shown_window === "FullyAuthed") {
      await this.fetch_files().then(
        files => {
          this.files = files;
        },
        error => {
          this.files = [];
          this.handle_error(error);
        }
      );
    } else {
      // Try to auth
      await this.try_authorize().then(() => {
        this.refresh(); // RECURSE
      });
    }
  }

  /** Performs authorization, based on current step.
   * Goes to correct screen and showing an error if it fails */
  async try_authorize(): Promise<void> {
    if (this.shown_window === "FullyAuthed") {
      throw new Error("Something's gone wrong. Shouldn't be authing here");
    }

    // Attempt to assume role based on if we've determined 2fa necessary
    let attempt: Promise<AuthCreds>;
    if (this.shown_window === "BaseAuth") {
      // Try with MFA!
      attempt = this.assume_role(true);
    } else {
      // Try without
      attempt = this.assume_role(false);
    }
    await attempt.then(
      success => {
        // Save the creds
        this.assumed_role_creds = success;
        // Save that we're auth'd
        this.shown_window = "FullyAuthed";
        // Cache
        this.save_creds();
      },
      (failure: any) => {
        // Handle the error.
        this.handle_error(failure);

        // Re-raise as generic
        throw new Error("Authorization failed. Re-prompting");
      }
    );
  }

  /** Calls assume role and returns the auth creds on success.
   * Fails with the AWS error otherwise
   */
  async assume_role(use_mfa: boolean): Promise<AuthCreds> {
    // Instanciate STS with our tokens
    let sts = new STS({
      accessKeyId: this.base_access_token,
      secretAccessKey: this.base_secret_token
    });

    // Make our request to be the role
    let result: Promise<PromiseResult<STS.AssumeRoleResponse, AWSError>>;
    const session_name = "Heimdall";
    if (use_mfa) {
      result = sts
        .assumeRole({
          RoleArn: this.s3_role_arn,
          RoleSessionName: session_name,
          SerialNumber: this.mfa_serial,
          TokenCode: this.mfa_token,
          DurationSeconds: AUTH_DURATION_SECONDS
        })
        .promise();
    } else {
      result = sts
        .assumeRole({
          RoleArn: this.s3_role_arn,
          RoleSessionName: session_name
          // DurationSeconds: AUTH_DURATION_SECONDS
        })
        .promise();
    }

    // Handle the response. On Success, save the creds. On error, throw that shit back!
    return await result.then(success => {
      defined(success); // Assert defined
      let creds: AuthCreds = {
        accessKeyId: success.Credentials!.AccessKeyId,
        secretAccessKey: success.Credentials!.SecretAccessKey,
        sessionToken: success.Credentials!.SessionToken
      };
      return creds;
    });
  }

  /** On mount, try to look up stored auth info */
  mounted() {
    // Get all stored auth info. Some will be null, but this is valid.
    // We do, however, assume that we won't somehow only be missing part of a "grouping" of records
    this.load_creds();
    if (this.assumed_role_creds !== null) {
      this.shown_window = "FullyAuthed";
    } else {
      this.shown_window = "NoAuth";
    }
    this.refresh();
  }

  /** Save the current credentials to local storage */
  save_creds() {
    let si = (k: string, v: string | undefined | null) => {
      if (v) {
        window.localStorage.setItem(k, v);
      } else {
        window.localStorage.removeItem(k);
      }
    };
    if (this.assumed_role_creds) {
      si(MFA_ACCESS_STORAGE_KEY, this.assumed_role_creds.accessKeyId);
      si(MFA_SECRET_STORAGE_KEY, this.assumed_role_creds.secretAccessKey);
      si(MFA_SESSION_STORAGE_KEY, this.assumed_role_creds.sessionToken);
    }
    si(MFA_SERIAL_STORAGE_KEY, this.mfa_serial);
    si(BASE_ACCESS_STORAGE_KEY, this.base_access_token);
    si(BASE_SECRET_STORAGE_KEY, this.base_secret_token);
    si(BUCKET_STORAGE_KEY, this.bucket_name);
    si(ROLE_STORAGE_KEY, this.s3_role_arn);
  }

  /** Load credentials from local storage */
  load_creds() {
    let gi = (key: string) => window.localStorage.getItem(key);
    this.base_access_token = gi(BASE_ACCESS_STORAGE_KEY) || "";
    this.base_secret_token = gi(BASE_SECRET_STORAGE_KEY) || "";
    this.bucket_name = gi(BUCKET_STORAGE_KEY) || "";
    this.s3_role_arn = gi(ROLE_STORAGE_KEY) || "";
    this.mfa_serial = gi(MFA_SERIAL_STORAGE_KEY) || "";
    let mfa_access_token = gi(MFA_ACCESS_STORAGE_KEY);
    let mfa_secret_token = gi(MFA_SECRET_STORAGE_KEY);
    let mfa_session_token = gi(MFA_SESSION_STORAGE_KEY);
    if (mfa_access_token && mfa_secret_token && mfa_session_token) {
      this.assumed_role_creds = {
        accessKeyId: mfa_access_token,
        secretAccessKey: mfa_secret_token,
        sessionToken: mfa_session_token
      };
    } else {
      this.assumed_role_creds = null;
    }
  }

  /** Callback for when user selects a file */
  async load_file(index: number): Promise<void> {
    // Get it out of the list
    let file = this.files[index];

    // Remove it from the list
    this.files.splice(index, 1);

    // Generate file id for it, and prep module for load
    let unique_id = next_free_file_ID();
    let intake_module = getModule(InspecIntakeModule, this.$store);

    // Fetch it from s3, and promise to submit it to be loaded afterwards
    new S3({ ...this.assumed_role_creds })
      .getObject({
        Key: file.Key!,
        Bucket: this.bucket_name
      })
      .promise()
      .then(
        success => {
          let content: string = new TextDecoder("utf-8").decode(
            success.Body! as Uint8Array
          );
          intake_module
            .loadText({
              text: content,
              filename: file.Key!,
              unique_id
            })
            .then(() => this.$emit("got-files", [unique_id]));
        },
        (failure: any) => this.handle_error(failure)
      );
  }

  /** Callback to handle an error */
  handle_error(error: any): void {
    // Unpack
    let code: string = error.code;
    let message: string = error.message;

    console.log(`Got error ${code} with message ${message}`);

    // Get what we're supposed to do with it
    switch (code) {
      case "TokenRefreshRequired":
      case "ExpiredToken":
        this.shown_window = "NoAuth";
        this.shown_error = "Authorization expired. Please input fresh token.";
        this.mfa_token = "";
        this.assumed_role_creds = null;
        this.refresh();
        break;
      case "InvalidAccessKeyId":
        this.shown_window = "NoAuth";
        this.shown_error = "Provided access key is invalid.";
        break;
      case "AccessDenied":
        this.shown_window = "NoAuth";
        this.shown_error =
          "Access denied. Verify that your access key and secret key are correct.";
        break;
      case "AccountProblem":
        this.shown_window = "NoAuth";
        this.shown_error =
          "Account problem detected. Log into the AWS console to diagnose.";
        break;
      case "CredentialsNotSupported":
        this.shown_window = "NoAuth";
        this.shown_error = "Provided credentials not supported.";
        break;
      case "InvalidBucketName":
        this.shown_window = "NoAuth";
        this.shown_error =
          "Invalid bucket name! Ensure you spelled it correctly.";
        break;
      case "NetworkingError":
        this.shown_window = "NoAuth";
        this.shown_error =
          "Networking error. Ensure that your bucket name and role arn are correct.";
        break;
      case "InvalidBucketState":
        this.shown_window = "NoAuth";
        this.shown_error = "Invalid bucket state! Check AWS console.";
        break;
      case "ValidationError":
        this.shown_window = "BaseAuth";
        this.shown_error = `Further validation required: ${message}`;
        break;
      default:
        this.shown_window = "NoAuth";
        this.shown_error = `Unkown error ${code}. Message: ${message}`;
        break;
    }
  }

  /** Retrieves the files from s3 bucket */
  async fetch_files(): Promise<S3.Object[]> {
    let s3 = new S3({ ...this.assumed_role_creds! });
    let objs = s3
      .listObjectsV2({
        Bucket: this.bucket_name,
        MaxKeys: 10
      })
      .promise();
    return objs.then(success => {
      return defined(success.Contents);
    });
  }
}
</script>
