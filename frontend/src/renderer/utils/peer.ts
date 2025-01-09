import Peer from "peerjs";

let peer: Peer | null = null;

export const initializePeer = () => {
  if (!peer) {
    peer = new Peer(); // Peer oluştur
    peer.on("open", (id) => {
      console.log("Peer connected with ID:", id);
    });
    peer.on("error", (err) => {
      console.error("Peer error:", err);
    });
  }
  return peer;
};

export const getPeerInstance = () => {
  if (!peer) {
    throw new Error("Peer not initialized. Call initializePeer first.");
  }
  return peer;
};
