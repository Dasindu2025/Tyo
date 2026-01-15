import { Global, Module } from '@nestjs/common';
import { TimeEngineService } from './time-engine.service';

@Global()
@Module({
  providers: [TimeEngineService],
  exports: [TimeEngineService],
})
export class CommonModule {}
