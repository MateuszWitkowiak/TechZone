import amqp from 'amqplib';

let connection = null;
let channel = null;

async function getRabbitChannel() {
  if (channel) return channel;
  connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672');
  channel = await connection.createChannel();
  return channel;
}

export async function sendOrderCreatedNotification(order) {
  const channel = await getRabbitChannel();
  await channel.assertQueue('order.created', { durable: true });
  channel.sendToQueue('order.created', Buffer.from(JSON.stringify(order)), { persistent: true });
}

export async function sendStatusUpdateNotification(order) {
  const channel = await getRabbitChannel();
  const queue = 'order.status.updated';
  await channel.assertQueue(queue, { durable: true });
  channel.sendToQueue(queue, Buffer.from(JSON.stringify({
    email: order.userEmail,
    userName: order.userName,
    orderId: order._id,
    status: order.status,
  })), { persistent: true });
}