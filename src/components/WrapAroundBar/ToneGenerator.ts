export class ToneGenerator {
  private audio = new AudioContext();

  beep(tone: number, ms: number, volume: number = 0.07): void {
    if (tone <= 0 || ms <= 0) {
      throw new Error("Tone and duration must be positive");
    }

    // Browsers may suspend audio until user interaction.
    void this.audio.resume().then(() => {
      const oscillator = this.audio.createOscillator();
      const gain = this.audio.createGain();

      const now = this.audio.currentTime;
      const duration = ms / 1000;
      const fade = Math.min(0.005, duration / 3);

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(tone, now);

      // Smoothly fade in and out to avoid audible clicks.
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(volume, now + fade);
      gain.gain.setValueAtTime(volume, now + duration - fade);
      gain.gain.linearRampToValueAtTime(0, now + duration);

      oscillator.connect(gain);
      gain.connect(this.audio.destination);

      oscillator.start(now);
      oscillator.stop(now + duration);

      oscillator.onended = () => {
        oscillator.disconnect();
        gain.disconnect();
      };
    });
  }

  async close(): Promise<void> {
    await this.audio.close();
  }
}
