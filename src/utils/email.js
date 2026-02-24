import { transporter } from "../lib/transporter.js";

export const sendEmail = async (data) => {
  await transporter.sendMail({
    to: data.email,
    from: process.env.GMAIL_USER,
    subject: data.subject,
    html: data.template,
  });
};
