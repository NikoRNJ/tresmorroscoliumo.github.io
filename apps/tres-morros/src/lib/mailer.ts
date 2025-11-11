import sendgrid from "@sendgrid/mail";
import { env } from "./env";

sendgrid.setApiKey(env.SENDGRID_API_KEY);

export interface ContactPayload {
  name: string;
  email: string;
  phone?: string;
  message: string;
  subject?: string;
}

export const sendContactEmail = async (payload: ContactPayload) => {
  await sendgrid.send({
    to: env.CONTACT_TO_EMAIL,
    from: env.SENDGRID_FROM_EMAIL,
    replyTo: payload.email,
    subject: payload.subject ?? `Nuevo mensaje de ${payload.name}`,
    text: `${payload.message}\n\nContacto: ${payload.email}${
      payload.phone ? ` / ${payload.phone}` : ""
    }`,
    html: `
      <h2>Nuevo mensaje desde tresmorros.cl</h2>
      <p><strong>Nombre:</strong> ${payload.name}</p>
      <p><strong>Correo:</strong> ${payload.email}</p>
      ${
        payload.phone
          ? `<p><strong>Teléfono:</strong> ${payload.phone}</p>`
          : ""
      }
      <p><strong>Mensaje:</strong></p>
      <p>${payload.message}</p>
    `,
  });
};
