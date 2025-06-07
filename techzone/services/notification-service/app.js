import 'dotenv/config';
import amqp from 'amqplib';
import nodemailer from 'nodemailer';


const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function start() {
  const conn = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672');
  const channel = await conn.createChannel();

  // 1. Listen for order.created
  const orderCreatedQueue = 'order.created';
  await channel.assertQueue(orderCreatedQueue, { durable: true });
  console.log(`Notification service listening for messages on ${orderCreatedQueue}...`);

  channel.consume(orderCreatedQueue, async (msg) => {
    if (msg !== null) {
      try {
        const order = JSON.parse(msg.content.toString());
        console.log("Received order:", order);

        await transporter.sendMail({
          from: process.env.MAIL_FROM || '"TechZone" <no-reply@techzone.com>',
          to: order.email,
          subject: `Twoje zamówienie #${order.orderId} zostało złożone`,
          text: `Cześć${order.userName ? ' ' + order.userName : ''}!\n\nDziękujemy za zamówienie w TechZone.\n\nSzczegóły zamówienia:\n- Numer zamówienia: ${order.orderId}\n- Kwota: ${order.total} zł\n\nWkrótce otrzymasz powiadomienie o statusie realizacji.\n\nPozdrawiamy,\nZespół TechZone`,
        });

        console.log(`Mail sent to ${order.email}`);
        channel.ack(msg);
      } catch (e) {
        console.error("Error while processing order.created:", e);
        channel.ack(msg);
      }
    }
  }, { noAck: false });

  // 2. Listen for order.status.updated
  const statusUpdatedQueue = 'order.status.updated';
  await channel.assertQueue(statusUpdatedQueue, { durable: true });
  console.log(`Notification service listening for messages on ${statusUpdatedQueue}...`);

  channel.consume(statusUpdatedQueue, async (msg) => {
    if (msg !== null) {
      try {
        const data = JSON.parse(msg.content.toString());
        console.log("Received status update:", data);

        await transporter.sendMail({
          from: process.env.MAIL_FROM || '"TechZone" <no-reply@techzone.com>',
          to: data.email,
          subject: `Status Twojego zamówienia #${data.orderId} został zaktualizowany`,
          text: `Cześć${data.userName ? ' ' + data.userName : ''}!\n\nStatus Twojego zamówienia #${data.orderId} został zmieniony na: ${data.status}\n\nPozdrawiamy,\nZespół TechZone`,
        });

        console.log(`Status update mail sent to ${data.email}`);
        channel.ack(msg);
      } catch (e) {
        console.error("Error while processing order.status.updated:", e);
        channel.ack(msg);
      }
    }
  }, { noAck: false });
}

start().catch(e => {
  console.error("Notification service error:", e);
  process.exit(1);
});