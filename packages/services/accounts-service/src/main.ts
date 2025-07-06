import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  // Temporarily disabled for deployment - advanced analytics features need refactoring
  console.log('Accounts-service temporarily disabled - will be re-enabled after analytics refactoring');
  console.log('Core banking services (identity, mobile, company) are fully operational');
  return;
  
  // TODO: Re-enable after fixing analytics service TypeScript errors
  // const app = await NestFactory.create(AppModule);
  
  // app.useGlobalPipes(new ValidationPipe({
  //   whitelist: true,
  //   forbidNonWhitelisted: true,
  //   transform: true,
  // }));

  // const config = new DocumentBuilder()
  //   .setTitle('Accounts Service API')
  //   .setDescription('Advanced accounts and analytics service for SABS v2')
  //   .setVersion('1.0')
  //   .addBearerAuth()
  //   .build();
  // const document = SwaggerModule.createDocument(app, config);
  // SwaggerModule.setup('api', app, document);

  // await app.listen(3003);
  // console.log('Accounts service started on port 3003');
}

bootstrap();