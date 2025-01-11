import React, { createContext, useContext, useState, ReactNode, useRef } from "react";
import Peer from "peerjs";

interface CallContextProps {
  localVideoRef: React.RefObject<HTMLVideoElement>;
  remoteVideoRef: React.RefObject<HTMLVideoElement>;
  isCalling: boolean;
  isWaitingForAcceptance: boolean;
  startCall: (isVideoCall: boolean, peerId: string) => Promise<void>;
  acceptCall: (callerPeerId: string) => void;
}

const CallContext = createContext<CallContextProps | undefined>(undefined);

export const CallProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isCalling, setIsCalling] = useState(false);
  const [isWaitingForAcceptance, setIsWaitingForAcceptance] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const startCall = async (isVideoCall: boolean, peerId: string) => {
    const peer = new Peer();

    peer.on("open", async () => {
      console.log("Peer connected with ID:", peer.id);

      setIsCalling(true);
      setIsWaitingForAcceptance(true);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: isVideoCall,
          audio: true,
        });

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          await localVideoRef.current.play();
        }

        const call = peer.call(peerId, stream);

        call.on("stream", (remoteStream) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
            remoteVideoRef.current.play().catch((err) => console.error("Error playing remote stream:", err));
          }
        });
      } catch (error) {
        console.error("Error starting call:", error);
        setIsCalling(false);
        setIsWaitingForAcceptance(false);
      }
    });

    peer.on("error", (err) => {
      console.error("PeerJS error:", err);
      setIsCalling(false);
      setIsWaitingForAcceptance(false);
    });
  };

  const acceptCall = (callerPeerId: string) => {
    const peer = new Peer();

    peer.on("open", async () => {
      console.log("Peer connected with ID:", peer.id);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          await localVideoRef.current.play();
        }

        const call = peer.call(callerPeerId, stream);

        call.on("stream", (remoteStream) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
            remoteVideoRef.current.play().catch((err) => console.error("Error playing remote stream:", err));
          }
        });
      } catch (error) {
        console.error("Error accepting call:", error);
      }
    });

    peer.on("error", (err) => {
      console.error("PeerJS error:", err);
    });
  };

  return (
    <CallContext.Provider
      value={{
        localVideoRef,
        remoteVideoRef,
        isCalling,
        isWaitingForAcceptance,
        startCall,
        acceptCall,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = (): CallContextProps => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error("useCall must be used within a CallProvider");
  }
  return context;
};
