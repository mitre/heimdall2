<template>
    <div>
        <ControlTable 
        :key="resultTypeKey"
        :filter="filter"
        :show-impact="showImpact"
        :isGenResult="isGenResult"
        :isVulnResult="isVulnResult"
        :isStigResult="isStigResult"
        />
    </div>
</template>
<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import ControlTable from '@/components/cards/controltable/ControlTable.vue';

import _ from 'lodash';
import {
    Filter,
} from '@/store/data_filters';
import { ContextualizedProfile } from 'inspecjs';
import { Prop } from 'vue-property-decorator';
import {
    SourcedContextualizedEvaluation,
    SourcedContextualizedProfile
} from '@/store/report_intake';
@Component({
  components: {
    ControlTable
  }
})
export default class ControlTableSelector extends Vue {
    @Prop({ type: Object, required: false })
    readonly file!:
        | SourcedContextualizedEvaluation
        | SourcedContextualizedProfile;
    //Passthrough for Control Table
    @Prop({type: Object, required: true}) readonly filter!: Filter;
    @Prop({type: Boolean, required: true}) readonly showImpact!: boolean;

    get resultTypeKey(): string {
        return `${this.isGenResult}-${this.isVulnResult}-${this.isStigResult}`;
    }
    get isStigResult(): boolean {
        return this.get_result_type() === 'stig';
    }
    get isGenResult(): boolean {
        return this.get_result_type() === 'general';
    }
    get isVulnResult(): boolean {
        return this.get_result_type() === 'vulnerability';
    }

    private get_result_type(): string{
        const ev = this.file_root_profile;
        if (ev?.data){
            const assessment_type = _.find(ev.data.supports, function (a) {
                return _.has(a,'assessment_type');
            });
            if (_.has(assessment_type,'assessment_type')){
               return _.get(assessment_type,'assessment_type') as unknown as string;
            }
        }
        return "";
    }

    get file_root_profile(): SourcedContextualizedProfile | undefined {
        //checks the files selected and obatins the first result type categorization for display in the table
        if (this.file != undefined) {
            let result: ContextualizedProfile | undefined;
            if (this.file.from_file.hasOwnProperty('evaluation')) {
                result = (
                    this.file as SourcedContextualizedEvaluation
                ).from_file.evaluation.contains.find((p) => p.extendedBy.length === 0);
            }
            return (result || this.file) as SourcedContextualizedProfile;

        }
        return undefined;

    }
}

</script>