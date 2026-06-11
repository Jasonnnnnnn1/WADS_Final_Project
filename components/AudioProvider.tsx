"use client";

import React, { createContext, useContext, useRef, useState, ReactNode, useCallback } from "react";

type AudioContextType = {
  musicTrackId: string;
  musicPlaying: boolean;
  ambientVolume: number;
  activeAmbientSounds: string[];
  setMusicTrackId: (id: string) => void;
  setMusicPlaying: (playing: boolean) => void;
  setAmbientVolume: (volume: number) => void;
  toggleAmbientSound: (soundId: string) => void;
  stopAllSounds: () => void;
};

type AmbientSoundId =
  | "white"
  | "brown"
  | "pink"
  | "rain"
  | "stream"
  | "cafe"
  | "library"
  | "office"
  | "forest"
  | "wind"
  | "ocean"
  | "waves"
  | "train"
  | "fan"
  | "campfire"
  | "thunder"
  | "traffic";

type SoundNodeGroup = {
  stop: () => void;
};

const AMBIENT_SOUND_IDS: AmbientSoundId[] = [
  "white",
  "brown",
  "pink",
  "rain",
  "stream",
  "cafe",
  "library",
  "office",
  "forest",
  "wind",
  "ocean",
  "waves",
  "train",
  "fan",
  "campfire",
  "thunder",
  "traffic",
];

const AudioStateContext = createContext<AudioContextType | undefined>(undefined);

function createNoiseProcessor(
  ctx: AudioContext,
  generator: (index: number, last: number) => { sample: number; last: number },
  volume: number,
  output: AudioNode
): SoundNodeGroup {
  const bufferSize = 4096;
  const processor = ctx.createScriptProcessor(bufferSize, 1, 1);
  const gain = ctx.createGain();
  gain.gain.value = volume;

  let last = 0;
  processor.onaudioprocess = (event) => {
    const channel = event.outputBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const result = generator(i, last);
      channel[i] = result.sample;
      last = result.last;
    }
  };

  processor.connect(gain);
  gain.connect(output);

  return {
    stop: () => {
      processor.disconnect();
      gain.disconnect();
    },
  };
}

function createNoiseSource(ctx: AudioContext) {
  const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * 2));
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  return source;
}

function createBurstProcessor(
  ctx: AudioContext,
  output: AudioNode,
  options: {
    volume: number;
    burstChance: number;
    burstMin: number;
    burstMax: number;
    hiss?: number;
  }
): SoundNodeGroup {
  const processor = ctx.createScriptProcessor(4096, 1, 1);
  const gain = ctx.createGain();
  gain.gain.value = options.volume;

  processor.onaudioprocess = (event) => {
    const channel = event.outputBuffer.getChannelData(0);
    for (let i = 0; i < channel.length; i++) {
      let sample = (Math.random() * 2 - 1) * (options.hiss ?? 0.08);
      if (Math.random() < options.burstChance) {
        sample += (Math.random() * 2 - 1) * (options.burstMin + Math.random() * (options.burstMax - options.burstMin));
      }
      channel[i] = sample;
    }
  };

  processor.connect(gain);
  gain.connect(output);

  return {
    stop: () => {
      processor.disconnect();
      gain.disconnect();
    },
  };
}

function createParamLfo(
  ctx: AudioContext,
  target: AudioParam,
  frequency: number,
  depth: number,
  offset: number
) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = frequency;
  gain.gain.value = depth;
  oscillator.connect(gain);
  gain.connect(target);
  oscillator.start();
  target.value = offset;

  return {
    stop: () => {
      oscillator.stop();
      oscillator.disconnect();
      gain.disconnect();
    },
  };
}

function createOscillatorTone(ctx: AudioContext, frequency: number, type: OscillatorType, volume: number, output: AudioNode) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.value = volume;
  oscillator.connect(gain);
  gain.connect(output);
  oscillator.start();

  return {
    stop: () => {
      oscillator.stop();
      oscillator.disconnect();
      gain.disconnect();
    },
  };
}

