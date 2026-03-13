import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

export const EMAIL_FROM = "Teach Me Like I'm 10 <hello@teachmelikeim10.xyz>";
