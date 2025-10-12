// --- Kick Chat Integration (Simplified for game focus) ---

const urlParams = new URLSearchParams(window.location.search);
const channel = urlParams.get("kick") || "odablock";

const excludedKickBots = [
  "babblechat", "botrix", "casterlabs", "intrx", "livebot", "lottobot",
  "logibot", "mrbeefbot", "notibot", "squadbot", "babzbot", "kickbot",
  "kicklet", "boostbot", "kicktools", "aerokick"
];

let kickWS = null;

function connectWebSocket() {
  const kickWSUri = "wss://ws-us2.pusher.com/app/32cbd69e4b950bf97679?protocol=7&client=js&version=7.6.0&flash=false";
  kickWS = new WebSocket(kickWSUri);

  kickWS.addEventListener("open", async () => {
    try {
      const res = await fetch(`https://kick.com/api/v2/channels/${channel}`);
      const userData = await res.json();
      
      if (userData?.chatroom?.id) {
        kickWS.send(JSON.stringify({
          event: "pusher:subscribe",
          data: { auth: "", channel: `chatrooms.${userData.chatroom.id}.v2` }
        }));
        console.log("Connected to Kick chat:", channel);
        if (typeof setSessionStartTime === 'function') setSessionStartTime();
      }
    } catch (err) {
      console.error("Failed to connect to Kick API", err);
    }
  });

  kickWS.addEventListener("message", (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.event === "App\\Events\\ChatMessageEvent") {
        const msgData = JSON.parse(data.data);
        const username = msgData.sender.username;
        const content = msgData.content;
        const lowerUser = username.toLowerCase();

        if (excludedKickBots.includes(lowerUser)) return;

        // 🔥 Dispatch custom event for game.js
        const chatEvent = new CustomEvent('chat-message', {
          detail: { username, message: content }
        });
        document.dispatchEvent(chatEvent);
      }
    } catch (e) {
      console.warn("Chat parse error", e);
    }
  });

  kickWS.addEventListener("close", () => {
    setTimeout(connectWebSocket, 5000);
  });
}

// Start connection
document.addEventListener('DOMContentLoaded', () => {
  connectWebSocket();
});
