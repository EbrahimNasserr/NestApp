export enum OrderStatusPriorityEnum {
  PENDING = 0,
  PROCESSING = 1,
  SHIPPED = 2,
  DELIVERED = 3,
  CANCELLED = 4,
}

export enum OrderStatusEnum {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum PaymentTypeEnum {
  CASH = 'cash',
  CARD = 'card',
  PAYPAL = 'paypal',
  STRIPE = 'stripe',
  OTHER = 'other',
}
