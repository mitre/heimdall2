/**
 * Tracks uploaded files, and their parsed contents
 */

import {
  Module,
  VuexModule,
  Mutation,
  Action,
  getModule
} from "vuex-module-decorators";
import Store from "./store";
import DataStore from "./data_store";
import router from "../../src/router.js";
import { InspecFile } from "./report_intake";

type SidebarItem = {
  /** Router path */
  url: string | null;

  /** Display name */
  name: string;

  /** Router path name */
  slug: string;

  /** The icon to show to the left of this item */
  icon: string;

  /** Internationalization string */
  i18n?: string;

  /** Any dropdown items to this item */
  submenu?: SidebarItem[];
};

/**
 * Creates a sidebar item directing to the target file
 * @param file Target file
 */
function makeFileItem(file: InspecFile): SidebarItem {
  return {
    url: "/results/" + file.unique_id,
    name: file.filename,
    slug: "result" + file.unique_id,
    icon: "FileIcon"
  };
}

@Module({
  namespaced: true,
  dynamic: true,
  store: Store,
  name: "sidebar"
})
class SidebarModule extends VuexModule {
  /** Current sidebar items to display */
  get allItems(): SidebarItem[] {
    return [this.home, this.results, this.tools, this.ssp, this.about];
  }

  /** Provides the sidebar entry for home */
  get home(): SidebarItem {
    return {
      url: "/",
      name: "Home",
      slug: "home",
      icon: "HomeIcon"
    };
  }

  /** Provides the sidebar entry for results */
  get results(): SidebarItem {
    let allResults: SidebarItem = {
      url: "/results", // example only
      name: "All Results",
      slug: "results",
      icon: "FileIcon"
    };

    // Convert all other open files to sidebar options
    let data = getModule(DataStore, Store);
    let reportOptions = data.executionFiles.map(makeFileItem);
    let profileOptions = data.profileFiles.map(makeFileItem);
    let submenu: SidebarItem[] = [
      allResults,
      ...reportOptions,
      ...profileOptions
    ];

    // And return
    return {
      url: "/results",
      name: "Results",
      slug: "results",
      icon: "FileIcon",
      i18n: "Results",
      submenu
    };
  }

  /** Provides the sidebar entry for the CATT tool */
  get catt(): SidebarItem {
    return {
      url: "/tools/catt",
      name: "CATT File",
      slug: "toolsCatt",
      icon: "ToolIcon",
      i18n: "CATT"
    };
  }

  /** Provides the sidebar entry for the print tool. */
  get print(): SidebarItem {
    return {
      url: "/tools/print",
      name: "print",
      slug: "print",
      icon: "PrinterIcon",
      i18n: "print"
    };
  }

  /** Provides the sidebar entry for the print tool. */
  get about(): SidebarItem {
    return {
      url: "/about",
      name: "About",
      slug: "about",
      icon: "FileIcon"
    };
  }

  /** Provides the sidebar entry for the ssp view. */
  get ssp(): SidebarItem {
    return {
      url: "/ssp",
      name: "SSP",
      slug: "ssp",
      icon: "FileIcon"
    };
  }

  /** Provides the sidebar entry for the tools category. */
  get tools(): SidebarItem {
    return {
      url: null,
      name: "Tools",
      slug: "tools",
      icon: "ToolIcon",
      i18n: "Tools",
      submenu: [this.catt, this.print]
    };
  }

  @Action
  addFileItemOrSomething(): null {
    /*
    let fileCount = 2;

    for (let results in Items[1].submenu) {
      if (Items[1].submenu[results].name == fileName) {
        if (fileCount < 3) {
          fileName = fileName + " " + fileCount;
          fileCount++;
        } else {
          fileName = fileName.substr(0, fileName.length - 2) + " " + fileCount;
          fileCount++;
        }
      }
    }
    */
    return null;
  }
}

export default SidebarModule;
