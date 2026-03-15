import { Order } from "../types";

export async function notifyFarmerOfSale(order: Order) {
  return {
    delivered: true,
    message: `Mock notification sent to farmer for order ${order.id}`
  };
}

export async function sendRealSaleNotification(_order: Order) {
  throw new Error("TODO: connect notification provider");
}
