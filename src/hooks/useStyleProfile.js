// src/hooks/useStyleProfile.js
import { useState, useEffect, useCallback } from 'react';
import { 
  analyzeWritingStyle, 
  getDefaultProfile, 
  generateStylePrompt, 
  mergeProfiles 
} from '../utils/styleAnalyzer';

const STORAGE_KEY = 'notestream_style_profile';
const SAMPLES_KEY = 'notestream_writing_samples';

/**
 * Custom hook for managing AI style profiles
 * Currently uses localStorage, structured for easy MongoDB migration
 * 
 * MongoDB Migration Notes:
 * - Replace localStorage calls with API calls to /api/style-profile
 * - Profile structure matches MongoDB schema in styleAnalyzer.js
 * - Samples would be stored in a separate collection
 */
export function useStyleProfile() {
  const [profile, setProfile] = useState(null);
  const [samples, setSamples] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTraining, setIsTraining] = useState(false);
  const [error, setError] = useState(null);

  // Load profile from storage on mount
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = useCallback(() => {
    try {
      setIsLoading(true);
      
      // Load profile
      const storedProfile = localStorage.getItem(STORAGE_KEY);
      if (storedProfile) {
        setProfile(JSON.parse(storedProfile));
      } else {
        const defaultProfile = getDefaultProfile();
        setProfile(defaultProfile);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultProfile));
      }
      
      // Load samples
      const storedSamples = localStorage.getItem(SAMPLES_KEY);
      if (storedSamples) {
        setSamples(JSON.parse(storedSamples));
      }
      
      setError(null);
    } catch (err) {
      console.error('Failed to load profile:', err);
      setError('Failed to load profile');
      setProfile(getDefaultProfile());
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveProfile = useCallback((newProfile) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newProfile));
      setProfile(newProfile);
      setError(null);
    } catch (err) {
      console.error('Failed to save profile:', err);
      setError('Failed to save profile');
    }
  }, []);

  const saveSamples = useCallback((newSamples) => {
    try {
      // Keep only last 50 samples to manage storage
      const trimmedSamples = newSamples.slice(-50);
      localStorage.setItem(SAMPLES_KEY, JSON.stringify(trimmedSamples));
      setSamples(trimmedSamples);
    } catch (err) {
      console.error('Failed to save samples:', err);
    }
  }, []);

  /**
   * Add a writing sample and optionally train
   */
  const addSample = useCallback((text, source = 'manual', autoTrain = true) => {
    if (!text || text.trim().length < 20) {
      return { success: false, error: 'Text too short (minimum 20 characters)' };
    }

    const newSample = {
      id: `sample_${Date.now()}`,
      text: text.trim(),
      source,
      addedAt: new Date().toISOString(),
      wordCount: text.trim().split(/\s+/).length,
    };

    const updatedSamples = [...samples, newSample];
    saveSamples(updatedSamples);

    if (autoTrain) {
      trainOnSamples([text]);
    }

    return { success: true, sample: newSample };
  }, [samples, saveSamples]);

  /**
   * Train on multiple text samples
   */
  const trainOnSamples = useCallback(async (textSamples) => {
    if (!textSamples || textSamples.length === 0) {
      return { success: false, error: 'No samples provided' };
    }

    setIsTraining(true);
    setError(null);

    try {
      // Simulate processing time for UX
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));

      // Analyze new samples
      const newAnalysis = analyzeWritingStyle(textSamples);

      // Merge with existing profile
      const updatedProfile = mergeProfiles(profile, newAnalysis);
      
      saveProfile(updatedProfile);

      return { 
        success: true, 
        profile: updatedProfile,
        samplesProcessed: textSamples.length,
      };
    } catch (err) {
      console.error('Training failed:', err);
      setError('Training failed');
      return { success: false, error: err.message };
    } finally {
      setIsTraining(false);
    }
  }, [profile, saveProfile]);

  /**
   * Run full training on all stored samples
   */
  const runFullTraining = useCallback(async () => {
    if (samples.length === 0) {
      return { success: false, error: 'No samples to train on' };
    }

    const textSamples = samples.map(s => s.text);
    return trainOnSamples(textSamples);
  }, [samples, trainOnSamples]);

  /**
   * Train from notes (integrates with notes stored in localStorage)
   */
  const trainFromNotes = useCallback(async () => {
    setIsTraining(true);
    setError(null);

    try {
      // Get notes from localStorage (matches NoteStream's note storage)
      const storedNotes = localStorage.getItem('notestream_notes');
      
      if (!storedNotes) {
        setIsTraining(false);
        return { success: false, error: 'No notes found', notesProcessed: 0 };
      }

      const notes = JSON.parse(storedNotes);
      
      if (!Array.isArray(notes) || notes.length === 0) {
        setIsTraining(false);
        return { success: false, error: 'No notes found', notesProcessed: 0 };
      }

      // Extract text content from notes
      const textSamples = notes
        .map(note => note.content || note.text || '')
        .filter(text => text.trim().length >= 20);

      if (textSamples.length === 0) {
        setIsTraining(false);
        return { success: false, error: 'Notes too short to analyze', notesProcessed: 0 };
      }

      // Add notes as samples
      textSamples.forEach(text => {
        addSample(text, 'note', false);
      });

      // Train on all notes
      const result = await trainOnSamples(textSamples);
      
      return {
        ...result,
        notesProcessed: textSamples.length,
      };
    } catch (err) {
      console.error('Training from notes failed:', err);
      setError('Failed to train from notes');
      return { success: false, error: err.message, notesProcessed: 0 };
    }
  }, [addSample, trainOnSamples]);

  /**
   * Update user overrides
   */
  const updateOverrides = useCallback((overrides) => {
    const updatedProfile = {
      ...profile,
      userOverrides: {
        ...profile.userOverrides,
        ...overrides,
      },
    };
    saveProfile(updatedProfile);
    return { success: true, profile: updatedProfile };
  }, [profile, saveProfile]);

  /**
   * Toggle training settings
   */
  const updateTrainingSettings = useCallback((settings) => {
    const updatedProfile = {
      ...profile,
      settings: {
        ...profile.settings,
        ...settings,
      },
    };
    saveProfile(updatedProfile);
    return { success: true };
  }, [profile, saveProfile]);

  /**
   * Reset profile to defaults
   */
  const resetProfile = useCallback(() => {
    const defaultProfile = getDefaultProfile();
    saveProfile(defaultProfile);
    saveSamples([]);
    return { success: true };
  }, [saveProfile, saveSamples]);

  /**
   * Delete a specific sample
   */
  const deleteSample = useCallback((sampleId) => {
    const updatedSamples = samples.filter(s => s.id !== sampleId);
    saveSamples(updatedSamples);
    return { success: true };
  }, [samples, saveSamples]);

  /**
   * Export profile as JSON
   */
  const exportProfile = useCallback(() => {
    return {
      profile,
      samples,
      exportedAt: new Date().toISOString(),
      version: '1.0',
    };
  }, [profile, samples]);

  /**
   * Import profile from JSON
   */
  const importProfile = useCallback((data) => {
    try {
      if (data.profile) {
        saveProfile(data.profile);
      }
      if (data.samples) {
        saveSamples(data.samples);
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Invalid import data' };
    }
  }, [saveProfile, saveSamples]);

  /**
   * Get the generated style prompt for AI
   */
  const getStylePrompt = useCallback(() => {
    return generateStylePrompt(profile);
  }, [profile]);

  /**
   * Check if profile has enough data for personalization
   */
  const isReady = profile && profile.training.confidence >= 20;

  /**
   * Get training status
   */
  const trainingStatus = {
    isReady,
    confidence: profile?.training.confidence || 0,
    samplesCount: profile?.training.samplesAnalyzed || 0,
    tokensCount: profile?.training.totalTokens || 0,
    lastTrainedAt: profile?.training.lastTrainedAt,
  };

  return {
    // State
    profile,
    samples,
    isLoading,
    isTraining,
    error,
    isReady,
    trainingStatus,

    // Actions
    addSample,
    trainOnSamples,
    runFullTraining,
    trainFromNotes,
    updateOverrides,
    updateTrainingSettings,
    resetProfile,
    deleteSample,
    exportProfile,
    importProfile,
    getStylePrompt,
    loadProfile,
  };
}

export default useStyleProfile;