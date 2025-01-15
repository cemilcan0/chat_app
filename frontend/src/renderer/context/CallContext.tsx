import React, { createContext, useContext, useState, ReactNode, useRef } from "react";
import Peer from "peerjs";
import apiClient from "../utils/apiClient";
import { UserType } from "../types";

interface IncomingCall {
  callerName: string;
  callerPhoto: string;
  callerPeerId: string;
  isVideoCall: boolean;
}

interface CallContextProps {
  localVideoRef: React.RefObject<HTMLVideoElement>;
  remoteVideoRef: React.RefObject<HTMLVideoElement>;
  isCalling: boolean;
  isWaitingForAcceptance: boolean;
  onCall: UserType | null;
  startCall: (isVideoCall: boolean, selectedUser: UserType) => Promise<void>;
  acceptCall: (incomingCall: IncomingCall | null, setIncomingCall: (call: IncomingCall | null) => void) => void;
  endCall: () => Promise<void>;
  toggleCamera: () => void;
  toggleAudio: () => void;
}

const CallContext = createContext<CallContextProps | undefined>(undefined);

export const CallProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isCalling, setIsCalling] = useState(false);
  const [isWaitingForAcceptance, setIsWaitingForAcceptance] = useState(false);
  const [onCall, setOnCall] = useState<UserType | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const peerRef = useRef<Peer | null>(null);

  // Başlatılan aramayı yönetir
  const startCall = async (isVideoCall: boolean, selectedUser: UserType) => {
    try {
      if (!peerRef.current) {
        peerRef.current = new Peer();
      }

      peerRef.current.on("open", async (peerId) => {
        setIsCalling(true);
        setIsWaitingForAcceptance(true);

        const loggedInUser = JSON.parse(localStorage.getItem("user") || "{}");

        await apiClient.post("/chat-app/start-call/", {
          sender: loggedInUser.username,
          receiver: selectedUser?.id,
          peer_id: peerId,
          isVideoCall,
        });
      });

      peerRef.current.on("call", (call) => {
        setIsWaitingForAcceptance(false);
        setIsCalling(false);
        setOnCall(selectedUser);

        navigator.mediaDevices
          .getUserMedia({ video: isVideoCall, audio: true })
          .then((stream) => {
            call.answer(stream);

            if (localVideoRef.current) {
              localVideoRef.current.srcObject = stream;
              localVideoRef.current.play().catch(() => { });
            }

            call.on("stream", (remoteStream) => {
              if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = remoteStream;
                remoteVideoRef.current.play().catch(() => { });
              }
            });

            call.on("close", resetCallState);
            call.on("error", resetCallState);
          })
          .catch(() => {
            setIsCalling(false);
          });
      });

      peerRef.current.on("disconnected", resetCallState);
      peerRef.current.on("error", () => {
        setIsCalling(false);
        setIsWaitingForAcceptance(false);
        resetCallState();
      });
    } catch {
      setIsCalling(false);
      setIsWaitingForAcceptance(false);
    }
  };

  // Gelen aramayı kabul eder
  const acceptCall = (incomingCall: IncomingCall | null, setIncomingCall: (call: IncomingCall | null) => void) => {
    if (!incomingCall) return;

    if (!peerRef.current) {
      peerRef.current = new Peer();
    }

    peerRef.current.on("open", () => {
      setIncomingCall(null);
      setOnCall({ username: incomingCall.callerName, photo: incomingCall.callerPhoto } as UserType);

      const isVideoCall = incomingCall.isVideoCall; // Gelen çağrı türü

      navigator.mediaDevices
        .getUserMedia({ video: isVideoCall, audio: true })
        .then((stream) => {
          const call = peerRef.current?.call(incomingCall.callerPeerId, stream);

          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
            localVideoRef.current.play().catch(() => { });
          }

          call?.on("stream", (remoteStream) => {
            if (remoteVideoRef.current) {
              const videoTrack = remoteStream.getVideoTracks()[0];
              if (videoTrack?.enabled) {
                remoteVideoRef.current.srcObject = remoteStream;
                remoteVideoRef.current.play().catch(() => { });
              } else {
                remoteVideoRef.current.srcObject = null;
              }
            }
          });

          call?.on("close", resetCallState);
          call?.on("error", resetCallState);
        })
        .catch(() => { });
    });
  };

  // Aramayı sonlandırır
  const endCall = async () => {
    try {
      if (peerRef.current) {
        const peerId = peerRef.current.id;

        const loggedInUser = JSON.parse(localStorage.getItem("user") || "{}");
        if (onCall) {
          await apiClient.post("/chat-app/end-call/", {
            sender: loggedInUser.username,
            receiver: onCall.id,
            peer_id: peerId,
            isVideoCall: true,
          });
        }

        resetCallState();
      }
    } catch {
      console.error("Error ending call");
    }
  };

  // Arama durumlarını sıfırlar
  const resetCallState = () => {
    if (peerRef.current) {
      const peerId = peerRef.current.id;
      peerRef.current.destroy();
      peerRef.current = null;
    }

    setIsCalling(false);
    setIsWaitingForAcceptance(false);
    setOnCall(null);

    if (localVideoRef.current?.srcObject) {
      const tracks = (localVideoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      localVideoRef.current.srcObject = null;
    }

    if (remoteVideoRef.current?.srcObject) {
      const tracks = (remoteVideoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      remoteVideoRef.current.srcObject = null;
    }
  };

  // Kamerayı açıp kapatır
  const toggleCamera = () => {
    toggleMediaTrack("video");
  };

  // Sesi açıp kapatır
  const toggleAudio = () => {
    toggleMediaTrack("audio");
  };

  // Ortak medya kontrol fonksiyonu
  const toggleMediaTrack = (type: "audio" | "video") => {
    const stream = localVideoRef.current?.srcObject as MediaStream | null;
    if (stream) {
      const tracks = type === "audio" ? stream.getAudioTracks() : stream.getVideoTracks();
      tracks.forEach((track) => {
        track.enabled = !track.enabled; // Medya akışını aç/kapat
      });
    }
  };

  return (
    <CallContext.Provider
      value={{
        localVideoRef,
        remoteVideoRef,
        isCalling,
        isWaitingForAcceptance,
        onCall,
        startCall,
        acceptCall,
        endCall,
        toggleCamera,
        toggleAudio,
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
