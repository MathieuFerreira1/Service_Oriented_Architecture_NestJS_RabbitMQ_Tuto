// src/app.controller.ts
import { Controller, Get } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ProducerService } from './producer.service';

@Controller()
export class AppController {
  constructor(private readonly producerService: ProducerService) {}

  // Endpoint pour envoyer un message via RabbitMQ
  @Get('send')
  async sendMessage() {
    const message = { text: 'Bonjour de RabbitMQ!' };
    const response = await this.producerService.sendMessage('message_print', message);
    return response;
  }

  // Consommateur pour traiter les messages de RabbitMQ avec le pattern 'message_print'
  @MessagePattern('message_print')
  handleMessage(@Payload() data: any) {
    console.log('Message reçu:', data);
    return 'Message traité avec succès';
  }
}