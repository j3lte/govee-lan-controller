import { createSocket, Socket } from "node:dgram";
import { networkInterfaces } from "node:os";
import { GoveeSocketMessage } from "./socket-message";

const BROADCAST_ADDRESS = "239.255.255.250";
const SOCKET_LISTEN_PORT = 4002;
const SOCKET_SEND_PORT = 4001;

export const sendSocketMsg = (
  socket: Socket,
  msg: string,
  address?: string,
  callback?: (error: Error | null, bytesSent: number) => void
) => {
  const sendAddress = address ?? BROADCAST_ADDRESS;
  socket.send(msg, 0, msg.length, SOCKET_SEND_PORT, sendAddress, callback);
};

/**
 * Create a socket that listens for Govee devices. It will automatically send a discovery message that will trigger the device to send a response.
 *
 * @param address Optional address to bind to
 * @returns socket
 * @throws Error if an address is provided, but cannot be bound to
 */
export const createListenSocket = (address?: string): Promise<Socket> => {
  const networks = networkInterfaces();
  let addresses = Object.values(networks)
    .flat()
    .map((network) => {
      if (!network || network.internal) {
        return null;
      }
      const family = typeof network.family === "string" ? "IPv4" : 4;
      if (network.family !== family) {
        return null;
      }
      return network.address;
    })
    .filter((address) => address !== null) as string[];

  if (address) {
    if (!addresses.includes(address)) {
      throw new Error(`Address ${address} cannot be bound to`);
    }
    addresses = [address];
  }

  return new Promise((resolve) => {
    addresses.forEach((address) => {
      const socket = createSocket({
        type: "udp4",
        reuseAddr: true,
      });
      socket.once("message", () => resolve(socket));
      socket.on("listening", () => {
        socket.setBroadcast(true);
        socket.setMulticastTTL(128);
        socket.addMembership(BROADCAST_ADDRESS);
        sendSocketMsg(socket, GoveeSocketMessage.BroadCastDiscover());
      });

      socket.bind(SOCKET_LISTEN_PORT, address);
    });
  });
};
