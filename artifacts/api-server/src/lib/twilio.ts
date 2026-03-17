import twilio from "twilio";

interface TwilioCredentials {
  accountSid: string;
  apiKey: string;
  apiKeySecret: string;
  phoneNumber: string;
}

let cachedCredentials: TwilioCredentials | null = null;

async function getCredentialsFromConnector(): Promise<TwilioCredentials | null> {
  try {
    const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
    if (!hostname) return null;

    const xReplitToken = process.env.REPL_IDENTITY
      ? "repl " + process.env.REPL_IDENTITY
      : process.env.WEB_REPL_RENEWAL
        ? "depl " + process.env.WEB_REPL_RENEWAL
        : null;

    if (!xReplitToken) return null;

    const connectionSettings = await fetch(
      "https://" + hostname + "/api/v2/connection?include_secrets=true&connector_names=twilio",
      {
        headers: {
          Accept: "application/json",
          "X-Replit-Token": xReplitToken,
        },
      },
    )
      .then((res) => res.json())
      .then((data: any) => data.items?.[0]);

    if (
      !connectionSettings?.settings?.account_sid ||
      !connectionSettings?.settings?.api_key ||
      !connectionSettings?.settings?.api_key_secret
    ) {
      return null;
    }

    return {
      accountSid: connectionSettings.settings.account_sid,
      apiKey: connectionSettings.settings.api_key,
      apiKeySecret: connectionSettings.settings.api_key_secret,
      phoneNumber: connectionSettings.settings.phone_number || "",
    };
  } catch {
    return null;
  }
}

function getCredentialsFromEnv(): TwilioCredentials | null {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const apiKey = process.env.TWILIO_API_KEY;
  const apiKeySecret = process.env.TWILIO_API_KEY_SECRET;
  const phoneNumber = process.env.TWILIO_PHONE_NUMBER || "";

  if (!accountSid || !apiKey || !apiKeySecret) return null;

  return { accountSid, apiKey, apiKeySecret, phoneNumber };
}

async function getCredentials(): Promise<TwilioCredentials> {
  if (cachedCredentials) return cachedCredentials;

  const fromConnector = await getCredentialsFromConnector();
  if (fromConnector) {
    cachedCredentials = fromConnector;
    if (!cachedCredentials.phoneNumber && process.env.TWILIO_PHONE_NUMBER) {
      cachedCredentials.phoneNumber = process.env.TWILIO_PHONE_NUMBER;
    }
    return cachedCredentials;
  }

  const fromEnv = getCredentialsFromEnv();
  if (fromEnv) {
    cachedCredentials = fromEnv;
    return cachedCredentials;
  }

  throw new Error("Twilio not configured. Set env vars or connect via Replit integration.");
}

export async function getTwilioClient() {
  const { accountSid, apiKey, apiKeySecret } = await getCredentials();
  return twilio(apiKey, apiKeySecret, { accountSid });
}

export async function getTwilioFromPhoneNumber() {
  const { phoneNumber } = await getCredentials();
  return phoneNumber;
}

export async function sendWhatsApp(to: string, body: string) {
  const client = await getTwilioClient();
  const from = await getTwilioFromPhoneNumber();
  return client.messages.create({
    to: `whatsapp:${to}`,
    from: `whatsapp:${from}`,
    body,
  });
}

export async function sendSMS(to: string, body: string) {
  const client = await getTwilioClient();
  const from = await getTwilioFromPhoneNumber();
  return client.messages.create({ to, from, body });
}
