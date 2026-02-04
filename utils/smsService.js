// SMS Service using Twilio or any SMS provider
// Replace with your preferred SMS service

const sendSMS = async (phone, message) => {
  try {
    // Example using Twilio (Install: npm install twilio)
    // const twilio = require('twilio');
    // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    // await client.messages.create({
    //   body: message,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   to: phone
    // });

    // For development: Just log the SMS
    console.log(`SMS to ${phone}: ${message}`);

    return {
      success: true,
      message: "SMS sent successfully",
    };
  } catch (error) {
    console.error("SMS Error:", error);
    throw new Error("Failed to send SMS");
  }
};

const sendOTPSMS = async (phone, otp) => {
  const message = `Your verification code is: ${otp}. Valid for 10 minutes. Do not share with anyone.`;
  return await sendSMS(phone, message);
};

const sendOrderStatusSMS = async (phone, orderStatus, orderId) => {
  const message = `Your order #${orderId} is ${orderStatus}. Track your order in the app.`;
  return await sendSMS(phone, message);
};

const sendDeliveryOTPSMS = async (phone, otp) => {
  const message = `Your delivery OTP is: ${otp}. Share this with delivery person to complete delivery.`;
  return await sendSMS(phone, message);
};

module.exports = {
  sendSMS,
  sendOTPSMS,
  sendOrderStatusSMS,
  sendDeliveryOTPSMS,
};
