// src/app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ProducerService } from './producer.service';

@Module({
  controllers: [AppController],    // <-- Assure-toi que AppController est là
  providers: [ProducerService],    // <-- Assure-toi que ProducerService est là
})
export class AppModule {}