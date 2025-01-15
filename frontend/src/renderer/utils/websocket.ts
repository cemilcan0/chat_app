class WebSocketService {
  private socket: WebSocket | null = null;

  connect(url: string): void {
    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      console.log("WebSocket connection established to", url);
    };

    this.socket.onclose = () => {
      console.log("WebSocket connection closed");
    };

    this.socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  }

  send(data: any): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    } else {
      console.error("WebSocket is not open");
    }
  }

  onMessage(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.onmessage = (event) => {
        try {
          const parsedData = JSON.parse(event.data);
          // Gelen mesajın `status` ve `message` yapısını kontrol ediyoruz
          if (parsedData && parsedData.status && parsedData.message) {
            console.log("WebSocket message received:", parsedData);
            callback(parsedData);
          } else {
            console.warn("Unexpected WebSocket message structure:", parsedData);
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };
    }
  }

  close(): void {
    if (this.socket) {
      this.socket.close();
    }
  }
}

const websocketService = new WebSocketService();
export default websocketService;