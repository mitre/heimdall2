import { Module, VuexModule, getModule } from "vuex-module-decorators";
import DataModule, { ContextualizedControl } from "./data_store";
import Store from "./store";

@Module({
  namespaced: true,
  name: "lookup"
})
class HashLookupModule extends VuexModule {
  private get dataStore(): DataModule {
    return getModule(DataModule, Store);
  }

  /**
   * Returns a hash of all controls keyed by their ids
   */
  get controls(): { [key: string]: ContextualizedControl[] } {
    // Make the hash
    const final: { [key: string]: ContextualizedControl[] } = {};

    // Add every control to it.
    this.dataStore.contextualControls.forEach(c => {
      if (c.data.id in final) {
        final[c.data.id].push(c);
      } else {
        final[c.data.id] = [c];
      }
    });

    // Return
    return final;
  }
}

export default HashLookupModule;
