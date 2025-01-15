class WebSocketService {
  private socket: WebSocket | null = null;
  private onOpenCallback: (() => void) | null = null;

  connect(url: string): void {
    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      console.log("WebSocket connection established to", url);
      if (this.onOpenCallback) {
        this.onOpenCallback(); // Bağlantı açıldığında callback'i tetikle
      }
    };

    this.socket.onclose = () => {
      console.log("WebSocket connection closed");
    };

    this.socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  }

  /**
   * onOpen - WebSocket bağlantısı açıldığında çağrılacak callback'i ayarlar
   */
  onOpen(callback: () => void): void {
    this.onOpenCallback = callback;
  }

  /**
   * sendMessage - Mesaj göndermeyi standartlaştırır
   */
  sendMessage(data: any): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
      console.log("WebSocket message sent:", data);
    } else {
      console.error("WebSocket is not open. Unable to send message:", data);
    }
  }

  /**
   * onMessage - Gelen mesajları dinlemek için bir callback ayarlar
   */
  onMessage(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.onmessage = (event) => {
        try {
          const parsedData = JSON.parse(event.data);
          console.log("WebSocket message received:", parsedData);
          callback(parsedData);
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };
    }
  }

  /**
   * close - WebSocket bağlantısını kapatır
   */
  close(): void {
    if (this.socket) {
      this.socket.close();
      console.log("WebSocket connection closed manually");
    }
  }
}

const websocketService = new WebSocketService();
export default websocketService;
