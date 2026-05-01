export function chatbotReply(message) {
  const text = message.toLowerCase();

  if (text.includes("login")) {
    return "Use your registered mobile number and password to login.";
  }

  if (text.includes("delivery")) {
    return "You can request milk delivery from the Buyer Dashboard.";
  }

  if (text.includes("payment")) {
    return "Payments can be made online or via Cash on Delivery.";
  }

  return "Sorry, I didn’t understand that. Please contact support.";
}
