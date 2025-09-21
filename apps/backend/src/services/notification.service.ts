import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

interface DocumentEvent {
  document: any;
  user: any;
  signature?: any;
}

@Injectable()
export class NotificationService {
  @OnEvent('document.created')
  async handleDocumentCreated(payload: DocumentEvent): Promise<void> {
    console.log('Document created:', payload);
  }

  @OnEvent('document.signed')
  async handleDocumentSigned(payload: DocumentEvent): Promise<void> {
    console.log('Document signed:', payload);
  }

  async sendEmail(to: string, subject: string, content: string): Promise<void> {
    console.log(`Email sent to ${to}: ${subject}`);
  }

  async sendSMS(to: string, message: string): Promise<void> {
    console.log(`SMS sent to ${to}: ${message}`);
  }
}