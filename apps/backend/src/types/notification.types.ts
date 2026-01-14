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
  variables: Record<string, any>;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  scheduleAt?: Date;
}
