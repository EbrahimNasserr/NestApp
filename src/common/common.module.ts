import { Global, Module } from '@nestjs/common';
import { PaymentService, S3Service } from './services';

@Global()
@Module({
  providers: [S3Service, PaymentService],
  exports: [S3Service, PaymentService],
})
export class CommonModule {}

