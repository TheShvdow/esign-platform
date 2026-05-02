// src/types/notification.types.ts

export interface NotificationTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: 'email' | 'sms' | 'push';
  variables: string[];
}

export interface NotificationRequest {
  to: string[];
  template: string;
  variables: NotificationTemplateVariables;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  scheduleAt?: Date;
}

export interface NotificationTemplateVariables {
  documentTitle?: string;
  signerName?: string;
  ownerName?: string;
  actionUrl?: string;
}
