import {
  Module,
  VuexModule,
  getModule,
  Mutation,
  Action
} from "vuex-module-decorators";
import Store from "@/store/store";
import { LocalStorageVal } from "@/utilities/helper_util";
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { plainToClass } from "class-transformer";
import InspecIntakeModule, {
  EvaluationFile,
  ProfileFile,
  FileID,
  next_free_file_ID
} from "@/store/report_intake";
import { Evaluation } from "@/types/models.ts";

export interface LoginHash {
  username: string;
  password: string;
}
export interface TagIdsHash {
  id: number;
  tagger_id: number;
}
export interface TagHash {
  tagger_id: number;
  name: string;
  value: string;
}
export interface RetrieveHash {
  unique_id: number;
  eva: Evaluation;
}

/** The body of a registration Request */
//"id":1,"first_name":null,"last_name":null,"email":"email@gmail.com","image":null,"phone_number":null,"createdAt":"2020-03-23T15:57:33.044Z","updatedAt":"2020-03-23T15:57:33.044Z"}
export class UserProfile {
  id!: number;
  first_name!: string;
  last_name!: string;
  email!: string;
  image!: string;
  phone_number!: string;
  createdAt!: Date;
  updatedAt!: Date;
}

const local_token = new LocalStorageVal<string | null>("auth_token");
const local_user = new LocalStorageVal<UserProfile | null>("user_profile");
const local_user_evaluations = new LocalStorageVal<string | null>(
  "user_evaluations"
);
const local_evaluation = new LocalStorageVal<string | null>("evaluation");
const local_tags = new LocalStorageVal<string | null>("evaluation_tags");

type ConnErrorType =
  | "NO_CONNECTION"
  | "BAD_CONNECTION"
  | "BAD_LOGIN"
  | "UNAUTHORIZED"
  | "BAD_RESPONSE"
  | "UNKNOWN";
export class ConnectionError extends Error {
  constructor(readonly type: ConnErrorType, readonly message: string) {
    super(`${type} - ${message}`);
  }
}

export class HSConnectionConfig {
  constructor(readonly url: string) {}

  /** Checks whether the connection works. If it succeeds, then assume all is well */
  async check(): Promise<void> {
    return fetch(this.url, { method: "get" })
      .then(response => response.text())
      .then(text => {
        if (text != "HS_ALIVE") {
          throw new ConnectionError("BAD_CONNECTION", "Connection failed");
        }
      });
  }
}

@Module({
  namespaced: true,
  dynamic: true,
  store: Store,
  name: "heimdallServer"
})
class HeimdallServerModule extends VuexModule {
  /** Our current target server parameters */
  connection: HSConnectionConfig | null = null;
  serverMode: boolean | null = null;
  serverUrl: string = "";
  @Mutation
  set_connection(new_url: string) {
    this.connection = new HSConnectionConfig(new_url);
  }

  @Action
  async connect(new_url: string): Promise<void> {
    console.log("connected :" + new_url);
    this.set_connection(new_url);
  }

  /** Our currently granted JWT token */
  token: string | null = local_token.get();
  profile: UserProfile | null = local_user.get();
  user_evaluations: string | null = local_user_evaluations.get();
  evaluation: string | null = local_evaluation.get();
  tags: string | null = local_tags.get();

  /** Mutation to set above, as well as to update our localstorage */
  @Mutation
  set_token(new_token: string | null) {
    this.token = new_token;
    console.log("server.ts - set token: " + this.token);
    local_token.set(new_token);
  }
  @Mutation
  mod_server_url(value: string) {
    this.serverUrl = value;
  }

  @Mutation
  mod_server_mode(value: boolean) {
    this.serverMode = value;
  }

  @Action
  server_mode() {
    let url = window.location.origin + "/api";
    console.log(url);
    /*This will check if api is available */
    if (process.env.VUE_APP_API_URL) {
      this.mod_server_url(process.env.VUE_APP_API_URL); // this.serverUrl = process.env.VUE_APP_API_URL;
      this.mod_server_mode(true);
    } else {
      axios
        .get(url, {
          validateStatus: function(status) {
            return status < 500; // Reject only if the status code is greater than or equal to 500
          }
        })
        .then(res => {
          console.log("test");
          if (res.status == 200) {
            this.mod_server_mode(true); //window.location.href;
            this.mod_server_url(url); // = true;
          } else {
            this.mod_server_mode(false);
          }
        })
        .catch(error => {
          console.log("caught error");
          this.mod_server_mode(false);
        });
    }
  }

