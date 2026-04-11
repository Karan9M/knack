import type { ImageStyle, LearningMode, SessionLength } from '@/types'

/** Shared copy for onboarding quiz and learning-preferences settings. */
export const LEARNING_PREFERENCE_SECTIONS = [
  {
    id: 'imageStyle' as const,
    title: 'What visual style speaks to you?',
    subtitle: "We'll illustrate every technique in your preferred style.",
    options: [
      {
        value: 'illustrations' as ImageStyle,
        label: 'Illustrations',
        icon: '🎨',
        desc: 'Clean vector art',
      },
      {
        value: 'cartoons' as ImageStyle,
        label: 'Cartoons',
        icon: '🎭',
        desc: 'Playful & colorful',
      },
      { value: 'ghibli' as ImageStyle, label: 'Ghibli', icon: '🌸', desc: 'Painterly & soft' },
      { value: 'diagrams' as ImageStyle, label: 'Diagrams', icon: '📐', desc: 'Clear & technical' },
      {
        value: 'flowcharts' as ImageStyle,
        label: 'Flowcharts',
        icon: '🔀',
        desc: 'Structured & minimal',
      },
    ],
  },
  {
    id: 'learningMode' as const,
    title: 'How do you learn best?',
    subtitle: "We'll tailor your content mix to match your style.",
    options: [
      {
        value: 'videos' as LearningMode,
        label: 'Watch & observe',
        icon: '🎬',
        desc: 'Video tutorials',
      },
      {
        value: 'reading' as LearningMode,
        label: 'Read & reflect',
        icon: '📚',
        desc: 'Written guides',
      },
      { value: 'hands-on' as LearningMode, label: 'Hands-on', icon: '🛠️', desc: 'Direct practice' },
      {
        value: 'mixed' as LearningMode,
        label: 'Mix it all',
        icon: '🔄',
        desc: 'A bit of everything',
      },
    ],
  },
  {
    id: 'sessionLength' as const,
    title: 'How long are your practice sessions?',
    subtitle: "We'll estimate realistic hours for each technique.",
    options: [
      { value: 'quick' as SessionLength, label: 'Quick bursts', icon: '⚡', desc: '15 – 20 min' },
      {
        value: 'regular' as SessionLength,
        label: 'Focused sessions',
        icon: '🎯',
        desc: '30 – 45 min',
      },
      { value: 'deep' as SessionLength, label: 'Deep work', icon: '🔬', desc: '1 – 2 hours' },
    ],
  },
] as const
