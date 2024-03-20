<template>
  <v-dialog v-model="showingModal">
    <template #activator="{on}">
      <LinkItem
        key="export_ckl"
        text="Export as Checklist"
        icon="mdi-check-all"
        @click="showModal"
        v-on="on"
      />
    </template>
    <v-card>
      <v-card-title class="headline"> Export as Checklist </v-card-title>
      <v-card-text>
        <v-row>
          <v-col v-for="(file, index) in files" :key="index" cols="12">
            <v-card>
              <v-hover v-slot="{hover}">
                <v-card-title
                  :style="{
                    cursor: 'pointer',
                    backgroundColor: hover
                      ? 'rgb(80, 80, 80)'
                      : 'rgb(62, 62, 62)'
                  }"
                  @click.stop="toggleSelectFile(file)"
                >
                  <v-checkbox v-model="file.selected" read-only disabled />
                  {{ file.filename }}
                </v-card-title>
              </v-hover>
              <v-expand-transition>
                <v-card-text v-if="file.selected">
                  <v-row>
                    <v-text-field
                      v-model="file.marking"
                      label="Marking"
                      class="pr-2"
                    />
                    <v-text-field
                      v-model="file.hostname"
                      label="Host Name"
                      class="pr-2"
                    />
                    <v-text-field
                      v-model="file.hostip"
                      label="Host IP"
                      :rules="[validateIpAddress]"
                      hint="###.###.###.###"
                      class="pr-2"
                    />
                    <v-text-field
                      v-model="file.hostmac"
                      label="Host MAC"
                      :rules="[validateMacAddress]"
                      hint="XX:XX:XX:XX:XX:XX"
                      class="pr-2"
                    />
                    <v-text-field
                      v-model="file.hostfqdn"
                      label="Host FQDN"
                      class="pr-2"
                    />
                    <v-text-field
                      v-model="file.targetcomment"
                      label="Target Comments"
                    />
                  </v-row>
                  <v-row>
                    <v-select
                      v-model="file.role"
                      :items="roles"
                      label="Role"
                      class="pr-2"
                    />
                    <v-select
                      v-model="file.assettype"
                      :items="types"
                      label="Asset Type"
                      class="pr-2"
                    />
                    <v-select
                      v-model="file.techarea"
                      :items="techareas"
                      label="Tech Area"
                      class="pr-2"
                    />
                    <v-select
                      v-model="file.webordatabase"
                      :items="['true', 'false']"
                      label="Web or Database"
                    />
                  </v-row>
                  <v-row>
                    <v-text-field
                      v-if="file.webordatabase === 'true'"
                      v-model="file.webdbsite"
                      label="Web DB Site"
                      class="pr-2"
                    />
                    <v-text-field
                      v-if="file.webordatabase === 'true'"
                      v-model="file.webdbinstance"
                      label="Web DB Instance"
                      class="pr-2"
                    />
                  </v-row>
                  <div
                    v-for="(profile, profileIndex) in file.profiles"
                    :key="profileIndex"
                  >
                    <v-card>
                      <v-card-title>{{ profile.extractedname }}</v-card-title>
                      <v-card-text>
                        <v-text-field
                          v-model="profile.title"
                          label="Name"
                          :placeholder="profile.titleplaceholder"
                        />
                        <v-text-field
                          v-model="profile.version"
                          label="Version"
                          type="number"
                          :placeholder="profile.versionplaceholder"
                        />
                        <v-text-field
                          v-model="profile.releasenumber"
                          label="Release Number"
                          type="number"
                          :placeholder="profile.releasenumberplaceholder"
                        />
                        <label for="release-date-datepicker">
                          Release Date
                        </label>
                        <v-date-picker
                          id="release-date-datepicker"
                          v-model="profile.releasedate"
                          full-width
                          landscape
                        />
                        <v-btn
                          block
                          text
                          @click="clearDateSelection(index, profileIndex)"
                        >
                          Clear Date Selection
                        </v-btn>
                      </v-card-text>
                    </v-card>
                  </div>
                </v-card-text>
              </v-expand-transition>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
      <v-divider />
      <v-card-actions>
        <v-spacer />
        <v-btn text @click="closeModal"> Cancel </v-btn>
        <v-btn
          color="primary"
          text
          :disabled="!selected.length"
          @click="exportCKL"
        >
          Export
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import LinkItem from '@/components/global/sidebaritems/IconLinkItem.vue';
import {Filter} from '@/store/data_filters';
import {InspecDataModule} from '@/store/data_store';
import {EvaluationFile, ProfileFile} from '@/store/report_intake';
import {SnackbarModule} from '@/store/snackbar';
import {
  cleanUpFilename,
  saveSingleOrMultipleFiles
} from '@/utilities/export_util';
import {
  ChecklistResults,
  ChecklistVuln,
  ChecklistMetadata,
  StigMetadata,
  Assettype,
  Role,
  Techarea
} from '@mitre/hdf-converters';
import {ExecJSON} from 'inspecjs';
import {Dependency} from 'inspecjs/src/generated_parsers/v_1_0/exec-json';
import _ from 'lodash';
import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop, Watch} from 'vue-property-decorator';
import {DateTime} from 'luxon';
import {coerce} from 'semver';

