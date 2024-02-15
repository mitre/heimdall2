import {Module} from '@nestjs/common';
import {ConfigModule} from '../config/config.module';
import {AuthorizationArtifactController} from './authorization-artifact.controller';
import {AuthorizationArtifactService} from './authorization-artifact.service';

@Module({
    imports: [ConfigModule],
    providers: [AuthorizationArtifactService],
    controllers: [AuthorizationArtifactController],
    exports: [AuthorizationArtifactService]
})
export class AuthorizationArtifactModule {}