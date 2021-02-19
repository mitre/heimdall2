import {ArgumentMetadata, Injectable, PipeTransform} from '@nestjs/common';

@Injectable()
export class PublicBooleanPipe implements PipeTransform {
  transform(
    value: {
      public: boolean | string;
    },
    _metadata: ArgumentMetadata
  ): any {
    value.public = [true, 'true'].includes(value.public);
    return value;
  }
}
