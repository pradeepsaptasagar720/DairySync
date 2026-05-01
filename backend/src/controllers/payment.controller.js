import Payment from "../models/Payment.model.js";

export async function createPayment(req, res) {
  const payment = await Payment.create(req.body);
  res.json(payment);
}

export async function getHistory(req, res) {
  const payments = await Payment.find({ user: req.user.id });
  res.json(payments);
}