function createAmbientSound(ctx: AudioContext, soundId: AmbientSoundId, output: AudioNode): SoundNodeGroup {
  const nodes: Array<{ stop: () => void }> = [];
  const makeNoiseChain = (
    volume: number,
    filterType?: BiquadFilterType,
    freq?: number,
    q = 1,
    lfo?: { frequency: number; depth: number; offset: number }
  ) => {
    const source = createNoiseSource(ctx);
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = filterType ?? "lowpass";
    filter.frequency.value = freq ?? 1000;
    filter.Q.value = q;
    gain.gain.value = volume;
    source.connect(filter);
    filter.connect(gain);
    if (lfo) {
      nodes.push(createParamLfo(ctx, gain.gain, lfo.frequency, lfo.depth, lfo.offset));
    }
    gain.connect(output);
    source.start();

    return {
      stop: () => {
        source.stop();
        source.disconnect();
        filter.disconnect();
        gain.disconnect();
      },
    };
  };

  const add = (node: { stop: () => void }) => {
    nodes.push(node);
    return node;
  };

  switch (soundId) {
    case "white": {
      add(makeNoiseChain(0.035, "highpass", 2500, 0.7));
      break;
    }
    case "brown": {
      add(makeNoiseChain(0.22, "lowpass", 450, 0.7));
      break;
    }
    case "pink": {
      add(makeNoiseChain(0.12, "bandpass", 1300, 0.9));
      break;
    }
    case "rain": {
      add(makeNoiseChain(0.028, "bandpass", 1800, 0.55, { frequency: 0.14, depth: 0.018, offset: 0.03 }));
      add(createBurstProcessor(ctx, output, { volume: 0.055, burstChance: 0.004, burstMin: 0.2, burstMax: 1.05, hiss: 0.005 }));
      add(createOscillatorTone(ctx, 14, "sine", 0.008, output));
      break;
    }
    case "stream": {
      add(makeNoiseChain(0.045, "lowpass", 2000, 0.85, { frequency: 0.06, depth: 0.015, offset: 0.04 }));
      add(createOscillatorTone(ctx, 110, "sine", 0.008, output));
      break;
    }
    case "cafe": {
      add(makeNoiseChain(0.07, "bandpass", 700, 1.2, { frequency: 0.07, depth: 0.02, offset: 0.06 }));
      add(createOscillatorTone(ctx, 92, "sine", 0.022, output));
      add(createOscillatorTone(ctx, 184, "triangle", 0.011, output));
      break;
    }
    case "library": {
      add(makeNoiseChain(0.03, "bandpass", 1400, 0.8, { frequency: 0.05, depth: 0.01, offset: 0.028 }));
      add(createBurstProcessor(ctx, output, { volume: 0.008, burstChance: 0.0008, burstMin: 0.12, burstMax: 0.28, hiss: 0.001 }));
      break;
    }
    case "office": {
      add(makeNoiseChain(0.038, "bandpass", 900, 0.95, { frequency: 0.09, depth: 0.012, offset: 0.034 }));
      add(createBurstProcessor(ctx, output, { volume: 0.012, burstChance: 0.0015, burstMin: 0.15, burstMax: 0.35, hiss: 0.002 }));
      add(createOscillatorTone(ctx, 120, "sine", 0.005, output));
      break;
    }
    case "forest": {
      add(makeNoiseChain(0.06, "lowpass", 2200, 0.8, { frequency: 0.05, depth: 0.018, offset: 0.055 }));
      add(createOscillatorTone(ctx, 1350, "sine", 0.0025, output));
      add(createOscillatorTone(ctx, 1760, "triangle", 0.002, output));
      break;
    }
    case "wind": {
      add(makeNoiseChain(0.055, "bandpass", 1500, 0.95, { frequency: 0.08, depth: 0.022, offset: 0.052 }));
      break;
    }
    case "ocean": {
      add(makeNoiseChain(0.11, "lowpass", 950, 0.9, { frequency: 0.08, depth: 0.03, offset: 0.08 }));
      add(createOscillatorTone(ctx, 0.08, "sine", 0.018, output));
      add(createOscillatorTone(ctx, 0.11, "sine", 0.012, output));
      break;
    }
    case "waves": {
      add(makeNoiseChain(0.065, "lowpass", 1200, 0.88, { frequency: 0.05, depth: 0.025, offset: 0.06 }));
      add(createOscillatorTone(ctx, 0.15, "sine", 0.02, output));
      break;
    }
    case "train": {
      add(makeNoiseChain(0.05, "bandpass", 260, 0.7, { frequency: 0.06, depth: 0.016, offset: 0.045 }));
      add(createOscillatorTone(ctx, 52, "sine", 0.02, output));
      add(createBurstProcessor(ctx, output, { volume: 0.01, burstChance: 0.0012, burstMin: 0.1, burstMax: 0.28, hiss: 0.001 }));
      break;
    }
    case "fan": {
      add(createOscillatorTone(ctx, 58, "sine", 0.05, output));
      add(createOscillatorTone(ctx, 116, "sine", 0.017, output));
      add(makeNoiseChain(0.02, "lowpass", 1400, 0.8, { frequency: 0.12, depth: 0.006, offset: 0.02 }));
      break;
    }
    case "campfire": {
      add(makeNoiseChain(0.06, "lowpass", 1200, 0.9, { frequency: 0.04, depth: 0.02, offset: 0.05 }));
      add(createBurstProcessor(ctx, output, { volume: 0.03, burstChance: 0.0018, burstMin: 0.45, burstMax: 1.6, hiss: 0.01 }));
      add(createOscillatorTone(ctx, 92, "sine", 0.012, output));
      break;
    }
    case "thunder": {
      add(makeNoiseChain(0.18, "lowpass", 400, 0.85, { frequency: 0.03, depth: 0.025, offset: 0.17 }));
      add(createBurstProcessor(ctx, output, { volume: 0.025, burstChance: 0.0008, burstMin: 0.3, burstMax: 0.8, hiss: 0.002 }));
      break;
    }
    case "traffic": {
      add(makeNoiseChain(0.04, "bandpass", 220, 0.7, { frequency: 0.08, depth: 0.015, offset: 0.035 }));
      add(createOscillatorTone(ctx, 48, "sine", 0.028, output));
      add(createOscillatorTone(ctx, 96, "triangle", 0.008, output));
      break;
    }
  }

  return {
    stop: () => nodes.forEach((node) => node.stop()),
  };
}