type ExtendedEvaluationFile = (EvaluationFile | ProfileFile) &
  ChecklistMetadata & {
    selected: boolean;
  };

type FileData = {
  filename: string;
  data: string;
};

@Component({
  components: {
    LinkItem
  }
})
export default class ExportCKLModal extends Vue {
  @Prop({type: Object, required: true}) readonly filter!: Filter;

  showingModal = false;
  roles = Object.values(Role);
  types = Object.values(Assettype);
  techareas = Object.values(Techarea);
  files: ExtendedEvaluationFile[] = this.evaluations(this.filter.fromFile);

  @Watch('showingModal')
  onModalChange(newState: boolean) {
    if (newState === false) {
      this.closeModal();
    }
  }

  @Watch('filter')
  onFilterChange(newFilter: Filter) {
    this.files = this.evaluations(newFilter.fromFile);
  }

  selected: ExtendedEvaluationFile[] = [];

  /**
   * Invoked when file(s) are loaded.
   */
  closeModal() {
    this.clearSelection();
    this.showingModal = false;
  }

  showModal() {
    this.showingModal = true;
  }

  clearSelection() {
    for (const file of this.files) {
      file.selected = false;
    }
    this.selected = [];
  }

  clearDateSelection(fileIndex: number, profileIndex: number) {
    console.log(
      JSON.stringify(
        Object.keys(this.files[fileIndex].profiles[profileIndex]),
        null,
        2
      )
    );
    this.files[fileIndex].profiles[profileIndex].releasedate = '';
  }

