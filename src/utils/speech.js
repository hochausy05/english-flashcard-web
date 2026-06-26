const WORD_AUDIO_VOLUME = 1.0;

export function speakWord(word, audioUrl = "") {
  if (audioUrl) {
    const audio = new Audio(audioUrl);
    audio.volume = WORD_AUDIO_VOLUME;
    audio.play();
    return;
  }

  if (!("speechSynthesis" in window)) {
    alert("Trình duyệt này chưa hỗ trợ đọc phát âm.");
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = "en-US";
  utterance.rate = 0.85;
  utterance.pitch = 1;
  utterance.volume = WORD_AUDIO_VOLUME;

  window.speechSynthesis.speak(utterance);
}

