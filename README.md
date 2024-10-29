# RabbitMQ with NestJS and Docker

Here’s a README.md file to explain the entire setup:

NestJS RabbitMQ Microservices with Docker Compose

This project demonstrates how to set up a NestJS application using RabbitMQ as a message broker, all managed within Docker Compose.

# Table of Contents

	•	Introduction
	•	Requirements
	•	Setup Guide
	•	1. Create a New NestJS Application
	•	2. Install Dependencies
	•	3. Docker Compose Configuration
	•	4. Dockerfile for NestJS
	•	5. Configure NestJS for RabbitMQ
	•	6. Create Producer and Consumer Services
	•	Running the Application
	•	Testing the Setup

# Introduction

This setup uses Docker Compose to start a NestJS application alongside RabbitMQ. The NestJS app acts as both a producer and consumer of messages in a RabbitMQ queue.

# Requirements

•	Node.js and npm (for initial project setup)

•	Docker and Docker Compose

# Setup Guide

## 1. Create a New NestJS Application

### 1.1	Install the NestJS CLI if you haven’t done so already:

```bash
npm install -g @nestjs/cli
```

### 1.2	Create a new NestJS project:

```bash
nest new my-nest-rabbitmq-app
```


## 2. Install Dependencies

To use RabbitMQ with NestJS, install the microservices and amqplib packages:
```bash
npm install --save @nestjs/microservices amqplib
```
## 3. Docker Compose Configuration

Create a docker-compose.yml file in the root of the project to define services for both RabbitMQ and the NestJS application:
```yaml
version: '3.8'
services:
  rabbitmq:
    image: rabbitmq:3-management
    container_name: rabbitmq
    ports:
      - "5672:5672"      # RabbitMQ connection port
      - "15672:15672"    # RabbitMQ management UI
    environment:
      RABBITMQ_DEFAULT_USER: guest
      RABBITMQ_DEFAULT_PASS: guest
    healthcheck:
      test: ["CMD", "rabbitmqctl", "status"]
      interval: 10s
      timeout: 5s
      retries: 5

  nestjs-app:
    build:
      context: .                # Refers to Dockerfile location
      dockerfile: Dockerfile    # Dockerfile name
    container_name: nestjs-app
    depends_on:
      rabbitmq:
        condition: service_healthy
    environment:
      RABBITMQ_URL: amqp://guest:guest@rabbitmq:5672  # RabbitMQ connection URL
    ports:
      - "3000:3000"  # Expose NestJS app on port 3000
```

## 4. Dockerfile for NestJS

In the project root, create a Dockerfile to define the Docker image for the NestJS application:
```bash
# Dockerfile

FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
```

## 5. Configure NestJS for RabbitMQ

Edit src/main.ts to set up a RabbitMQ microservice:
```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // RabbitMQ connection configuration
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

  // Connect the microservice to RabbitMQ
  app.connectMicroservice(rabbitMQOptions);

  await app.startAllMicroservices();
  await app.listen(3000);
}

bootstrap();
```

## 6. Create Producer and Consumer Services

### 6.1 Producer Service

Create a ProducerService to send messages to RabbitMQ. In src/producer.service.ts:
```typescript
// src/producer.service.ts
import { Injectable } from '@nestjs/common';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';

@Injectable()
export class ProducerService {
  private client: ClientProxy;

  constructor() {
    this.client = ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
        queue: 'main_queue',
        queueOptions: {
          durable: false,
        },
      },
    });
  }

  // Method to send a message to RabbitMQ
  async sendMessage(pattern: string, data: any) {
    return this.client.send(pattern, data).toPromise();
  }
}
```

Register ProducerService in src/app.module.ts:
```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ProducerService } from './producer.service';

@Module({
  controllers: [AppController],
  providers: [ProducerService],
})
export class AppModule {}
```

### 6.2 Consumer Setup in Controller

Define the HTTP endpoint and RabbitMQ message listener in src/app.controller.ts:
```typescript
// src/app.controller.ts
import { Controller, Get } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ProducerService } from './producer.service';

@Controller()
export class AppController {
  constructor(private readonly producerService: ProducerService) {}

  // HTTP endpoint to send a message to RabbitMQ
  @Get('send')
  async sendMessage() {
    const message = { text: 'Hello from RabbitMQ!' };
    const response = await this.producerService.sendMessage('message_print', message);
    return response;
  }

  // Consumer for RabbitMQ messages with the pattern 'message_print'
  @MessagePattern('message_print')
  handleMessage(@Payload() data: any) {
    console.log('Received message:', data);
    return 'Message processed successfully';
  }
}
```

# Running the Application

To start the NestJS and RabbitMQ services, run:
```bash
docker-compose up --build
```

This will:

•	Build the Docker image for the NestJS app.
•	Start RabbitMQ and NestJS, connecting them via Docker Compose.

Testing the Setup

1.	Send a Message: Open http://localhost:3000/send to trigger a message sent to RabbitMQ.
2.	Receive the Message: The handleMessage method in AppController will receive and log the message.
3.	RabbitMQ Management UI: Access RabbitMQ at http://localhost:15672 (username: guest, password: guest) to view the queue.