  // Get our evaluation info for our export table
  evaluations(fileIds: string[]): ExtendedEvaluationFile[] {
    const files: ExtendedEvaluationFile[] = [];
    for (const fileId of fileIds) {
      const file = InspecDataModule.allFiles.find(
        (f) => f.uniqueId === fileId
      ) as EvaluationFile;
      if (file) {
        files.push({
          ...file,
          marking:
            _.get(
              file,
              'evaluation.data.passthrough.checklist.asset.marking'
            ) ??
            _.get(file, 'evaluation.data.passthrough.metadata.marking', 'CUI'),
          hostname: _.get(
            file,
            'evaluation.data.passthrough.checklist.asset.hostname',
            _.get(file, 'evaluation.data.passthrough.metadata.hostname', '')
          ),
          hostfqdn: _.get(
            file,
            'evaluation.data.passthrough.checklist.asset.hostfqdn',
            _.get(file, 'evaluation.data.passthrough.metadata.hostfqdn', '')
          ),
          hostmac: _.get(
            file,
            'evaluation.data.passthrough.checklist.asset.hostmac',
            _.get(file, 'evaluation.data.passthrough.metadata.hostmac', '')
          ),
          hostip: _.get(
            file,
            'evaluation.data.passthrough.checklist.asset.hostip',
            _.get(file, 'evaluation.data.passthrough.metadata.hostip', '')
          ),
          targetcomment: _.get(
            file,
            'evaluation.data.passthrough.checklist.asset.targetcomment',
            _.get(
              file,
              'evaluation.data.passthrough.metadata.targetcomment',
              ''
            )
          ),
          role: _.get(
            file,
            'evaluation.data.passthrough.checklist.asset.role',
            _.get(file, 'evaluation.data.passthrough.metadata.role', Role.None)
          ),
          assettype: _.get(
            file,
            'evaluation.data.passthrough.checklist.asset.assettype',
            _.get(
              file,
              'evaluation.data.passthrough.metadata.assettype',
              Assettype.Computing
            )
          ),
          techarea: _.get(
            file,
            'evaluation.data.passthrough.checklist.asset.techarea',
            _.get(
              file,
              'evaluation.data.passthrough.metadata.techarea',
              Techarea.Empty
            )
          ),
          webordatabase: _.get(
            file,
            'evaluation.data.passthrough.checklist.asset.webordatabase',
            _.get(
              file,
              'evaluation.data.passthrough.metadata.webordatabase',
              'false'
            )
          ).toString(),
          webdbsite: _.get(
            file,
            'evaluation.data.passthrough.checklist.asset.webdbsite',
            _.get(file, 'evaluation.data.passthrough.metadata.webdbsite', '')
          ),
          webdbinstance: _.get(
            file,
            'evaluation.data.passthrough.checklist.asset.webdbinstance',
            _.get(
              file,
              'evaluation.data.passthrough.metadata.webdbinstance',
              ''
            )
          ),
          selected: _.get(
            file,
            'evaluation.data.passthrough.metadata.selected',
            false
          ),
          profiles: this.profileStigs(file)
        });
      }
    }
    return files;
  }

  splitReleaseInfo(info: string): string[] {
    const defaultReturn = ['', ''];
    const pattern = /Release: (\d+)[^\r\n]*Date: (\d{1,2} \w{3} \d{4})/;
    const matches = RegExp(pattern).exec(info);
    if (matches) {
      return [matches[1], matches[2]];
    }
    return defaultReturn;
  }

  profileStigs(file: EvaluationFile): StigMetadata[] {
    const results: (StigMetadata & {
      titleplaceholder: string;
      versionplaceholder: string;
      releasenumberplaceholder: string;
    })[] = [];
    const profileOrStigs: ExecJSON.Profile[] | ChecklistVuln[] = _.get(
      file,
      'evaluation.data.passthrough.checklist.stigs',
      _.get(file, 'evaluation.data.profiles', [])
    );
    for (const profileStig of profileOrStigs) {
      const depends = _.get(profileStig, 'depends') as unknown as Dependency[];
      if (Array.isArray(depends) && depends.length !== 0) {
        continue;
      }
      const [releasenumber, releasedate] = this.splitReleaseInfo(
        _.get(profileStig, 'header.releaseinfo', '')
      );
      console.log(
        `profilestigsections:\n${JSON.stringify(_.get(profileStig, 'version'), null, 2)}\n${JSON.stringify(_.get(profileStig, 'header.version'), null, 2)}`
      );
      const version = coerce(
        _.get(profileStig, 'header.version', _.get(profileStig, 'version', ''))
      );
      console.log(`version:\n${JSON.stringify(version, null, 2)}`);
      console.log(`releasenumber\n${JSON.stringify(releasenumber, null, 2)}`);
      results.push({
        name: _.get(
          profileStig,
          'header.title',
          _.get(profileStig, 'name', '')
        ),
        title: _.get(
          profileStig,
          'header.title',
          _.get(profileStig, 'title', _.get(profileStig, 'name', ''))
        ),
        titleplaceholder: _.get(
          profileStig,
          'header.title',
          _.get(profileStig, 'title', _.get(profileStig, 'name', ''))
        ),
        version: version?.major ?? 0,
        versionplaceholder: (version?.major ?? 0).toString(),
        releasenumber: parseInt(releasenumber, 10) || version?.minor || 0,
        releasenumberplaceholder: (
          parseInt(releasenumber, 10) ||
          version?.minor ||
          0
        ).toString(),
        releasedate:
          DateTime.fromFormat(releasedate, 'dd LLL yyyy').toISODate() || ''
      });
    }
    return results;
  }

