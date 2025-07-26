// src/app/utils/knock.jsx

let audio;

export function playKnock() {
  if (!audio) {
    audio = new Audio('/knock.mp3'); // Make sure this path is correct relative to `public`
  }
  // Reset audio to start in case still playing
  audio.pause();
  audio.currentTime = 0;
  audio.play().catch((e) => {
    // Catch play errors, often due to browser autoplay policies
    console.log('Audio play error:', e);
  });
}
