import twilio from "twilio";

interface TwilioCredentials {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
}

let cachedCredentials: TwilioCredentials | null = null;

function getCredentials(): TwilioCredentials {
  if (cachedCredentials) return cachedCredentials;

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const phoneNumber = process.env.TWILIO_PHONE_NUMBER || "";

  if (!accountSid || !authToken) {
    throw new Error("Twilio not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN env vars.");
  }

  cachedCredentials = { accountSid, authToken, phoneNumber };
  return cachedCredentials;
}

export function getTwilioClient() {
  const { accountSid, authToken } = getCredentials();
  return twilio(accountSid, authToken);
}

export function getTwilioFromPhoneNumber() {
  const { phoneNumber } = getCredentials();
  return phoneNumber;
}

export async function sendWhatsApp(to: string, body: string) {
  const client = getTwilioClient();
  const from = getTwilioFromPhoneNumber();
  return client.messages.create({
    to: `whatsapp:${to}`,
    from: `whatsapp:${from}`,
    body,
  });
}

export async function sendSMS(to: string, body: string) {
  const client = getTwilioClient();
  const from = getTwilioFromPhoneNumber();
  return client.messages.create({ to, from, body });
}