  @Mutation
  set_server_url(url: string) {
    this.serverUrl = url;
  }

  /** Mutation to set above, as well as to update our localstorage */
  @Mutation
  set_evaluation(evaluation: string | null) {
    this.evaluation = evaluation;
    console.log("server.ts - set evaluation: " + this.evaluation);
    local_evaluation.set(evaluation);
  }

  /** Mutation to set above, as well as to update our localstorage */
  @Mutation
  set_tags(tags: string | null) {
    this.tags = tags;
    console.log("server.ts - set tags: " + this.tags);
    local_tags.set(tags);
  }

  /* Actions to authorize and set token */
  @Action
  clear_token() {
    this.set_token(null);
    this.set_user_profile(null);
    this.set_user_evaluations(null);
  }

  /** Mutation to set user_profile, as well as to update our localstorage */
  @Mutation
  set_user_profile(new_user: string | null) {
    if (new_user) {
      this.profile = plainToClass(UserProfile, new_user);
    } else {
      this.profile = null;
    }
    console.log("server.ts - set user: " + this.profile);
    local_user.set(this.profile);
  }

  /** Mutation to set user_profile, as well as to update our localstorage */
  @Mutation
  set_user_evaluations(evals: string | null) {
    if (evals) {
      this.user_evaluations = evals;
    } else {
      this.user_evaluations = null;
    }
    console.log("server.ts - set user_evaluations: " + this.user_evaluations);
    local_user_evaluations.set(this.user_evaluations);
  }

  /** Attempts to login to the server */
  @Action
  async login(creds: LoginHash): Promise<void> {
    console.log(
      "Logging in to " +
        this.connection!.url +
        "/auth/login" +
        " with " +
        creds["username"] +
        "/" +
        creds["password"]
    );
    //this.requires_connection();
    console.log("has connection");
    //curl -X POST http://localhost:8050/auth/login -d '{"username": "blah", "password": "blaah"}' -H "Content-Type: application/json"
    return fetch(this.connection!.url + "/auth/login", {
      body: `{"username": "${creds["username"]}", "password": "${creds["password"]}"}`,
      headers: {
        "Content-Type": "application/json"
      },
      method: "POST"
    })
      .then(this.check_code)
      .then(res => res.json())
      .then((v: any) => {
        if (typeof v === "object") {
          this.set_token(v.access_token);
          console.log("got token" + v.access_token);
          this.retrieve_profile();
          this.retrieve_personal_evaluations();
        } else {
          console.error(
            `Something went wrong: Got ${v.access_token} for login response`
          );
          throw new ConnectionError(
            "BAD_RESPONSE",
            "Got unrecognized login response"
          );
        }
      });
  }

  /** Attempts to login to the server */
  @Action
  async register(creds: LoginHash): Promise<void> {
    console.log(
      "Registering to " +
        this.connection!.url +
        "/auth/register" +
        " with " +
        creds["username"] +
        "/" +
        creds["password"]
    );
    //curl -X POST http://localhost:8050/auth/register -d '{"email": "blah@gmail.com", "password": "blaah"}' -H "Content-Type: application/json"
    return (
      fetch(this.connection!.url + "/auth/register", {
        body: `{"email": "${creds["username"]}", "password": "${creds["password"]}"}`,
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      })
        //.then(this.check_code)
        //.then(res => res.json())
        .then((v: Response) => {
          if (v.ok) {
            console.log("registration returned " + v.ok);
          } else {
            console.error(
              `Something went wrong: Got ${JSON.stringify(
                v
              )} for register response`
            );
            throw new ConnectionError(
              "BAD_RESPONSE",
              "Got unrecognized register response"
            );
          }
        })
    );
  }

  /** Attempts to login to the server */
  @Action
  async retrieve_profile(): Promise<void> {
    console.log("Getting " + this.connection!.url + "/auth/profile");
    //curl http://localhost:8050/auth/profile -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2Vybm..."
    return axios
      .get(this.connection!.url + "/auth/profile", {
        headers: {
          Authorization: `Bearer ${this.token}`
        }
      })
      .then((v: any) => {
        this.set_user_profile(v.data);
      });
  }

  /** Attempts to save evaluation to the database */
  @Action
  async save_evaluation(evaluation: EvaluationFile): Promise<void> {
    console.log(
      "Saving execution to " + this.connection!.url + "/executions/upload"
    );
    const options = {
      headers: {
        Authorization: `Bearer ${this.token}`
      }
    };
    return axios
      .post(
        this.connection!.url + "/executions/upload",
        {
          evaluation: evaluation.execution,
          filename: evaluation.filename
        },
        options
      )
      .then((v: any) => {
        console.log("saved");
      });
  }

