import { Module, VuexModule } from "vuex-module-decorators";
import Store from "@/store/store";

/** Configure this to match data set in vue.config.ts */
declare const process: {
  env: {
    PACKAGE_VERSION: string;
    DESCRIPTION: string;
    REPOSITORY: string;
    LICENSE: string;
    CHANGELOG: string;
    BRANCH: string;
    ISSUES: string;
  };
};

@Module({
  namespaced: true,
  dynamic: true,
  store: Store,
  name: "info"
})
class AppInfoModule extends VuexModule {
  /** The app version */
  get version(): string {
    return process.env.PACKAGE_VERSION;
  }

  /** The app description */
  get description(): string {
    return process.env.DESCRIPTION;
  }

  /** The full app repository url, e.g. "https://github.com/mitre/heimdall-vuetify" */
  get repository(): string {
    return process.env.REPOSITORY;
  }

  /** The username/org part of the repo url, e.g. mitre */
  get repo_org(): string {
    return this.repository.split("/")[3];
  }

  /** The project name of the repo url, e.g. heimdall-vuetify */
  get repo_name(): string {
    return this.repository.split("/")[4];
  }

  /** The app license */
  get license(): string {
    return process.env.LICENSE;
  }

  /** The app changelog */
  get changelog(): string {
    return process.env.CHANGELOG;
  }

  /** The app branch/build */
  get branch(): string {
    return process.env.BRANCH;
  }

  /** The app open new issues */
  get issues(): string {
    return process.env.ISSUES;
  }
}

export default AppInfoModule;
