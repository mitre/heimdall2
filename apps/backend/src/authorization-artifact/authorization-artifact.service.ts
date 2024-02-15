import {Injectable} from '@nestjs/common';
import S3 from 'aws-sdk/clients/s3';
import {ConfigService} from '../config/config.service';
import axios from 'axios';

@Injectable()
export class AuthorizationArtifactService {
    constructor(
        private readonly configService: ConfigService
    ) {}

    async listFiles(prefix: string): Promise<S3.ListObjectsV2Output | undefined> {
                const s3creds = this.configService.getAuthArtiS3AuthCreds();
        var params = {
            Bucket: this.configService.getAuthArtiS3BucketName(),
            Delimiter: "/",
            Prefix: prefix,
            MaxKeys: 32
        }
        if (params.Bucket === "") {
            return undefined
        }
        var bucketUrl = this.configService.getAuthArtiS3URL();  //NOTE: append getAuthArtiS3BucketName() if s3ForcePathStyle is removed
                return new S3({endpoint: bucketUrl, signatureVersion: 'v4', s3ForcePathStyle: true, ...s3creds})
            .listObjectsV2(params).promise().then((success) => {
                return success;
            }, (error) => {
                console.log(error);
                return undefined;
            })
    }

    async listBuckets(): Promise<S3.ListBucketsOutput | undefined> {
                const s3creds = this.configService.getAuthArtiS3AuthCreds();
        return new S3({endpoint: this.configService.getAuthArtiS3URL(), signatureVersion: 'v4', ...s3creds})
            .listBuckets().promise().then((success) => {
                return success;
            }, (error) => {
                console.log("bucket error", error);
                return undefined;
            })
    }

    async getSignedUrl(key: string): Promise<string> {
        const s3creds = this.configService.getAuthArtiS3AuthCreds();
        var params = {
            Bucket: this.configService.getAuthArtiS3BucketName(),
            Key: key,
            Expires: 3600
        }
        var bucketUrl = this.configService.getAuthArtiS3URL();  //NOTE: append getAuthArtiS3BucketName() if s3ForcePathStyle is removed
        var s3 = new S3({endpoint: bucketUrl, signatureVersion: 'v4', s3ForcePathStyle: true, ...s3creds});
        return s3.getSignedUrlPromise('getObject', params);
    }

    async downloadFile(key: string): Promise<string> {
        console.log("key", key);
        let url = await this.getSignedUrl(key);
        console.log("url", url);
        let response = await axios({url: url, method: 'GET', responseType: 'arraybuffer'});
        let data = Buffer.from(response.data).toString('hex');
        return data;
    }
}
