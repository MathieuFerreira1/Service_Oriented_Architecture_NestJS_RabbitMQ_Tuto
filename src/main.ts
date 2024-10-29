// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configure RabbitMQ en utilisant les variables d'environnement
  const rabbitMQUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
  const rabbitMQOptions: MicroserviceOptions = {
    transport: Transport.RMQ,
    options: {
      urls: [rabbitMQUrl],
      queue: 'main_queue',
      queueOptions: {
        durable: false,
      },
    },
  };

  // Connecte le microservice RabbitMQ
  app.connectMicroservice(rabbitMQOptions);

  await app.startAllMicroservices();
  await app.listen(3000);
}

bootstrap();