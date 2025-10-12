let sessionStartTime;

function setSessionStartTime() {
  const startTime = new Date();
  sessionStartTime = startTime;
}

function calculateSessionDuration() {
  if (!sessionStartTime) {
    return "00:00:00";
  }

  const startTimestamp = sessionStartTime.getTime();
  const currentTimestamp = Date.now();
  const duration = currentTimestamp - startTimestamp;

  const seconds = Math.floor(duration / 1000);
  const minutes = Math.floor(seconds / 60) % 60;
  const hours = Math.floor(seconds / 3600) % 24;
  const days = Math.floor(seconds / 86400);

  const formattedDays = days > 0 ? `${days.toString().padStart(2, "0")}:` : "";
  const formattedHours = hours.toString().padStart(2, "0");
  const formattedMinutes = minutes.toString().padStart(2, "0");
  const formattedSeconds = (seconds % 60).toString().padStart(2, "0");

  return `${formattedDays}${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
}

export { setSessionStartTime, calculateSessionDuration };
