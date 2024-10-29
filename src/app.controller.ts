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
