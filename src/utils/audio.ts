// Web Audio API sound generator for browser-safe, zero-latency classroom sound effects

class AudioManager {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private getContext(): AudioContext | null {
    if (!this.enabled) return null;
    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!this.ctx && AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  /**
   * Play a crisp rolling mechanical tick / suspense tick
   * @param pitchMultiplier adjusts pitch as the roll decelerates
   */
  public playTick(pitchMultiplier = 1.0) {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520 * pitchMultiplier, now);
      osc.frequency.exponentialRampToValueAtTime(320 * pitchMultiplier, now + 0.04);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.045);
    } catch {
      // Audio context might be restricted before interaction
    }
  }

  /**
   * Play a celebratory winning chime fanfare (arpeggiated major chord with rich decay)
   */
  public playFanfare() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Notes: C5 (523.25), E5 (659.25), G5 (783.99), C6 (1046.50)
      const chord = [523.25, 659.25, 783.99, 1046.50];

      chord.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        const startTime = now + index * 0.08;
        const duration = index === chord.length - 1 ? 1.0 : 0.45;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.22, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration);
      });

      // Extra bell shimmer on final note
      const shimmer = ctx.createOscillator();
      const shimmerGain = ctx.createGain();
      const shimmerTime = now + 0.24;
      shimmer.type = 'triangle';
      shimmer.frequency.setValueAtTime(1318.51, shimmerTime); // E6
      shimmerGain.gain.setValueAtTime(0.15, shimmerTime);
      shimmerGain.gain.exponentialRampToValueAtTime(0.001, shimmerTime + 1.2);
      shimmer.connect(shimmerGain);
      shimmerGain.connect(ctx.destination);
      shimmer.start(shimmerTime);
      shimmer.stop(shimmerTime + 1.25);
    } catch {
      // Audio context catch
    }
  }

  /**
   * Play a smooth whoosh sound for shuffle or reset
   */
  public playShuffle() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(650, now + 0.08);
      osc.frequency.exponentialRampToValueAtTime(250, now + 0.16);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.17);
    } catch {
      // Audio context catch
    }
  }
}

export const soundEffects = new AudioManager();
