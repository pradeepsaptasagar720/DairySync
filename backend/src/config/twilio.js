import twilio from "twilio";
import { env } from "./env.js";

let client = null;

export function getTwilioClient() {
  if (!env.TWILIO_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_PHONE) {
    console.log("ℹ️ Twilio not configured — running in OTP demo mode");
    return null;
  }

  if (!client) {
    client = twilio(env.TWILIO_SID, env.TWILIO_AUTH_TOKEN);
  }

  return client;
}