  validateIpAddress(value: string): boolean | string {
    if (!value) {
      return true;
    }
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    return ipPattern.test(value) || 'Invalid IP Address Format';
  }

  validateMacAddress(value: string): boolean | string {
    if (!value) {
      return true;
    }
    const macPattern = /^([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}$/;
    return macPattern.test(value) || 'Invalid MAC Address Format';
  }

  toggleSelectFile(file: ExtendedEvaluationFile) {
    if (this.selected.includes(file)) {
      const selectedIndex = this.selected.indexOf(file);
      this.selected.splice(selectedIndex, 1);
    } else {
      this.selected.push(file);
    }
    file.selected = !file.selected;
  }

  addMetadataToPassthrough(file: ExtendedEvaluationFile) {
    _.set(file, 'evaluation.data.passthrough.metadata.marking', file.marking);
    _.set(file, 'evaluation.data.passthrough.metadata.hostname', file.hostname);
    _.set(file, 'evaluation.data.passthrough.metadata.hostfqdn', file.hostfqdn);
    _.set(file, 'evaluation.data.passthrough.metadata.hostmac', file.hostmac);
    _.set(file, 'evaluation.data.passthrough.metadata.hostip', file.hostip);
    _.set(
      file,
      'evaluation.data.passthrough.metadata.targetcomment',
      file.targetcomment
    );
    _.set(file, 'evaluation.data.passthrough.metadata.role', file.role);
    _.set(file, 'evaluation.data.passthrough.metadata.techarea', file.techarea);
    _.set(
      file,
      'evaluation.data.passthrough.metadata.assettype',
      file.assettype
    );
    _.set(
      file,
      'evaluation.data.passthrough.metadata.webordatabase',
      file.webordatabase
    );
    _.set(
      file,
      'evaluation.data.passthrough.metadata.webdbsite',
      file.webdbsite
    );
    _.set(
      file,
      'evaluation.data.passthrough.metadata.webdbinstance',
      file.webdbinstance
    );
    const profileMetadata: StigMetadata[] = [];
    for (const profile of file.profiles) {
      console.log(
        `addingmetadata to passthrough - per profile additions\n${JSON.stringify(profile, null, 2)}`
      );
      const releasedate = DateTime.fromISO(profile.releasedate);
      profileMetadata.push({
        name: profile.name,
        title: profile.title,
        version: profile.version,
        releasenumber: profile.releasenumber,
        releasedate: releasedate.isValid
          ? releasedate.toFormat('dd LLL yyyy')
          : ''
      });
    }
    _.set(
      file,
      'evaluation.data.passthrough.metadata.profiles',
      profileMetadata
    );
  }

  exportCKL(): void {
    if (this.selected.length === 0) {
      return SnackbarModule.failure('No files have been loaded.');
    }
    const fileData: FileData[] = [];
    for (const selected of this.selected) {
      this.addMetadataToPassthrough(selected);
      if ('evaluation' in selected) {
        const data = new ChecklistResults(selected.evaluation.data).toCkl();
        const filename = `${cleanUpFilename(selected.filename)}.ckl`;
        fileData.push({
          data,
          filename
        });
      }
    }
    saveSingleOrMultipleFiles(fileData, 'ckl');
    this.closeModal();
  }
}
</script>
