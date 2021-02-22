import {ArgumentMetadata, Injectable, PipeTransform} from '@nestjs/common';

@Injectable()
export class PublicBooleanPipe implements PipeTransform {
  transform(
    value: {
      public: boolean | string;
      evaluationTags: string | string[];
    },
    _metadata: ArgumentMetadata
  ): any {
    value.public = [true, 'true'].includes(value.public);
    if (typeof value.evaluationTags === 'string') {
      value.evaluationTags = value.evaluationTags.split(',');
    }
    return value;
  }
}
