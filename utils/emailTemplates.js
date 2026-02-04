// Email Templates for various notifications

const otpEmailTemplate = (otp, name) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .otp-box { background: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px; }
        .otp-code { font-size: 32px; font-weight: bold; color: #4CAF50; letter-spacing: 5px; }
        .footer { margin-top: 30px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Email Verification</h2>
        <p>Hello ${name || "User"},</p>
        <p>Your verification code is:</p>
        <div class="otp-box">
          <div class="otp-code">${otp}</div>
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this code, please ignore this email.</p>
        <div class="footer">
          <p>Thank you for shopping with us!</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const orderConfirmationTemplate = (order, user) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .order-header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
        .order-details { background: #f9f9f9; padding: 20px; margin: 20px 0; }
        .item { border-bottom: 1px solid #ddd; padding: 10px 0; }
        .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="order-header">
          <h2>Order Confirmed!</h2>
          <p>Order #${order._id}</p>
        </div>
        <p>Hello ${user.firstname},</p>
        <p>Thank you for your order! We've received it and will process it shortly.</p>
        <div class="order-details">
          <h3>Order Summary</h3>
          ${order.orderItems
            .map(
              (item) => `
            <div class="item">
              <strong>${item.product?.title || "Product"}</strong><br>
              Quantity: ${item.quantity} × ₹${item.price}
            </div>
          `
            )
            .join("")}
          <div class="total">
            Total: ₹${order.totalPriceAfterDiscount}
          </div>
        </div>
        <p>Estimated Delivery: ${order.scheduledDeliveryDate || "2-3 days"}</p>
        <p>Track your order in the app or website.</p>
      </div>
    </body>
    </html>
  `;
};

const orderStatusTemplate = (order, status, user) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .status-header { padding: 20px; text-align: center; border-radius: 5px; }
        .status-processing { background: #ff9800; color: white; }
        .status-shipped { background: #2196F3; color: white; }
        .status-delivered { background: #4CAF50; color: white; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="status-header status-${status.toLowerCase()}">
          <h2>Order ${status}</h2>
          <p>Order #${order._id}</p>
        </div>
        <p>Hello ${user.firstname},</p>
        <p>Your order status has been updated to: <strong>${status}</strong></p>
        ${
          status === "Out for Delivery"
            ? `<p>Delivery Person: ${order.deliveryPerson?.name}</p>
           <p>Contact: ${order.deliveryPerson?.phone}</p>`
            : ""
        }
        <p>Track your order in real-time in the app.</p>
      </div>
    </body>
    </html>
  `;
};

const welcomeEmailTemplate = (user) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .welcome-header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 10px; }
        .features { display: flex; flex-wrap: wrap; margin: 30px 0; }
        .feature { flex: 1; min-width: 150px; padding: 15px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="welcome-header">
          <h1>Welcome to Our Store!</h1>
          <p>We're excited to have you onboard, ${user.firstname}!</p>
        </div>
        <p>Thank you for joining us. Get ready for a seamless shopping experience with:</p>
        <div class="features">
          <div class="feature">
            <h3>🚀 Fast Delivery</h3>
            <p>Quick delivery to your doorstep</p>
          </div>
          <div class="feature">
            <h3>💰 Best Prices</h3>
            <p>Competitive prices & deals</p>
          </div>
          <div class="feature">
            <h3>🎁 Rewards</h3>
            <p>Earn rewards on every purchase</p>
          </div>
        </div>
        <p style="text-align: center;">
          <a href="${process.env.FRONTEND_URL}" style="background: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Start Shopping</a>
        </p>
      </div>
    </body>
    </html>
  `;
};

module.exports = {
  otpEmailTemplate,
  orderConfirmationTemplate,
  orderStatusTemplate,
  welcomeEmailTemplate,
};
