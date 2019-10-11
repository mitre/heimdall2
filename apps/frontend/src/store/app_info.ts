import { Module, VuexModule } from "vuex-module-decorators";
import Store from "@/store/store";

declare const process: {
  env: {
    PACKAGE_VERSION: string;
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
  version: string = `Ver.${process.env.PACKAGE_VERSION}`;
}

export default AppInfoModule;
