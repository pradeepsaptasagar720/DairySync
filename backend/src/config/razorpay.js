
export const createOrder = async () => ({ id: 'razorpay_stub_order', status: 'created' });
export const verifyWebhook = () => true;

export default {
  createOrder,
  verifyWebhook
};
