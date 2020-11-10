import {Injectable, HttpService} from '@nestjs/common';

@Injectable()
export class UpdatesService {
  constructor(private readonly httpService: HttpService) {}
  async checkForUpdate(): Promise<Record<string, any>> {
    const response = await this.httpService
      .get('https://api.github.com/repos/mitre/heimdall2/releases/latest')
      .toPromise();
    return {
      newest: response.data.tag_name.replace('v', '')
    };
  }
}
