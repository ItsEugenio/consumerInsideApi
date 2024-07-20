import amqp from 'amqplib'
import dotenv from 'dotenv'

dotenv.config()

async function consumeMessages() {

const options = {
    vhost: process.env.AMQP_VHOST,
    username: process.env.AMQP_USERNAME,
    password: process.env.AMQP_PASSWORD,
    port: process.env.AMQP_PORT,
}

const  url = process.env.AMQP_URL || "";
 const queue = process.env.AMQP_QUEUE || ""

  const connection = await amqp.connect(url, options);
  const channel = await connection.createChannel();

  await channel.assertQueue(queue, { durable: true });

  console.log(`Escuchando mensajes en la cola ${queue}`);

  channel.consume(queue, async (msg) => {
    if (msg !== null) {
      try {
        await enviarMensajeALaAPI(msg.content.toString());

        channel.ack(msg);
      } catch (error) {
        console.error('Error al procesar el mensaje:', error);
        channel.reject(msg, false);
      }
    }
  });
}

async function enviarMensajeALaAPI(message: any) {
  const apiUrl = 'http://localhost:4000/registro';
  const messageJSON = JSON.parse(message);
  

  const registroPersonasAdentro = {
    fecha: messageJSON.fecha,
    hora: messageJSON.hora,
    numero_personas: messageJSON.numero_personas,
    lugar: messageJSON.lugar,
    idKit: messageJSON.idKit
  }

  console.log('Lo que envia al endpoint : ',registroPersonasAdentro)


  const requestOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify( registroPersonasAdentro ),
  };

  console.log('Cuerpo de la solicitud:', requestOptions.body);

  const response = await fetch(apiUrl, requestOptions);
  if (!response.ok) {
    throw new Error(`Error al enviar mensaje a la API: ${response.status} - ${response.statusText}`);
  }
}


consumeMessages().catch(console.error);
