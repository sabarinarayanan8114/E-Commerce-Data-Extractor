import nodemailer from "nodemailer";
import { AlertLog } from "./types";
import { addLog } from "./db";

export async function sendPriceAlertEmail(
  productTitle: string,
  currentPrice: number,
  targetPrice: number,
  currencyCode: string,
  recipientEmail: string
): Promise<AlertLog> {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT) || 587;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || "price-alert-bot@example.com";

  const subject = `🚨 Price Drop Alert: "${productTitle}" has hit your target!`;
  const body = `Hello,

Great news! The product you are tracking has dropped in price.

Product: ${productTitle}
Target Price: ${currencyCode} ${targetPrice}
Current Price: ${currencyCode} ${currentPrice}

We found this price drop during our automated tracking cycle.

Happy Shopping!
Your E-commerce Price Alert Bot`;

  const timestamp = new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" }) + " PT";
  const logId = "alert_" + Math.random().toString(36).substring(2, 11);

  // Check if real SMTP config exists and is not the default boilerplate
  const hasRealSmtp = 
    smtpHost && 
    smtpHost !== "smtp.gmail.com" && 
    smtpUser && 
    smtpUser !== "your-email@gmail.com" && 
    smtpPass && 
    smtpPass !== "your-app-password";

  if (!hasRealSmtp) {
    console.log("-----------------------------------------");
    console.log(`[SIMULATED EMAIL SENT TO ${recipientEmail}]`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${body}`);
    console.log("-----------------------------------------");

    const simLog: AlertLog = {
      id: logId,
      productTitle,
      currentPrice,
      targetPrice,
      recipient: recipientEmail,
      timestamp,
      status: "simulated",
      subject,
      body
    };

    addLog(simLog);
    return simLog;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });

    await transporter.sendMail({
      from: smtpFrom,
      to: recipientEmail,
      subject: subject,
      text: body
    });

    const realLog: AlertLog = {
      id: logId,
      productTitle,
      currentPrice,
      targetPrice,
      recipient: recipientEmail,
      timestamp,
      status: "sent",
      subject,
      body
    };

    addLog(realLog);
    return realLog;

  } catch (err: any) {
    console.error("Error sending real email via SMTP, falling back to simulated:", err);
    
    const failedLog: AlertLog = {
      id: logId,
      productTitle,
      currentPrice,
      targetPrice,
      recipient: recipientEmail,
      timestamp,
      status: "failed",
      subject: subject + " (SMTP SEND FAILED: " + err.message + ")",
      body: body + `\n\n[System note: SMTP send failed. error: ${err.message}]`
    };

    addLog(failedLog);
    return failedLog;
  }
}
