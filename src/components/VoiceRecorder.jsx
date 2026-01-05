// src/components/VoiceRecorder.jsx
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Microphone,
  Stop,
  Play,
  Pause,
  Trash,
  FloppyDisk,
  Waveform,
  Crown,
} from "phosphor-react";
import { FiX, FiCheck } from "react-icons/fi";
import { useSubscription } from "../hooks/useSubscription";

export default function VoiceRecorder({ onSave, onClose }) {
  const { isFeatureUnlocked } = useSubscription();
  const isUnlocked = isFeatureUnlocked("voice");

  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [transcript, setTranscript] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevels, setAudioLevels] = useState(Array(20).fill(0.1));

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const analyserRef = useRef(null);
  const animationRef = useRef(null);
  const recognitionRef = useRef(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript + ' ';
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        setTranscript((prev) => {
          // Remove interim and add final
          const lines = prev.split('\n');
          const lastLine = lines[lines.length - 1] || '';
          if (finalTranscript) {
            return prev + finalTranscript;
          }
          return prev;
        });
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Audio visualization
  const visualize = (analyser) => {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      analyser.getByteFrequencyData(dataArray);
      
      // Sample 20 points from the frequency data
      const step = Math.floor(bufferLength / 20);
      const levels = [];
      for (let i = 0; i < 20; i++) {
        const value = dataArray[i * step] / 255;
        levels.push(Math.max(0.1, value));
      }
      setAudioLevels(levels);
      
      if (isRecording && !isPaused) {
        animationRef.current = requestAnimationFrame(draw);
      }
    };

    draw();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Set up audio context for visualization
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Set up media recorder
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setIsPaused(false);
      setTranscript("");

      // Start speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.start();
        setIsTranscribing(true);
      }

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      // Start visualization
      visualize(analyser);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);

      // Stop speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        setIsTranscribing(false);
      }

      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      // Stop visualization
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      setAudioLevels(Array(20).fill(0.1));
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        if (recognitionRef.current) {
          recognitionRef.current.start();
        }
        timerRef.current = setInterval(() => {
          setRecordingTime((prev) => prev + 1);
        }, 1000);
        visualize(analyserRef.current);
      } else {
        mediaRecorderRef.current.pause();
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      }
      setIsPaused(!isPaused);
    }
  };

  const resetRecording = () => {
    stopRecording();
    setAudioURL(null);
    setTranscript("");
    setRecordingTime(0);
  };

  const handleSave = () => {
    if (transcript.trim() || audioURL) {
      onSave({
        transcript: transcript.trim(),
        audioURL,
        duration: recordingTime,
        createdAt: new Date().toISOString(),
      });
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // If feature not unlocked, show upgrade prompt
  if (!isUnlocked) {
    return (
      <div 
        className="rounded-2xl p-8 border text-center"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-secondary)' }}
      >
        <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
          <Crown size={32} weight="fill" className="text-purple-400" />
        </div>
        <h3 className="text-xl font-bold text-theme-primary mb-2">Voice Notes is a Pro Feature</h3>
        <p className="text-theme-muted mb-6">
          Upgrade to Pro to record voice memos and get instant AI transcription.
        </p>
        <button
          onClick={onClose}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium"
        >
          Upgrade to Pro
        </button>
      </div>
    );
  }

  return (
    <div 
      className="rounded-2xl border overflow-hidden"
      style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-secondary)' }}
    >
      {/* Header */}
      <div 
        className="px-6 py-4 border-b flex items-center justify-between"
        style={{ borderColor: 'var(--border-secondary)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <Microphone size={20} weight="duotone" className="text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold text-theme-primary">Voice Notes</h3>
            <p className="text-xs text-theme-muted">Record and transcribe</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg text-theme-muted hover:text-theme-primary transition"
        >
          <FiX size={20} />
        </button>
      </div>

      {/* Recording Area */}
      <div className="p-6">
        {/* Visualizer */}
        <div 
          className="rounded-xl p-6 mb-6 flex items-center justify-center gap-1 min-h-[100px]"
          style={{ backgroundColor: 'var(--bg-tertiary)' }}
        >
          {isRecording ? (
            audioLevels.map((level, i) => (
              <motion.div
                key={i}
                className="w-1.5 bg-gradient-to-t from-purple-500 to-indigo-500 rounded-full"
                animate={{ height: `${level * 60 + 10}px` }}
                transition={{ duration: 0.1 }}
              />
            ))
          ) : audioURL ? (
            <audio controls src={audioURL} className="w-full" />
          ) : (
            <div className="text-center">
              <Waveform size={48} weight="duotone" className="text-theme-muted mx-auto mb-2" />
              <p className="text-sm text-theme-muted">Press record to start</p>
            </div>
          )}
        </div>

        {/* Timer */}
        <div className="text-center mb-6">
          <span className="text-3xl font-mono font-bold text-theme-primary">
            {formatTime(recordingTime)}
          </span>
          {isRecording && (
            <span className="ml-2 text-xs text-rose-500 animate-pulse">● REC</span>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mb-6">
          {!isRecording && !audioURL && (
            <button
              onClick={startRecording}
              className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/30 hover:scale-105 transition"
            >
              <Microphone size={28} weight="fill" />
            </button>
          )}

          {isRecording && (
            <>
              <button
                onClick={pauseRecording}
                className="w-12 h-12 rounded-full flex items-center justify-center text-theme-primary transition"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
              >
                {isPaused ? <Play size={24} weight="fill" /> : <Pause size={24} weight="fill" />}
              </button>
              <button
                onClick={stopRecording}
                className="w-16 h-16 rounded-full bg-rose-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/30 hover:scale-105 transition"
              >
                <Stop size={28} weight="fill" />
              </button>
            </>
          )}

          {audioURL && !isRecording && (
            <>
              <button
                onClick={resetRecording}
                className="w-12 h-12 rounded-full flex items-center justify-center text-rose-500 transition"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
              >
                <Trash size={20} weight="fill" />
              </button>
              <button
                onClick={startRecording}
                className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/30 hover:scale-105 transition"
              >
                <Microphone size={28} weight="fill" />
              </button>
            </>
          )}
        </div>

        {/* Transcript */}
        <div className="mb-6">
          <label className="text-xs font-medium text-theme-muted mb-2 block">
            Transcript {isTranscribing && <span className="text-purple-400">(listening...)</span>}
          </label>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Your transcription will appear here as you speak..."
            rows={5}
            className="w-full px-4 py-3 rounded-xl border text-theme-primary placeholder:text-theme-muted outline-none focus:ring-2 focus:ring-purple-500/50 transition resize-none"
            style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-secondary)' }}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-medium border text-theme-secondary hover:bg-white/5 transition"
            style={{ borderColor: 'var(--border-secondary)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!transcript.trim() && !audioURL}
            className="flex-1 py-3 rounded-xl font-semibold bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <FloppyDisk size={18} weight="fill" />
            Save Note
          </button>
        </div>
      </div>
    </div>
  );
}