export function AudioProvider({ children }: { children: ReactNode }) {
  const [musicTrackId, setMusicTrackId] = useState("5jaT_8hy3Vg"); // Default to Lofi Hip Hop
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [ambientVolume, setAmbientVolume] = useState(0.7);
  const [activeAmbientSounds, setActiveAmbientSounds] = useState<string[]>([]);

  const ctxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const ambientNodesRef = useRef(new Map<AmbientSoundId, SoundNodeGroup>());

  const ensureContext = useCallback(() => {
    const ctx = ctxRef.current ?? new AudioContext();
    ctxRef.current = ctx;
    if (!masterGainRef.current) {
      const masterGain = ctx.createGain();
      masterGain.gain.value = ambientVolume;
      masterGain.connect(ctx.destination);
      masterGainRef.current = masterGain;
    }
    if (ctx.state === "suspended") {
      void ctx.resume();
    }
    return ctx;
  }, [ambientVolume]);

  React.useEffect(() => {
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = ambientVolume;
    }
  }, [ambientVolume]);

  const stopAmbientSound = useCallback((soundId: AmbientSoundId) => {
    const node = ambientNodesRef.current.get(soundId);
    if (node) {
      node.stop();
      ambientNodesRef.current.delete(soundId);
    }
    setActiveAmbientSounds((prev) => prev.filter((id) => id !== soundId));
  }, []);

  const toggleAmbientSound = useCallback((soundId: string) => {
    if (!AMBIENT_SOUND_IDS.includes(soundId as AmbientSoundId)) {
      return;
    }

    const id = soundId as AmbientSoundId;
    const existing = ambientNodesRef.current.get(id);
    if (existing) {
      stopAmbientSound(id);
      return;
    }

    const ctx = ensureContext();
    const output = masterGainRef.current ?? ctx.destination;
    const nodes = createAmbientSound(ctx, id, output);
    ambientNodesRef.current.set(id, nodes);
    setActiveAmbientSounds((prev) => [...prev, id]);
  }, [ensureContext, stopAmbientSound]);

  const stopAllSounds = useCallback(() => {
    ambientNodesRef.current.forEach((node) => node.stop());
    ambientNodesRef.current.clear();
    setActiveAmbientSounds([]);
    setMusicPlaying(false);
  }, []);

  return (
    <AudioStateContext.Provider
      value={{
        musicTrackId,
        musicPlaying,
        ambientVolume,
        activeAmbientSounds,
        setMusicTrackId,
        setMusicPlaying,
        setAmbientVolume,
        toggleAmbientSound,
        stopAllSounds,
      }}
    >
      {children}
      {/* Persistent music iframe */}
      {musicPlaying && (
        <iframe
          key={musicTrackId}
          src={`https://www.youtube.com/embed/${musicTrackId}?autoplay=1&mute=0&controls=0&modestbranding=1`}
          allow="autoplay; encrypted-media"
          className="hidden"
          title="Study music player"
        />
      )}
    </AudioStateContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioStateContext);
  if (context === undefined) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return context;
}
