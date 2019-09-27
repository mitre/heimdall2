/**
 * Tracks uploaded files, and their parsed contents
 */

import { Module, VuexModule, Action, getModule } from "vuex-module-decorators";
import Store from "@/store/store";

@Module({
  namespaced: true,
  dynamic: true,
  store: Store,
  name: "appbar_controls"
})
class AppbarControlsModule extends VuexModule {
  /** Configurables */
  mode: "results" | "compare" = "results";

  /** Watchable values */
  pressed_button: string | undefined;
  search_text: string | undefined;
}

export default AppbarControlsModule;
