import React, { useEffect, useRef, useState } from 'react';
import { initializePeer, getPeerInstance } from '../utils/peer'; // PeerJS utils
import { useChat } from '../context/ChatContext'; // Kullanıcı bilgileri için context

const CallComponent = ({ remotePeerId }: { remotePeerId: string }) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null); // Yerel stream
  const localVideoRef = useRef<HTMLVideoElement>(null); // Yerel video
  const remoteVideoRef = useRef<HTMLVideoElement>(null); // Uzaktan gelen video
  const { selectedUser } = useChat(); // Seçili kullanıcı

  useEffect(() => {
    const peer = initializePeer(); // PeerJS başlat

    // Gelen aramayı dinle
    peer.on('call', (call) => {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          setLocalStream(stream); // Yerel stream'i state'e ekle
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream; // Yerel videoyu bağla
          }
          call.answer(stream); // Çağrıyı cevapla

          // Uzaktan gelen stream'i dinle
          call.on('stream', (remoteStream) => {
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = remoteStream;
            }
          });
        })
        .catch((error) => {
          console.error('Error accessing media devices:', error);
        });
    });

    return () => {
      peer.destroy(); // Bileşen kaldırıldığında PeerJS'yi temizle
    };
  }, []);

  const startCall = () => {
    const peer = getPeerInstance(); // PeerJS örneği al
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setLocalStream(stream); // Yerel stream'i kaydet
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream; // Yerel videoyu bağla
        }

        // Arama başlat
        const call = peer.call(remotePeerId, stream);
        // Define interface for MediaConnection's stream event
        interface StreamEvent {
          (remoteStream: MediaStream): void;
        }

        call.on('stream', ((remoteStream: MediaStream) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
          }
        }) as StreamEvent);
      })
      .catch((error) => {
        console.error('Error starting call:', error);
      });
  };

  return (
    <div>
      <h1>Video Call with {selectedUser?.name}</h1>
      <div>
        <video ref={localVideoRef} autoPlay muted style={{ width: '300px' }} />
        <video ref={remoteVideoRef} autoPlay style={{ width: '300px' }} />
      </div>
      <button onClick={startCall}>Start Call</button>
    </div>
  );
};

export default CallComponent;
