import { Module } from '@nestjs/common';
import { TestService } from './test.service';
import { TestController } from './test.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Test } from './schemas/test.schema';
import { TestSchema } from './schemas/test.schema';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Test.name, schema: TestSchema }]),
    AuthModule,
    UserModule,
  ],
  controllers: [TestController],
  providers: [TestService],
})
export class TestModule {}
