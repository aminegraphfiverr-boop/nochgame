
import { PUSHER_KEY } from '../constants';

export class KickService {
  private ws: WebSocket | null = null;
  private channel: string;
  private chatroomId: string | null = null;

  constructor(channel: string = 'n0chh') {
    this.channel = channel;
  }

  async fetchChannelInfo() {
    try {
      // Note: Real browser environments might hit CORS issues on kick.com/api
      // For demonstration, we assume a proxy or serverless function wrapper
      const response = await fetch(`https://kick.com/api/v2/channels/${this.channel}`);
      if (!response.ok) throw new Error('Channel Fetch Failed');
      return await response.json();
    } catch (error) {
      console.error("Error fetching channel info:", error);
      return null;
    }
  }

  connectChat(chatroomId: string, onMessage: (msg: any) => void) {
    this.chatroomId = chatroomId;
    const url = `wss://ws-us2.pusher.com/app/${PUSHER_KEY}?protocol=7&client=js&version=7.6.0&flash=false`;
    
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.ws?.send(JSON.stringify({
        event: "pusher:subscribe",
        data: { auth: "", channel: `chatrooms.${chatroomId}.v2` }
      }));
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.event?.includes('ChatMessageEvent')) {
        let payload = data.data;
        if (typeof payload === 'string') payload = JSON.parse(payload);
        // Deep parsing for different Pusher structures
        if (payload?.data && typeof payload.data === 'string') payload = JSON.parse(payload.data);
        const msg = payload?.message || payload;
        if (msg && msg.sender && msg.content !== undefined) {
          onMessage(msg);
        }
      }
    };

    this.ws.onclose = () => {
      setTimeout(() => this.connectChat(chatroomId, onMessage), 5000);
    };
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
