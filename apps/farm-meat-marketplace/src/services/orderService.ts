import { Order } from "../types";
import { listAwards, updateAwardStatus } from "./auctionService";

export async function listOrders() {
  return listAwards();
}

export async function createOrder(): Promise<never> {
  throw new Error("Direct checkout orders were replaced by auction awards on the auction branch.");
}

export async function updateOrderStatus(orderId: string, status: Order["status"]) {
  await updateAwardStatus(orderId, status);
}