  /** Attempts to retrieve a list of personal evaluations */
  @Action
  async retrieve_personal_evaluations(): Promise<void> {
    console.log("Getting " + this.connection!.url + "/executions/personal");
    //curl http://localhost:8050/executions/personal -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2Vybm..."
    return axios
      .get(this.connection!.url + "/executions/personal", {
        headers: {
          Authorization: `Bearer ${this.token}`
        }
      })
      .then((v: any) => {
        //console.log("personal evals: " + JSON.stringify(v.data));
        this.set_user_evaluations(v.data);
      });
  }

  /** Attempts to retrieve an evaluations */
  @Action
  async retrieve_evaluation(eval_hash: RetrieveHash): Promise<void> {
    console.log(
      "Getting " +
        this.connection!.url +
        "/executions/fetch/" +
        eval_hash.eva.id
    );
    //curl http://localhost:8050/executions/personal -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2Vybm..."
    return axios
      .get(this.connection!.url + "/executions/fetch/" + eval_hash.eva.id, {
        headers: {
          Authorization: `Bearer ${this.token}`
        }
      })
      .then((v: any) => {
        console.log("got evaluation: " + JSON.stringify(v.data));
        let intake_module = getModule(InspecIntakeModule, Store);
        intake_module.loadText({
          text: JSON.stringify(v.data),
          unique_id: eval_hash.unique_id,
          filename: eval_hash.eva.filename,
          database_id: eval_hash.eva.id,
          createdAt: eval_hash.eva.createdAt,
          updatedAt: eval_hash.eva.updatedAt,
          tags: eval_hash.eva.tags
        });
      });
  }

  /** Attempts to retrieve an evaluations */
  @Action
  async retrieve_tags(file_id: FileID): Promise<void> {
    console.log(
      "Getting " + this.connection!.url + "/executions/tags/" + file_id
    );
    //curl http://localhost:8050/executions/personal -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2Vybm..."
    return axios
      .get(this.connection!.url + "/executions/tags/" + file_id, {
        headers: {
          Authorization: `Bearer ${this.token}`
        }
      })
      .then((v: any) => {
        console.log("got tags: " + JSON.stringify(v.data));
        this.set_tags(v.data);
      });
  }

  /** Attempts to save evaluation to the database */
  @Action
  async save_tag(tag: TagHash): Promise<void> {
    console.log(
      "Saving tag (" +
        tag["name"] +
        ": " +
        tag["value"] +
        ") to " +
        this.connection!.url +
        "/executions/tags/" +
        tag["tagger_id"]
    );
    const options = {
      headers: {
        Authorization: `Bearer ${this.token}`
      }
    };
    return axios
      .post(
        this.connection!.url + "/executions/tags/" + tag["tagger_id"],
        {
          name: tag["name"],
          value: tag["value"]
        },
        options
      )
      .then((v: any) => {
        console.log("saved");
      });
  }

  /** Attempts to retrieve an evaluations */
  @Action
  async delete_tag(tag: TagIdsHash): Promise<void> {
    console.log(
      "Deleting " +
        this.connection!.url +
        "/executions/" +
        tag["tagger_id"] +
        "/tags/" +
        tag["id"]
    );
    //curl http://localhost:8050/executions/personal -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2Vybm..."
    return axios
      .delete(
        this.connection!.url +
          "/executions/" +
          tag["tagger_id"] +
          "/tags/" +
          tag["id"],
        {
          headers: {
            Authorization: `Bearer ${this.token}`
          }
        }
      )
      .then((v: any) => {
        console.log("deleted tag");
        console.log("got tags: " + JSON.stringify(v.data));
        this.set_tags(v.data);
      });
  }

  /** Our supposed role */
  // TODO:

  private async check_code(res: Response): Promise<Response> {
    // if ok, pass
    console.log("check_code res.ok: " + res.ok);
    if (res.ok) {
      console.log("check_code res.status: " + res.status);
      console.log("check_code res.body: " + res.body);
      return res;
    }

    switch (res.status) {
      case 401:
        throw new ConnectionError("UNAUTHORIZED", res.statusText);
      default:
        throw new ConnectionError("UNKNOWN", res.statusText);
    }
  }
}

export default HeimdallServerModule;
