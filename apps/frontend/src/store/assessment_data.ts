import Store from '@/store/store';
import {IEvaluation} from '@heimdall/interfaces';
import {utcDay} from 'd3';
import _ from 'lodash';
import {
  Module,
  VuexModule,
  getModule
} from 'vuex-module-decorators';
import {AssessmentType} from '../enums/assessment_type';
import {BucketType} from '../enums/bucket_type';
import {SourcedContextualizedEvaluation} from './report_intake';


@Module({
  namespaced: true,
  dynamic: true,
  store: Store,
  name: 'assessmentData'
})
export class AssessmentData extends VuexModule {

}
export const AssessmentDataModule = getModule(AssessmentData);


export function assessment_eval(ev: SourcedContextualizedEvaluation): AssessmentType {
  if (ev?.data){
    if ( ev.data !== undefined && ev.data.profiles.length > 0 ){
      const profile = ev.data.profiles[0];
      const assessment_type = _.find(profile.supports, function (a) {
        return _.has(a,'assessment_type');
      });

    if (_.has(assessment_type,'assessment_type')){
       return assesment_string_type(_.get(assessment_type,'assessment_type') as unknown as string);
    }
    }
  }
  return AssessmentType.General;
}

export function get_assessment(ev: IEvaluation): AssessmentType {
  if (ev === undefined){
    return AssessmentType.General
  }
  if (ev?.data) {
    const profiles = _.get(ev?.data, 'profiles');
    if (profiles != undefined && profiles.length > 0) {
      const profile = profiles[0];
      const supports = _.get(profile, 'supports')
      if (supports !== undefined) {
        const assessment_type = _.find(supports, function (a) {
          return _.has(a, 'assessment_type');
        });

        let assessment_string = "";
        if (_.has(assessment_type, 'assessment_type')) {
          assessment_string = _.get(assessment_type, 'assessment_type');
        }

        switch (assessment_string) {
          case AssessmentType.STIG:
            return AssessmentType.STIG;
          case AssessmentType.Vulnerability:
            return AssessmentType.Vulnerability;
          case AssessmentType.General:
            return AssessmentType.General;
          default:
            return AssessmentType.General;
        }
      }
    }
  }
  return AssessmentType.General;
}

export function assesment_string_type(asessment_type_string: string): AssessmentType{
  switch (asessment_type_string) {
    case AssessmentType.STIG:
      return AssessmentType.STIG;
    case AssessmentType.Vulnerability:
      return AssessmentType.Vulnerability;
    case AssessmentType.General:
      return AssessmentType.General;
    default:
      console.log("assessment_type_string:"+assesment_string_type)
      return AssessmentType.General;
  }
}

export function assessment_string_bucket_type(assessment_bucket_string: string): BucketType{
  switch (assessment_bucket_string) {
    case "general":
      return BucketType.General;
    case "stigasd":
      return BucketType.STIGASD;
   case "stigcontainer":
      return BucketType.STIGContainer;
    case "vulnerability":
      return BucketType.Vulnerability;
    default:
      return BucketType.Unmapped;
  }
}

export function get_bucket_type_eval(ev: SourcedContextualizedEvaluation): BucketType {
  if (ev?.data){
    if ( ev.data !== undefined && ev.data.profiles.length > 0 ){
      const profile = ev.data.profiles[0];
      const assessment_bucket = _.find(profile.supports, function (a) {
        return _.has(a,'assessment_bucket');
      });

    if (_.has(assessment_bucket,'assessment_type')){
        return assessment_string_bucket_type(_.get(assessment_bucket,'assessment_bucket') as unknown as string);
    }
    }
  }
return BucketType.Unmapped;
}


export function get_bucket_type(ev: IEvaluation): BucketType {
    if (ev?.data) {
      const profiles = _.get(ev?.data, 'profiles');
      if (profiles != undefined && profiles.length > 0) {
        const profile = profiles[0];
        const supports = _.get(profile, 'supports')
        if (supports !== undefined) {
          const assessment_bucket = _.find(supports, function (a) {
            return _.has(a, 'assessment_bucket');
          });
  
          let assessment_bucket_string = "";
          if (_.has(assessment_bucket, 'assessment_bucket')) {
            assessment_bucket_string = _.get(assessment_bucket, 'assessment_bucket');
          }
  
          switch (assessment_bucket_string) {
            case "general":
              return BucketType.General;
            case "stigasd":
              return BucketType.STIGASD;
           case "stigcontainer":
              return BucketType.STIGContainer;
            case "vulnerability":
              return BucketType.Vulnerability;
            default:
              return BucketType.Unmapped;
          }
        }
      }
    }
  //Default Return if not found
  console.log("assessment_type not found");
  return BucketType.Unmapped;
}