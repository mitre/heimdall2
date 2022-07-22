import { Trinary } from '@/enums/Trinary';
import Store from '@/store/store';
import {
  Action,
  getModule,
  Module,
  Mutation,
  VuexModule
} from 'vuex-module-decorators';
import { ChecklistFile, ChecklistVuln } from '../types/checklist/control';
import { InspecDataModule } from './data_store';
import { FileID } from './report_intake';

@Module({
  namespaced: true,
  dynamic: true,
  store: Store,
  name: 'checklistFilteredData'
})
export class ChecklistFilteredData extends VuexModule {
  selectedChecklistIds: FileID[] = [];
  selectedRule?: ChecklistVuln;

  @Action
  public selectRule(ruleId: string): void {
    this.context.commit('SELECT_RULE', { ruleId });
  }

  @Action
  public getSelectedRule(): ChecklistVuln | undefined {
    return this.selectedRule
  }

  get allFiles() {
    return InspecDataModule.allChecklistFiles
  }

  @Mutation
  SELECT_CHECKLISTS(files: FileID[]): void {
    this.selectedChecklistIds = [
      ...new Set([...files, ...this.selectedChecklistIds])
    ];
  }

  @Mutation
  CLEAR_CHECKLIST(removeId: FileID): void {
    this.selectedChecklistIds = this.selectedChecklistIds.filter(
      (ids) => ids !== removeId
    )
  }

  @Mutation
  CLEAR_ALL_CHECKLISTS(): void {
    this.selectedChecklistIds = [];
  }

  @Action
  public toggle_all_checklists(): void {
    if (this.all_checklists_selected === Trinary.On) {
      this.CLEAR_ALL_CHECKLISTS();
    } else {
      this.SELECT_CHECKLISTS(
        InspecDataModule.allChecklistFiles.map((v) => v.uniqueId)
      );
    }
  }

  @Action select_exclusive_checklist(fileID: FileID): void {
    this.CLEAR_ALL_CHECKLISTS();
    this.SELECT_CHECKLISTS([fileID]);
  }

  @Action
  public toggle_checklist(fileID: FileID): void {
    if (this.selectedChecklistIds.includes(fileID)) {
      this.CLEAR_CHECKLIST(fileID);
    } else {
      this.SELECT_CHECKLISTS([fileID]);
    }
  }

  public clear_file(fileID: FileID): void {
    this.CLEAR_CHECKLIST(fileID)
  }

  /**
   * Parameterized getter.
   * Gets all checklists from the specified file ids.
   */
  get checklists(): (files: FileID[]) => readonly ChecklistFile[] {
    return (files: FileID[]) => {
      return InspecDataModule.allChecklistFiles.filter((e) => {
        return files.includes(e.uniqueId);
      });
    };
  }

  // check to see if all evaluations are selected
  get all_checklists_selected(): Trinary {
    switch (this.selectedChecklistIds.length) {
      case 0:
        return Trinary.Off;
      case InspecDataModule.allChecklistFiles.length:
        return Trinary.On;
      default:
        return Trinary.Mixed;
    }
  }

  @Mutation
  SELECT_RULE(options: { ruleId: string }) {
    const rulesList: ChecklistVuln[] = [];
    Object.entries(InspecDataModule.allChecklistFiles)
      .map(([_fileId, checklist]) => checklist.stigs)
      .forEach((stigs) => {
        stigs.forEach((stig) => {
          stig.vulns.forEach(vuln => {
            rulesList.push(vuln);
          })
        })
      });
    const foundControl = rulesList?.find(
      (vuln) => vuln.ruleId === options.ruleId
    );
    if (foundControl) {
      this.selectedRule = foundControl;
    } else {
      throw new Error(`Invalid Vulnerability - Rule ID: ${options.ruleId}`);
    }
  }

}

export const FilteredChecklistDataModule = getModule(ChecklistFilteredData);
