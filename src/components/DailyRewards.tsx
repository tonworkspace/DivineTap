import React, { useState, useEffect, useCallback } from 'react';
import { useGameContext } from '@/contexts/GameContext';
import { useNotificationSystem } from './NotificationSystem';
import { useAuth } from '@/hooks/useAuth';
import './DailyRewards.css';

interface SpiritualTask {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'meditation' | 'chakra' | 'elemental' | 'cosmic' | 'mastery';
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'master';
  gemReward: number;
  experienceReward: number;
  requirements: {
    minLevel?: number;
    previousTask?: string;
    chakraLevel?: number;
  };
  progress: number;
  maxProgress: number;
  completed: boolean;
  completedAt?: number;
  // Enhanced educational fields
  instructions: string[];
  duration: number; // in minutes
  benefits: string[];
  tips: string[];
  scientificBackground?: string;
  relatedChakras?: string[];
  materials?: string[];
  environment?: string;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'anytime';
  weather?: 'indoor' | 'outdoor' | 'any';
}

interface DailyStreak {
  current: number;
  max: number;
  lastClaim: number;
  totalClaimed: number;
  consecutiveDays: number;
  totalDays: number;
  streakProtection: number;
  vipLevel: number;
  achievements: string[];
  lastMissedDay: number;
  bonusMultiplier: number;
  specialRewards: string[];
  spiritualLevel: number;
  chakraProgress: {
    root: number;
    sacral: number;
    solar: number;
    heart: number;
    throat: number;
    thirdEye: number;
    crown: number;
  };
  completedTasks: string[];
  dailyTaskProgress: number;
  weeklyGoal: number;
  monthlyGoal: number;
  lastDailyReset: string; // Add this field for daily reset tracking
  lastTaskReset: number; // Add this field for task reset tracking
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  reward: {
    points: number;
    gems: number;
    bonus: string;
  };
  condition: (streak: DailyStreak) => boolean;
}

// Spiritual Tasks System
const SPIRITUAL_TASKS: SpiritualTask[] = [
  // Meditation Tasks
  {
    id: 'morning-meditation',
    name: 'Morning Meditation',
    description: 'Begin your day with 10 minutes of mindful meditation to set positive intentions',
    icon: '🧘‍♀️',
    category: 'meditation',
    difficulty: 'beginner',
    gemReward: 5,
    experienceReward: 50,
    requirements: {},
    progress: 0,
    maxProgress: 1,
    completed: false,
    instructions: [
      'Find a quiet, comfortable space where you won\'t be disturbed',
      'Sit cross-legged on a cushion or chair with your back straight',
      'Close your eyes and take 3 deep breaths to center yourself',
      'Focus on your natural breath - inhale and exhale slowly',
      'When your mind wanders, gently bring it back to your breath',
      'Continue for 10 minutes, maintaining gentle awareness'
    ],
    duration: 10,
    benefits: [
      'Reduces stress and anxiety',
      'Improves focus and concentration',
      'Enhances emotional regulation',
      'Promotes better sleep quality',
      'Increases self-awareness'
    ],
    tips: [
      'Start with just 5 minutes if 10 feels too long',
      'Use a meditation app timer with gentle bells',
      'Don\'t judge yourself if your mind wanders - this is normal',
      'Try to meditate at the same time each day'
    ],
    scientificBackground: 'Research shows morning meditation activates the prefrontal cortex, improving decision-making and emotional control throughout the day.',
    relatedChakras: ['crown', 'third-eye'],
    materials: ['Meditation cushion or comfortable chair', 'Timer or meditation app'],
    environment: 'Quiet indoor space',
    timeOfDay: 'morning',
    weather: 'indoor'
  },
  {
    id: 'breathing-exercise',
    name: 'Breathing Exercise',
    description: 'Practice deep breathing for 5 minutes to activate your parasympathetic nervous system',
    icon: '🫁',
    category: 'meditation',
    difficulty: 'beginner',
    gemReward: 3,
    experienceReward: 30,
    requirements: {},
    progress: 0,
    maxProgress: 1,
    completed: false,
    instructions: [
      'Sit comfortably with your back straight and shoulders relaxed',
      'Place one hand on your chest and the other on your belly',
      'Inhale deeply through your nose for 4 counts, feeling your belly expand',
      'Hold your breath for 4 counts',
      'Exhale slowly through your mouth for 6 counts',
      'Repeat this 4-4-6 breathing pattern for 5 minutes'
    ],
    duration: 5,
    benefits: [
      'Activates the parasympathetic nervous system',
      'Reduces cortisol levels',
      'Improves oxygen flow to the brain',
      'Calms the mind and body',
      'Enhances focus and clarity'
    ],
    tips: [
      'Start with just 2-3 minutes if 5 feels too long',
      'Focus on the sensation of air entering and leaving your body',
      'If you feel lightheaded, return to normal breathing',
      'Practice this technique whenever you feel stressed'
    ],
    scientificBackground: 'Deep breathing activates the vagus nerve, which triggers the parasympathetic nervous system, reducing stress hormones and promoting relaxation.',
    relatedChakras: ['root', 'heart'],
    materials: ['Comfortable chair or cushion'],
    environment: 'Any quiet space',
    timeOfDay: 'anytime',
    weather: 'indoor'
  },
  {
    id: 'mindful-walking',
    name: 'Mindful Walking',
    description: 'Take a 15-minute mindful walk in nature to connect with the present moment',
    icon: '🚶‍♀️',
    category: 'meditation',
    difficulty: 'intermediate',
    gemReward: 8,
    experienceReward: 80,
    requirements: { minLevel: 5 },
    progress: 0,
    maxProgress: 1,
    completed: false,
    instructions: [
      'Choose a natural setting like a park, forest, or garden',
      'Walk at a slower pace than usual, about half your normal speed',
      'Focus on the sensation of your feet touching the ground',
      'Notice the rhythm of your breath as you walk',
      'Observe the sights, sounds, and smells around you without judgment',
      'If your mind wanders, gently bring it back to your walking experience',
      'Continue for 15 minutes, maintaining awareness of each step'
    ],
    duration: 15,
    benefits: [
      'Reduces stress and anxiety',
      'Improves mood and emotional well-being',
      'Enhances connection with nature',
      'Increases mindfulness and present-moment awareness',
      'Provides gentle exercise and fresh air'
    ],
    tips: [
      'Choose a familiar route to avoid getting lost',
      'Walk alone to minimize distractions',
      'Turn off your phone or put it on silent',
      'Dress appropriately for the weather',
      'Focus on one sense at a time (sight, sound, touch)'
    ],
    scientificBackground: 'Mindful walking combines the benefits of exercise with meditation, reducing cortisol levels and increasing endorphins while improving cognitive function.',
    relatedChakras: ['root', 'sacral'],
    materials: ['Comfortable walking shoes', 'Weather-appropriate clothing'],
    environment: 'Natural outdoor setting',
    timeOfDay: 'anytime',
    weather: 'outdoor'
  },
  {
    id: 'zen-garden',
    name: 'Zen Garden Creation',
    description: 'Create or tend to a small zen garden space to cultivate mindfulness and inner peace',
    icon: '🏮',
    category: 'meditation',
    difficulty: 'advanced',
    gemReward: 15,
    experienceReward: 150,
    requirements: { minLevel: 10 },
    progress: 0,
    maxProgress: 1,
    completed: false,
    instructions: [
      'Choose a small space (desktop, windowsill, or corner of a room)',
      'Gather natural materials: sand, small stones, moss, or miniature plants',
      'Create a simple design with clean lines and minimal elements',
      'Use a small rake or stick to create patterns in the sand',
      'Place stones strategically to represent mountains or islands',
      'Add a small plant or moss for life energy',
      'Spend 20 minutes arranging and tending to your garden mindfully'
    ],
    duration: 20,
    benefits: [
      'Promotes mindfulness and concentration',
      'Reduces stress and anxiety',
      'Enhances creativity and artistic expression',
      'Creates a peaceful sanctuary space',
      'Teaches patience and attention to detail'
    ],
    tips: [
      'Start with a simple design - less is more in zen gardens',
      'Use natural materials whenever possible',
      'Change the sand patterns regularly for variety',
      'Keep your garden in a quiet, undisturbed location',
      'Tend to it daily for maximum benefit'
    ],
    scientificBackground: 'Creating and tending to zen gardens activates the brain\'s default mode network, promoting creative thinking and reducing stress through focused attention.',
    relatedChakras: ['third-eye', 'crown'],
    materials: ['Shallow container or tray', 'Fine sand or gravel', 'Small stones', 'Miniature rake or stick', 'Optional: small plants or moss'],
    environment: 'Indoor or outdoor quiet space',
    timeOfDay: 'anytime',
    weather: 'indoor'
  },

  // Chakra Tasks
  {
    id: 'root-chakra-activation',
    name: 'Root Chakra Activation',
    description: 'Ground yourself and activate your root chakra for stability and security',
    icon: '🔴',
    category: 'chakra',
    difficulty: 'beginner',
    gemReward: 10,
    experienceReward: 100,
    requirements: {},
    progress: 0,
    maxProgress: 1,
    completed: false,
    instructions: [
      'Find a quiet space and sit comfortably with your feet flat on the ground',
      'Close your eyes and take 3 deep breaths to center yourself',
      'Visualize a red light at the base of your spine (tailbone area)',
      'Feel the energy of this red light growing stronger with each breath',
      'Imagine roots growing from your feet deep into the earth',
      'Feel the earth\'s energy flowing up through these roots into your body',
      'Focus on feelings of safety, security, and being grounded',
      'Continue this visualization for 10 minutes'
    ],
    duration: 10,
    benefits: [
      'Increases feelings of safety and security',
      'Reduces anxiety and fear',
      'Improves physical energy and vitality',
      'Enhances connection to the physical world',
      'Promotes stability and grounding'
    ],
    tips: [
      'Practice barefoot on grass or earth for enhanced grounding',
      'Use red crystals like garnet or red jasper if available',
      'Focus on the physical sensations in your lower body',
      'If you feel ungrounded, this practice is especially beneficial',
      'Combine with deep breathing for maximum effect'
    ],
    scientificBackground: 'The root chakra corresponds to the sacral plexus and is associated with the fight-or-flight response. Activating it can reduce cortisol levels and promote feelings of safety.',
    relatedChakras: ['root'],
    materials: ['Comfortable cushion or chair', 'Optional: red crystals or stones'],
    environment: 'Quiet indoor or outdoor space',
    timeOfDay: 'morning',
    weather: 'any'
  },
  {
    id: 'sacral-chakra-balance',
    name: 'Sacral Chakra Balance',
    description: 'Balance your sacral chakra through creative expression and emotional awareness',
    icon: '🟠',
    category: 'chakra',
    difficulty: 'intermediate',
    gemReward: 12,
    experienceReward: 120,
    requirements: { previousTask: 'root-chakra-activation' },
    progress: 0,
    maxProgress: 1,
    completed: false,
    instructions: [
      'Find a comfortable space where you can be creative',
      'Close your eyes and visualize an orange light in your lower abdomen',
      'Focus on your emotions and creative energy',
      'Express yourself through drawing, writing, or movement',
      'Allow your emotions to flow freely without judgment',
      'Feel the orange energy expanding and balancing',
      'Continue for 15 minutes, focusing on creative expression'
    ],
    duration: 15,
    benefits: [
      'Enhances creativity and artistic expression',
      'Improves emotional balance and awareness',
      'Increases passion and joy in life',
      'Strengthens relationships and intimacy',
      'Promotes healthy sexuality and sensuality'
    ],
    tips: [
      'Use orange crystals like carnelian or orange calcite',
      'Listen to music that inspires creativity',
      'Don\'t judge your creative output - focus on the process',
      'Practice this when you feel emotionally blocked',
      'Combine with gentle hip-opening yoga poses'
    ],
    scientificBackground: 'The sacral chakra corresponds to the reproductive organs and is associated with creativity, emotions, and pleasure. Balancing it can improve emotional regulation and creative thinking.',
    relatedChakras: ['sacral'],
    materials: ['Art supplies (optional)', 'Comfortable space', 'Optional: orange crystals'],
    environment: 'Private, comfortable space',
    timeOfDay: 'afternoon',
    weather: 'indoor'
  },
  {
    id: 'solar-plexus-power',
    name: 'Solar Plexus Power',
    description: 'Strengthen your solar plexus chakra for confidence and personal power',
    icon: '🟡',
    category: 'chakra',
    difficulty: 'intermediate',
    gemReward: 15,
    experienceReward: 150,
    requirements: { previousTask: 'sacral-chakra-balance' },
    progress: 0,
    maxProgress: 1,
    completed: false,
    instructions: [
      'Sit in a comfortable position with your back straight',
      'Place your hands on your solar plexus (upper abdomen)',
      'Visualize a bright yellow light in this area',
      'Take deep breaths, feeling the yellow energy expand',
      'Repeat positive affirmations about your personal power',
      'Feel confidence and strength building within you',
      'Continue this practice for 12 minutes'
    ],
    duration: 12,
    benefits: [
      'Increases self-confidence and self-esteem',
      'Improves decision-making abilities',
      'Enhances personal power and willpower',
      'Reduces anxiety and self-doubt',
      'Strengthens digestive system'
    ],
    tips: [
      'Use yellow crystals like citrine or yellow topaz',
      'Practice power poses before starting',
      'Repeat affirmations like "I am confident and powerful"',
      'Focus on your core strength and stability',
      'Practice this before important meetings or decisions'
    ],
    scientificBackground: 'The solar plexus chakra corresponds to the celiac plexus and is associated with confidence and personal power. Activating it can improve self-esteem and reduce anxiety.',
    relatedChakras: ['solar'],
    materials: ['Comfortable cushion or chair', 'Optional: yellow crystals'],
    environment: 'Quiet, private space',
    timeOfDay: 'morning',
    weather: 'indoor'
  },
  {
    id: 'heart-chakra-opening',
    name: 'Heart Chakra Opening',
    description: 'Open your heart chakra through compassion meditation and love awareness',
    icon: '🟢',
    category: 'chakra',
    difficulty: 'advanced',
    gemReward: 20,
    experienceReward: 200,
    requirements: { previousTask: 'solar-plexus-power' },
    progress: 0,
    maxProgress: 1,
    completed: false,
    instructions: [
      'Sit comfortably and place your hands over your heart center',
      'Visualize a bright green light in your chest area',
      'Focus on feelings of love, compassion, and forgiveness',
      'Send love to yourself, then to others in your life',
      'Practice loving-kindness meditation',
      'Feel your heart expanding with unconditional love',
      'Continue this practice for 20 minutes'
    ],
    duration: 20,
    benefits: [
      'Increases compassion and empathy',
      'Improves relationships and connection',
      'Reduces anger and resentment',
      'Enhances emotional healing',
      'Promotes forgiveness and acceptance'
    ],
    tips: [
      'Use green crystals like rose quartz or green aventurine',
      'Practice this when you feel disconnected from others',
      'Focus on breathing love in and out',
      'Start with self-love before extending to others',
      'Combine with gentle heart-opening yoga poses'
    ],
    scientificBackground: 'The heart chakra corresponds to the cardiac plexus and is associated with love and compassion. Opening it can improve emotional well-being and social connections.',
    relatedChakras: ['heart'],
    materials: ['Comfortable cushion or chair', 'Optional: green or pink crystals'],
    environment: 'Peaceful, quiet space',
    timeOfDay: 'evening',
    weather: 'indoor'
  },

  // Elemental Tasks
  {
    id: 'earth-connection',
    name: 'Earth Connection',
    description: 'Connect with earth element through grounding exercises and nature awareness',
    icon: '🌍',
    category: 'elemental',
    difficulty: 'beginner',
    gemReward: 8,
    experienceReward: 80,
    requirements: {},
    progress: 0,
    maxProgress: 1,
    completed: false,
    instructions: [
      'Find a natural outdoor setting (park, garden, or forest)',
      'Remove your shoes and stand barefoot on the earth',
      'Feel the texture and temperature of the ground beneath you',
      'Take deep breaths and imagine roots growing from your feet',
      'Feel the earth\'s energy flowing up through your body',
      'Observe the natural elements around you',
      'Continue this practice for 10 minutes'
    ],
    duration: 10,
    benefits: [
      'Reduces stress and anxiety',
      'Improves balance and stability',
      'Enhances connection to nature',
      'Increases feelings of security',
      'Promotes physical grounding'
    ],
    tips: [
      'Choose a safe, clean area for barefoot practice',
      'Practice in different weather conditions',
      'Focus on the sensations in your feet',
      'Combine with tree-hugging for enhanced connection',
      'Practice this when you feel scattered or anxious'
    ],
    scientificBackground: 'Grounding (earthing) has been shown to reduce inflammation, improve sleep, and reduce stress by connecting with the earth\'s natural electrical charge.',
    relatedChakras: ['root'],
    materials: ['Access to natural outdoor space'],
    environment: 'Natural outdoor setting',
    timeOfDay: 'anytime',
    weather: 'outdoor'
  },
  {
    id: 'water-flow',
    name: 'Water Flow',
    description: 'Embrace water element through fluid movement and emotional flow',
    icon: '💧',
    category: 'elemental',
    difficulty: 'intermediate',
    gemReward: 12,
    experienceReward: 120,
    requirements: { minLevel: 8 },
    progress: 0,
    maxProgress: 1,
    completed: false,
    instructions: [
      'Find a quiet space where you can move freely',
      'Stand with your feet shoulder-width apart',
      'Begin gentle, flowing movements with your arms',
      'Imagine you are moving through water',
      'Let your body flow naturally without rigid movements',
      'Focus on the fluidity and grace of water',
      'Continue this practice for 15 minutes'
    ],
    duration: 15,
    benefits: [
      'Improves flexibility and fluid movement',
      'Enhances emotional flow and expression',
      'Reduces tension and rigidity',
      'Promotes adaptability and change',
      'Increases grace and elegance'
    ],
    tips: [
      'Practice near water if possible (lake, river, ocean)',
      'Use blue crystals like aquamarine or blue lace agate',
      'Listen to flowing water sounds',
      'Don\'t force movements - let them flow naturally',
      'Practice this when you feel emotionally stuck'
    ],
    scientificBackground: 'Fluid movement practices activate the parasympathetic nervous system and improve proprioception, enhancing emotional regulation and physical coordination.',
    relatedChakras: ['sacral', 'throat'],
    materials: ['Comfortable clothing', 'Optional: blue crystals'],
    environment: 'Quiet space with room to move',
    timeOfDay: 'afternoon',
    weather: 'indoor'
  },
  {
    id: 'fire-transformation',
    name: 'Fire Transformation',
    description: 'Harness fire element for personal transformation and inner strength',
    icon: '🔥',
    category: 'elemental',
    difficulty: 'advanced',
    gemReward: 18,
    experienceReward: 180,
    requirements: { minLevel: 15 },
    progress: 0,
    maxProgress: 1,
    completed: false,
    instructions: [
      'Find a safe space where you can light a candle',
      'Sit comfortably and focus on the flame',
      'Visualize fire energy within your solar plexus',
      'Feel the warmth and power of transformation',
      'Imagine burning away old patterns and limitations',
      'Embrace the energy of change and renewal',
      'Continue this practice for 20 minutes'
    ],
    duration: 20,
    benefits: [
      'Increases personal power and confidence',
      'Promotes transformation and change',
      'Enhances willpower and determination',
      'Burns away negative patterns',
      'Ignites passion and motivation'
    ],
    tips: [
      'Use red or orange crystals like ruby or carnelian',
      'Practice during sunset for enhanced fire energy',
      'Focus on the transformative power of fire',
      'Be mindful of fire safety',
      'Practice this when you need motivation or change'
    ],
    scientificBackground: 'Fire meditation activates the sympathetic nervous system and increases metabolic rate, promoting energy, focus, and the courage to make changes.',
    relatedChakras: ['solar'],
    materials: ['Candle and matches', 'Fire-safe container', 'Optional: red/orange crystals'],
    environment: 'Safe indoor space',
    timeOfDay: 'evening',
    weather: 'indoor'
  },
  {
    id: 'air-freedom',
    name: 'Air Freedom',
    description: 'Embrace air element for mental clarity and spiritual freedom',
    icon: '💨',
    category: 'elemental',
    difficulty: 'master',
    gemReward: 25,
    experienceReward: 250,
    requirements: { minLevel: 20 },
    progress: 0,
    maxProgress: 1,
    completed: false,
    instructions: [
      'Find an open space with fresh air (outdoor preferred)',
      'Stand with your arms open wide',
      'Take deep breaths, feeling the air fill your lungs',
      'Visualize your thoughts as clouds passing by',
      'Feel the freedom and expansiveness of air',
      'Let go of mental limitations and restrictions',
      'Continue this practice for 25 minutes'
    ],
    duration: 25,
    benefits: [
      'Enhances mental clarity and focus',
      'Promotes spiritual freedom and expansion',
      'Improves communication and expression',
      'Reduces mental fog and confusion',
      'Increases inspiration and creativity'
    ],
    tips: [
      'Practice on a windy day for enhanced air energy',
      'Use clear crystals like clear quartz or selenite',
      'Focus on the breath and mental clarity',
      'Practice this when you feel mentally stuck',
      'Combine with pranayama breathing techniques'
    ],
    scientificBackground: 'Air element practices improve oxygen flow to the brain, enhancing cognitive function, creativity, and mental clarity while reducing stress and anxiety.',
    relatedChakras: ['throat', 'third-eye'],
    materials: ['Access to fresh air', 'Optional: clear crystals'],
    environment: 'Outdoor space with fresh air',
    timeOfDay: 'morning',
    weather: 'outdoor'
  },

  // Cosmic Tasks
  {
    id: 'moon-phase-alignment',
    name: 'Moon Phase Alignment',
    description: 'Align your energy with the current moon phase for enhanced spiritual connection',
    icon: '🌙',
    category: 'cosmic',
    difficulty: 'intermediate',
    gemReward: 15,
    experienceReward: 150,
    requirements: { minLevel: 12 },
    progress: 0,
    maxProgress: 1,
    completed: false,
    instructions: [
      'Check the current moon phase (new, waxing, full, or waning)',
      'Find a quiet space where you can see the moon if possible',
      'Sit comfortably and close your eyes',
      'Visualize the moon\'s energy flowing into your body',
      'Align your intentions with the moon\'s current phase',
      'Feel the cosmic connection and lunar energy',
      'Continue this practice for 15 minutes'
    ],
    duration: 15,
    benefits: [
      'Enhances spiritual intuition and awareness',
      'Improves emotional balance and cycles',
      'Strengthens connection to natural rhythms',
      'Increases psychic sensitivity',
      'Promotes inner reflection and wisdom'
    ],
    tips: [
      'Practice during the actual moon phase for best results',
      'Use moonstone or selenite crystals',
      'Keep a moon phase journal to track your experiences',
      'Practice this during full moon for maximum energy',
      'Combine with lunar breathing techniques'
    ],
    scientificBackground: 'Moon phases affect human behavior and emotions through gravitational forces and light exposure, influencing circadian rhythms and hormonal cycles.',
    relatedChakras: ['third-eye', 'crown'],
    materials: ['Moon phase calendar', 'Optional: moonstone or selenite'],
    environment: 'Quiet space, preferably with moon visibility',
    timeOfDay: 'evening',
    weather: 'any'
  },
  {
    id: 'star-gazing',
    name: 'Star Gazing',
    description: 'Spend time under the stars for cosmic connection and universal awareness',
    icon: '⭐',
    category: 'cosmic',
    difficulty: 'intermediate',
    gemReward: 12,
    experienceReward: 120,
    requirements: { minLevel: 10 },
    progress: 0,
    maxProgress: 1,
    completed: false,
    instructions: [
      'Find a clear, dark location away from city lights',
      'Lie down comfortably on a blanket or reclining chair',
      'Allow your eyes to adjust to the darkness (10-15 minutes)',
      'Gaze at the stars without focusing on any particular one',
      'Feel the vastness and infinite nature of the universe',
      'Contemplate your place in the cosmic order',
      'Continue this practice for 20 minutes'
    ],
    duration: 20,
    benefits: [
      'Enhances cosmic awareness and perspective',
      'Reduces stress and promotes relaxation',
      'Improves night vision and visual perception',
      'Increases sense of wonder and awe',
      'Promotes deep philosophical contemplation'
    ],
    tips: [
      'Check weather conditions for clear skies',
      'Use a star map app to identify constellations',
      'Bring warm clothing for comfort',
      'Practice during new moon for best star visibility',
      'Allow time for your eyes to fully adjust to darkness'
    ],
    scientificBackground: 'Star gazing activates the default mode network in the brain, promoting creative thinking, problem-solving, and a sense of awe that reduces stress and improves well-being.',
    relatedChakras: ['third-eye', 'crown'],
    materials: ['Blanket or reclining chair', 'Warm clothing', 'Optional: star map'],
    environment: 'Dark outdoor location',
    timeOfDay: 'evening',
    weather: 'outdoor'
  },
  {
    id: 'cosmic-meditation',
    name: 'Cosmic Meditation',
    description: 'Meditate on the vastness of the universe and your cosmic connection',
    icon: '🌌',
    category: 'cosmic',
    difficulty: 'advanced',
    gemReward: 20,
    experienceReward: 200,
    requirements: { minLevel: 18 },
    progress: 0,
    maxProgress: 1,
    completed: false,
    instructions: [
      'Find a quiet, dark space where you won\'t be disturbed',
      'Sit in a comfortable meditation position',
      'Close your eyes and take several deep breaths',
      'Visualize yourself floating in the vastness of space',
      'Feel the infinite expanse of the universe around you',
      'Contemplate the interconnectedness of all things',
      'Continue this meditation for 30 minutes'
    ],
    duration: 30,
    benefits: [
      'Expands consciousness and awareness',
      'Promotes deep spiritual insight',
      'Enhances cosmic perspective and understanding',
      'Reduces ego and personal limitations',
      'Increases sense of universal connection'
    ],
    tips: [
      'Practice after star gazing for enhanced effect',
      'Use cosmic imagery or space sounds',
      'Allow thoughts to come and go like stars',
      'Focus on the feeling of infinite space',
      'Practice this when you need perspective on life'
    ],
    scientificBackground: 'Cosmic meditation activates the default mode network and promotes transcendent experiences, leading to increased creativity, problem-solving abilities, and reduced stress.',
    relatedChakras: ['crown'],
    materials: ['Comfortable meditation cushion', 'Optional: space sounds or imagery'],
    environment: 'Dark, quiet space',
    timeOfDay: 'evening',
    weather: 'indoor'
  },

  // Mastery Tasks
  {
    id: 'energy-healing',
    name: 'Energy Healing',
    description: 'Practice energy healing on yourself or others to restore balance and promote healing',
    icon: '✨',
    category: 'mastery',
    difficulty: 'advanced',
    gemReward: 25,
    experienceReward: 250,
    requirements: { minLevel: 25 },
    progress: 0,
    maxProgress: 1,
    completed: false,
    instructions: [
      'Find a quiet, comfortable space where you won\'t be disturbed',
      'Sit or lie down in a relaxed position',
      'Close your eyes and take several deep breaths to center yourself',
      'Place your hands over the area that needs healing (or use visualization)',
      'Visualize healing light flowing from your hands into the area',
      'Feel the energy moving and transforming negative energy into positive',
      'Continue this practice for 30 minutes, maintaining focused intention',
      'When finished, ground yourself and express gratitude for the healing'
    ],
    duration: 30,
    benefits: [
      'Promotes physical and emotional healing',
      'Reduces pain and inflammation',
      'Improves energy flow and vitality',
      'Enhances spiritual connection and intuition',
      'Strengthens the body\'s natural healing abilities'
    ],
    tips: [
      'Start with self-healing before working on others',
      'Use crystals like clear quartz or amethyst to amplify energy',
      'Trust your intuition about where healing is needed',
      'Practice regularly to strengthen your healing abilities',
      'Always ask permission before healing others'
    ],
    scientificBackground: 'Energy healing practices may work through the placebo effect, relaxation response, and the body\'s natural healing mechanisms, reducing stress hormones and promoting parasympathetic nervous system activation.',
    relatedChakras: ['heart', 'crown'],
    materials: ['Comfortable space', 'Optional: healing crystals'],
    environment: 'Quiet, peaceful space',
    timeOfDay: 'anytime',
    weather: 'indoor'
  },
  {
    id: 'spiritual-teaching',
    name: 'Spiritual Teaching',
    description: 'Share spiritual wisdom with someone in need to help them on their journey',
    icon: '📚',
    category: 'mastery',
    difficulty: 'master',
    gemReward: 30,
    experienceReward: 300,
    requirements: { minLevel: 30 },
    progress: 0,
    maxProgress: 1,
    completed: false,
    instructions: [
      'Identify someone who is seeking spiritual guidance or support',
      'Create a safe, non-judgmental space for the conversation',
      'Listen deeply to their questions or concerns without interrupting',
      'Share relevant spiritual wisdom from your own experience',
      'Offer practical advice and techniques they can use',
      'Encourage them to trust their own intuition and inner wisdom',
      'Provide resources or recommendations for further learning',
      'End with gratitude and offer ongoing support if needed'
    ],
    duration: 45,
    benefits: [
      'Deepens your own spiritual understanding',
      'Strengthens your connection to universal wisdom',
      'Helps others on their spiritual path',
      'Improves communication and empathy skills',
      'Creates meaningful connections and community'
    ],
    tips: [
      'Teach from experience rather than just theory',
      'Adapt your teaching style to the person\'s level',
      'Be humble and acknowledge you\'re also learning',
      'Encourage questions and open dialogue',
      'Respect their beliefs and don\'t force your perspective'
    ],
    scientificBackground: 'Teaching others activates the brain\'s reward system and strengthens neural pathways, while also improving social connection and empathy through mirror neuron activation.',
    relatedChakras: ['throat', 'heart', 'crown'],
    materials: ['Quiet space for conversation', 'Optional: spiritual books or resources'],
    environment: 'Comfortable, private space',
    timeOfDay: 'anytime',
    weather: 'indoor'
  },
  {
    id: 'enlightenment-moment',
    name: 'Enlightenment Moment',
    description: 'Experience a moment of deep spiritual insight and universal understanding',
    icon: '💡',
    category: 'mastery',
    difficulty: 'master',
    gemReward: 50,
    experienceReward: 500,
    requirements: { minLevel: 40 },
    progress: 0,
    maxProgress: 1,
    completed: false,
    instructions: [
      'Find a sacred space where you feel completely safe and undisturbed',
      'Sit in a comfortable meditation position with your back straight',
      'Close your eyes and take several deep, slow breaths',
      'Let go of all thoughts, expectations, and attachments',
      'Surrender to the present moment completely',
      'Allow your consciousness to expand beyond your individual self',
      'Open yourself to receiving divine wisdom and insight',
      'Remain in this state of expanded awareness for as long as possible',
      'When you return, journal your insights and experiences'
    ],
    duration: 60,
    benefits: [
      'Provides profound spiritual insights and understanding',
      'Dissolves ego and personal limitations',
      'Creates lasting positive transformation',
      'Enhances connection to universal consciousness',
      'Brings clarity and purpose to life direction'
    ],
    tips: [
      'Don\'t force or chase enlightenment - let it come naturally',
      'Practice regular meditation to prepare your mind',
      'Be patient - these moments often come unexpectedly',
      'Trust the process and don\'t judge your experiences',
      'Integrate insights into daily life for lasting transformation'
    ],
    scientificBackground: 'Enlightenment experiences activate the default mode network and can create lasting changes in brain structure, particularly in areas associated with self-awareness, empathy, and consciousness.',
    relatedChakras: ['crown', 'third-eye'],
    materials: ['Sacred space', 'Meditation cushion', 'Journal for insights'],
    environment: 'Sacred, undisturbed space',
    timeOfDay: 'evening',
    weather: 'indoor'
  }
];

// Achievement system
const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-week',
    name: 'Week Warrior',
    description: 'Complete spiritual tasks for 7 consecutive days',
    icon: '📅',
    reward: { points: 100, gems: 50, bonus: '+5% permanent mining' },
    condition: (streak) => streak.current >= 7
  },
  {
    id: 'month-master',
    name: 'Month Master',
    description: 'Complete spiritual tasks for 30 consecutive days',
    icon: '🗓️',
    reward: { points: 500, gems: 200, bonus: '+10% permanent mining' },
    condition: (streak) => streak.current >= 30
  },
  {
    id: 'chakra-master',
    name: 'Chakra Master',
    description: 'Complete all chakra-related tasks',
    icon: '🌈',
    reward: { points: 300, gems: 150, bonus: 'Chakra resonance bonus' },
    condition: (streak) => streak.chakraProgress.crown >= 100
  },
  {
    id: 'elemental-harmony',
    name: 'Elemental Harmony',
    description: 'Complete all elemental tasks',
    icon: '⚡',
    reward: { points: 400, gems: 200, bonus: 'Elemental balance bonus' },
    condition: (streak) => streak.completedTasks.filter(id => SPIRITUAL_TASKS.find(t => t.id === id)?.category === 'elemental').length >= 4
  },
  {
    id: 'cosmic-awakening',
    name: 'Cosmic Awakening',
    description: 'Complete all cosmic tasks',
    icon: '🌌',
    reward: { points: 600, gems: 300, bonus: 'Cosmic connection bonus' },
    condition: (streak) => streak.completedTasks.filter(id => SPIRITUAL_TASKS.find(t => t.id === id)?.category === 'cosmic').length >= 3
  }
];


export const DailyRewards: React.FC = () => {
  const { addPoints, addGems, } = useGameContext();
  const { showAchievementNotification } = useNotificationSystem();
  const { user } = useAuth();
  
  // Helper function to get user-specific localStorage keys
  const getUserSpecificKey = (baseKey: string, userId?: string) => {
    if (!userId) return baseKey; // Fallback for non-authenticated users
    return `${baseKey}_${userId}`;
  };
  
  // Helper function to get start of day (midnight) for a given date
  const getStartOfDay = useCallback((timestamp: number) => {
    const date = new Date(timestamp);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  }, []);

  // Helper function to get current day start
  const getCurrentDayStart = useCallback(() => {
    return getStartOfDay(Date.now());
  }, [getStartOfDay]);

  // Helper function to check if daily reset is needed
  const checkDailyReset = useCallback((streak: DailyStreak) => {
    const currentDayStart = getCurrentDayStart();
    const lastResetDayStart = streak.lastTaskReset ? getStartOfDay(streak.lastTaskReset) : 0;
    
    // Reset if it's a new day
    if (currentDayStart > lastResetDayStart) {
      return true;
    }
    return false;
  }, [getCurrentDayStart, getStartOfDay]);

  // Debug function to test daily reset (remove in production)
  const debugDailyReset = useCallback(() => {
    const userId = user?.id ? user.id.toString() : undefined;
    const userStreakKey = getUserSpecificKey('divineMiningStreak', userId);
    const savedStreak = localStorage.getItem(userStreakKey);
    
    if (savedStreak) {
      const parsed = JSON.parse(savedStreak);
      console.log('🔍 Debug Daily Reset:');
      console.log('Current time:', new Date().toLocaleString());
      console.log('Last task reset:', new Date(parsed.lastTaskReset || 0).toLocaleString());
      console.log('Current day start:', new Date(getCurrentDayStart()).toLocaleString());
      console.log('Last reset day start:', new Date(getStartOfDay(parsed.lastTaskReset || 0)).toLocaleString());
      console.log('Reset needed:', checkDailyReset(parsed));
      console.log('Completed tasks:', parsed.completedTasks?.length || 0);
    }
  }, [user?.id, getCurrentDayStart, getStartOfDay, checkDailyReset]);

  const [dailyStreak, setDailyStreak] = useState<DailyStreak>(() => {
    const userId = user?.id ? user.id.toString() : undefined;
    const userStreakKey = getUserSpecificKey('divineMiningStreak', userId);
    const saved = localStorage.getItem(userStreakKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure all new fields exist for backward compatibility
        const streak = {
          current: parsed.current || 0,
          max: parsed.max || 0,
          lastClaim: parsed.lastClaim || 0,
          totalClaimed: parsed.totalClaimed || 0,
          consecutiveDays: parsed.consecutiveDays || 0,
          totalDays: parsed.totalDays || 0,
          streakProtection: parsed.streakProtection || 3,
          vipLevel: parsed.vipLevel || 1,
          achievements: parsed.achievements || [],
          lastMissedDay: parsed.lastMissedDay || 0,
          bonusMultiplier: parsed.bonusMultiplier || 1.0,
          specialRewards: parsed.specialRewards || [],
          spiritualLevel: parsed.spiritualLevel || 1,
          chakraProgress: parsed.chakraProgress || {
            root: 0, sacral: 0, solar: 0, heart: 0, throat: 0, thirdEye: 0, crown: 0
          },
          completedTasks: parsed.completedTasks || [],
          dailyTaskProgress: parsed.dailyTaskProgress || 0,
          weeklyGoal: parsed.weeklyGoal || 0,
          monthlyGoal: parsed.monthlyGoal || 0,
          lastDailyReset: parsed.lastDailyReset || new Date().toDateString(),
          lastTaskReset: parsed.lastTaskReset || Date.now()
        };

        // Check if daily reset is needed
        const currentDayStart = getStartOfDay(Date.now());
        const lastResetDayStart = getStartOfDay(streak.lastTaskReset);
        
        if (currentDayStart > lastResetDayStart) {
          // Reset daily tasks for new day
          console.log('🔄 Daily reset detected - clearing completed tasks');
          return {
            ...streak,
            completedTasks: [],
            dailyTaskProgress: 0,
            lastTaskReset: Date.now()
          };
        }
        
        return streak;
      } catch (error) {
        console.error('Error parsing saved streak data for user:', userId, error);
      }
    }
    return {
      current: 0,
      max: 0,
      lastClaim: 0,
      totalClaimed: 0,
      consecutiveDays: 0,
      totalDays: 0,
      streakProtection: 3,
      vipLevel: 1,
      achievements: [],
      lastMissedDay: 0,
      bonusMultiplier: 1.0,
      specialRewards: [],
      spiritualLevel: 1,
      chakraProgress: {
        root: 0, sacral: 0, solar: 0, heart: 0, throat: 0, thirdEye: 0, crown: 0
      },
      completedTasks: [],
      dailyTaskProgress: 0,
      weeklyGoal: 0,
      monthlyGoal: 0,
      lastDailyReset: new Date().toDateString(),
      lastTaskReset: Date.now()
    };
  });

  const [showResult, setShowResult] = useState(false);
  const [rewardMessage, setRewardMessage] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'meditation' | 'chakra' | 'elemental' | 'cosmic' | 'mastery'>('all');
  const [selectedTask, setSelectedTask] = useState<SpiritualTask | null>(null);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [wizardStep, setWizardStep] = useState(1); // 1 for overview, 2 for preparation, 3 for practice, 4 for completion
  const [practiceTimer, setPracticeTimer] = useState(0); // Timer in seconds
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [currentTaskInProgress, setCurrentTaskInProgress] = useState<string | null>(null);
  const [taskCompleted, setTaskCompleted] = useState(false);

  // // Helper function to get last claim day start
  // const getLastClaimDayStart = useCallback(() => {
  //   return getStartOfDay(dailyStreak.lastClaim);
  // }, [dailyStreak.lastClaim, getStartOfDay]);

  // // Check if daily reward can be claimed (based on calendar days)
  // const canClaimDaily = useCallback(() => {
  //   const currentDayStart = getCurrentDayStart();
  //   const lastClaimDayStart = getLastClaimDayStart();
    
  //   // Can claim if we haven't claimed today yet
  //   return currentDayStart > lastClaimDayStart;
  // }, [getCurrentDayStart, getLastClaimDayStart]);

  // // Get time until next claim (until midnight)
  // const getTimeUntilClaim = useCallback(() => {
  //   if (canClaimDaily()) return 'Ready';
    
  //   const now = Date.now();
  //   const tomorrow = new Date(now);
  //   tomorrow.setDate(tomorrow.getDate() + 1);
  //   tomorrow.setHours(0, 0, 0, 0);
    
  //   const timeLeft = tomorrow.getTime() - now;
    
  //   const hours = Math.floor(timeLeft / (60 * 60 * 1000));
  //   const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
  //   const seconds = Math.floor((timeLeft % (60 * 1000)) / 1000);
    
  //   return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  // }, [canClaimDaily]);

  // Load and save streak data with daily reset check
  useEffect(() => {
    const userId = user?.id ? user.id.toString() : undefined;
    const userStreakKey = getUserSpecificKey('divineMiningStreak', userId);
    const savedStreak = localStorage.getItem(userStreakKey);
    if (savedStreak) {
      try {
        const parsed = JSON.parse(savedStreak);
        const streak = {
          ...parsed,
          lastDailyReset: parsed.lastDailyReset || new Date().toDateString(),
          lastTaskReset: parsed.lastTaskReset || Date.now()
        };

        // Check if daily reset is needed
        if (checkDailyReset(streak)) {
          console.log('🔄 Daily reset detected - clearing completed tasks');
          const resetStreak = {
            ...streak,
            completedTasks: [],
            dailyTaskProgress: 0,
            lastTaskReset: Date.now()
          };
          setDailyStreak(resetStreak);
          localStorage.setItem(userStreakKey, JSON.stringify(resetStreak));
        } else {
          setDailyStreak(streak);
        }
      } catch (error) {
        console.error('Error parsing saved streak data for user:', userId, error);
      }
    }
  }, [user?.id, checkDailyReset]);

  useEffect(() => {
    const userId = user?.id ? user.id.toString() : undefined;
    const userStreakKey = getUserSpecificKey('divineMiningStreak', userId);
    localStorage.setItem(userStreakKey, JSON.stringify(dailyStreak));
  }, [dailyStreak, user?.id]);

  // Real-time countdown
  // useEffect(() => {
  //   const timer = setInterval(() => {
  //     if (!canClaimDaily()) {
  //       setCountdown(getTimeUntilClaim());
  //     } else {
  //       setCountdown('Ready');
  //     }
  //   }, 1000);

  //   return () => clearInterval(timer);
  // }, [canClaimDaily, getTimeUntilClaim]);

  // Practice timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isTimerRunning && practiceTimer > 0) {
      interval = setInterval(() => {
        setPracticeTimer(prev => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            setTaskCompleted(true); // Mark task as completed when timer finishes
            // Play completion sound
            try {
              const audio = new Audio('/sounds/achievement-unlock.mp3');
              audio.volume = 0.5;
              audio.play().catch(() => {
                // Fallback if audio fails
                console.log('Timer completed! 🎉');
              });
            } catch (error) {
              console.log('Timer completed! 🎉');
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, practiceTimer]);

  // Timer functions
  const startTimer = useCallback((durationMinutes: number, taskId: string) => {
    const durationSeconds = durationMinutes * 60;
    setPracticeTimer(durationSeconds);
    setIsTimerRunning(true);
    // setTimerStartTime(Date.now());
    setCurrentTaskInProgress(taskId);
    setTaskCompleted(false);
  }, []);

  const pauseTimer = useCallback(() => {
    setIsTimerRunning(false);
  }, []);

  const resumeTimer = useCallback(() => {
    setIsTimerRunning(true);
  }, []);

  const resetTimer = useCallback((durationMinutes: number) => {
    const durationSeconds = durationMinutes * 60;
    setPracticeTimer(durationSeconds);
    setIsTimerRunning(false);
    // setTimerStartTime(0);
    setTaskCompleted(false);
  }, []);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Get available tasks for today with personalized selection
  const getAvailableTasks = useCallback(() => {
    // Get personalized task selection based on user's spiritual level and progress
    const personalizedTasks = SPIRITUAL_TASKS.filter(task => {
      // Check if task is already completed today
      if (dailyStreak.completedTasks.includes(task.id)) return false;
      
      // Check level requirements
      if (task.requirements.minLevel && dailyStreak.spiritualLevel < task.requirements.minLevel) return false;
      
      // Check previous task requirements
      if (task.requirements.previousTask && !dailyStreak.completedTasks.includes(task.requirements.previousTask)) return false;
      
      return true;
    });

    // Limit to 5-8 tasks per day for better user experience
    const maxTasksPerDay = Math.min(8, Math.max(5, Math.floor(dailyStreak.spiritualLevel / 2) + 3));
    
    // Prioritize tasks based on user's progress and preferences
    const prioritizedTasks = personalizedTasks.sort((a, b) => {
      // Prioritize tasks that match user's current chakra progress
      if (a.category === 'chakra' && b.category !== 'chakra') {
        const chakraMap: { [key: string]: keyof typeof dailyStreak.chakraProgress } = {
          'root-chakra-activation': 'root',
          'sacral-chakra-balance': 'sacral',
          'solar-plexus-power': 'solar',
          'heart-chakra-opening': 'heart'
        };
        const chakraKey = chakraMap[a.id];
        if (chakraKey && dailyStreak.chakraProgress[chakraKey] < 100) {
          return -1;
        }
      }
      
      // Prioritize beginner tasks for new users
      if (dailyStreak.spiritualLevel < 5) {
        if (a.difficulty === 'beginner' && b.difficulty !== 'beginner') return -1;
        if (b.difficulty === 'beginner' && a.difficulty !== 'beginner') return 1;
      }
      
      // Sort by difficulty for balanced progression
      const difficultyOrder = { beginner: 0, intermediate: 1, advanced: 2, master: 3 };
      return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
    });

    return prioritizedTasks.slice(0, maxTasksPerDay);
  }, [dailyStreak.completedTasks, dailyStreak.spiritualLevel, dailyStreak.chakraProgress]);

  // Get filtered tasks based on selected category
  const getFilteredTasks = useCallback(() => {
    const availableTasks = getAvailableTasks();
    if (selectedCategory === 'all') return availableTasks;
    return availableTasks.filter(task => task.category === selectedCategory);
  }, [getAvailableTasks, selectedCategory]);

  // Complete a spiritual task
  const completeTask = useCallback((taskId: string) => {
    const task = SPIRITUAL_TASKS.find(t => t.id === taskId);
    if (!task) return;

    // Add rewards
    addGems(task.gemReward);
    addPoints(task.experienceReward);

    // Update streak data
    setDailyStreak(prev => {
      const newCompletedTasks = [...prev.completedTasks, taskId];
      const newDailyTaskProgress = prev.dailyTaskProgress + 1;
      
      // Update chakra progress if it's a chakra task
      let newChakraProgress = { ...prev.chakraProgress };
      if (task.category === 'chakra') {
        const chakraMap: { [key: string]: keyof typeof newChakraProgress } = {
          'root-chakra-activation': 'root',
          'sacral-chakra-balance': 'sacral',
          'solar-plexus-power': 'solar',
          'heart-chakra-opening': 'heart'
        };
        const chakraKey = chakraMap[taskId];
        if (chakraKey) {
          newChakraProgress[chakraKey] = Math.min(100, newChakraProgress[chakraKey] + 25);
        }
      }

      // Check for level up with better calculation
      const totalExperience = newCompletedTasks.length * 100 + (prev.spiritualLevel - 1) * 1000;
      const newSpiritualLevel = Math.floor(totalExperience / 1000) + 1;

      return {
        ...prev,
        completedTasks: newCompletedTasks,
        dailyTaskProgress: newDailyTaskProgress,
        chakraProgress: newChakraProgress,
        spiritualLevel: newSpiritualLevel
      };
    });

    // Show completion message
    setRewardMessage(`✅ ${task.name} completed! +${task.gemReward} gems, +${task.experienceReward} experience`);
    setShowResult(true);

    // Check for achievements
    setTimeout(() => {
      checkAchievements();
    }, 100);
  }, [addGems, addPoints]);

  // Check for new achievements
  const checkAchievements = useCallback(() => {
    const achievements = dailyStreak.achievements || [];
    const newAchievements = ACHIEVEMENTS.filter(achievement => 
      !achievements.includes(achievement.id) && 
      achievement.condition(dailyStreak)
    );
    
    if (newAchievements.length > 0) {
      newAchievements.forEach(achievement => {
        showAchievementNotification(achievement);
        addPoints(achievement.reward.points);
        addGems(achievement.reward.gems);
      });
      
      setDailyStreak(prev => ({
        ...prev,
        achievements: [...(prev.achievements || []), ...newAchievements.map(a => a.id)]
      }));
    }
  }, [dailyStreak, showAchievementNotification, addPoints, addGems]);

  // // Get unlocked achievements
  // const unlockedAchievements = useMemo(() => {
  //   const achievements = dailyStreak.achievements || [];
  //   return ACHIEVEMENTS.filter(achievement => 
  //     achievements.includes(achievement.id)
  //   );
  // }, [dailyStreak.achievements]);

  // Get category icon
  const getCategoryIcon = (category: string) => {
    const icons = {
      meditation: '🧘‍♀️',
      chakra: '🌈',
      elemental: '⚡',
      cosmic: '🌌',
      mastery: '✨'
    };
    return icons[category as keyof typeof icons] || '📋';
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      beginner: 'text-green-400',
      intermediate: 'text-yellow-400',
      advanced: 'text-orange-400',
      master: 'text-red-400'
    };
    return colors[difficulty as keyof typeof colors] || 'text-gray-400';
  };

  const availableTasks = getFilteredTasks();

  return (
    <div className="flex-1 p-custom space-y-2 overflow-y-auto game-scrollbar">
      {/* User Progress Header */}
      <div className="bg-black/40 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="text-2xl">🌟</div>
            <div>
              <div className="text-white font-mono font-bold text-sm tracking-wider">
                Spiritual Level {dailyStreak.spiritualLevel}
              </div>
              <div className="text-gray-400 font-mono text-xs">
                {dailyStreak.dailyTaskProgress} tasks completed today
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-purple-400 font-mono font-bold text-sm">
              {dailyStreak.completedTasks.length} total completed
            </div>
            <div className="text-yellow-400 font-mono text-xs">
              {dailyStreak.consecutiveDays} day streak
            </div>
            {/* Debug button - remove in production */}
            <button
              onClick={debugDailyReset}
              className="ml-2 px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
              title="Debug Daily Reset"
            >
              🐛
            </button>
          </div>
        </div>
        
        {/* Chakra Progress Bar */}
        <div className="space-y-2">
          <div className="text-gray-400 font-mono text-xs">Chakra Progress</div>
          <div className="grid grid-cols-7 gap-1">
            {Object.entries(dailyStreak.chakraProgress).map(([chakra, progress]) => (
              <div key={chakra} className="text-center">
                <div className="text-xs font-mono text-gray-400 capitalize">{chakra}</div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <div className="text-xs font-mono text-gray-500">{progress}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-2 overflow-x-auto">
        {[
          { id: 'all', name: 'All Tasks', icon: '📋' },
          { id: 'meditation', name: 'Meditation', icon: '🧘‍♀️' },
          { id: 'chakra', name: 'Chakra', icon: '🌈' },
          { id: 'elemental', name: 'Elemental', icon: '⚡' },
          { id: 'cosmic', name: 'Cosmic', icon: '🌌' },
          { id: 'mastery', name: 'Mastery', icon: '✨' }
        ].map(category => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id as any)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-mono font-bold text-xs tracking-wider transition-all duration-300 border whitespace-nowrap ${
              selectedCategory === category.id
                ? 'bg-cyan-600 text-white border-cyan-400'
                : 'bg-gray-800/50 text-gray-300 border-gray-600 hover:bg-gray-700/50'
            }`}
          >
            <span>{category.icon}</span>
            <span>{category.name}</span>
          </button>
        ))}
      </div>

      {/* Task Progress Summary */}
      <div className="bg-black/40 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-cyan-400 font-mono font-bold text-sm">DAILY TASK PROGRESS</div>
          <div className="text-gray-400 font-mono text-xs">
            {dailyStreak.completedTasks.length} / {availableTasks.length} completed
          </div>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
          <div 
            className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-500" 
            style={{ width: `${availableTasks.length > 0 ? (dailyStreak.completedTasks.length / availableTasks.length) * 100 : 0}%` }}
          ></div>
        </div>
        <div className="flex items-center justify-between text-xs">
          <div className="text-gray-400">
            {currentTaskInProgress ? '⏱️ Task in progress...' : '🎯 Ready to practice'}
          </div>
          <div className="text-gray-400">
            {Math.round((dailyStreak.completedTasks.length / availableTasks.length) * 100)}% complete
          </div>
        </div>
      </div>

      {/* Spiritual Tasks */}
      <div className="space-y-3">
        {availableTasks.length > 0 ? (
          availableTasks.map(task => (
            <div key={task.id} className={`relative bg-black/40 backdrop-blur-xl border rounded-xl p-4 transition-all duration-300 ${
              dailyStreak.completedTasks.includes(task.id)
                ? 'border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.3)]'
                : currentTaskInProgress === task.id
                ? taskCompleted && practiceTimer === 0
                  ? 'border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.3)]'
                  : 'border-orange-500/50 shadow-[0_0_20px_rgba(255,165,0,0.3)]'
                : currentTaskInProgress !== null
                ? 'border-gray-500/30 shadow-[0_0_20px_rgba(128,128,128,0.1)] opacity-60'
                : 'border-cyan-500/30 shadow-[0_0_20px_rgba(0,255,255,0.1)]'
            }`}>
              {currentTaskInProgress === task.id && (
                <div className={`absolute -top-2 -right-2 text-white text-xs font-mono font-bold px-2 py-1 rounded-full ${
                  taskCompleted && practiceTimer === 0
                    ? 'bg-yellow-500 animate-pulse' 
                    : 'bg-orange-500 animate-pulse'
                }`}>
                  {taskCompleted && practiceTimer === 0 ? '🎁 READY TO CLAIM' : '⏱️ IN PROGRESS'}
                </div>
              )}
              {currentTaskInProgress === null && !dailyStreak.completedTasks.includes(task.id) && (
                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-mono font-bold px-2 py-1 rounded-full">
                  ⏳ NOT COMPLETED
                </div>
              )}
              {dailyStreak.completedTasks.includes(task.id) && (
                <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-mono font-bold px-2 py-1 rounded-full">
                  ✅ COMPLETED
                </div>
              )}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{task.icon}</div>
                  <div>
                    <div className="text-white font-mono font-bold text-sm tracking-wider">{task.name}</div>
                    <div className="text-gray-400 font-mono text-xs">{task.description}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-purple-400 font-mono font-bold text-sm">+{task.gemReward} gems</div>
                  <div className="text-yellow-400 font-mono text-xs">+{task.experienceReward} exp</div>
                </div>
              </div>
              
              {/* Task Status Indicator */}
              <div className="mb-3">
                {dailyStreak.completedTasks.includes(task.id) ? (
                  <div className="flex items-center gap-2 text-green-400">
                    <div className="text-sm">✅</div>
                    <div className="text-xs font-mono">Task completed today</div>
                  </div>
                ) : currentTaskInProgress === task.id ? (
                  <div className="flex items-center gap-2 text-orange-400">
                    <div className="text-sm animate-pulse">⏱️</div>
                    <div className="text-xs font-mono">
                      {taskCompleted && practiceTimer === 0 ? 'Practice completed - ready to claim!' : 'Timer in progress - complete timer first'}
                    </div>
                  </div>
                ) : currentTaskInProgress !== null ? (
                  <div className="flex items-center gap-2 text-gray-400">
                    <div className="text-sm">⏸️</div>
                    <div className="text-xs font-mono">Another task is active</div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-400">
                    <div className="text-sm">⏳</div>
                    <div className="text-xs font-mono">Not completed yet</div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-mono ${getDifficultyColor(task.difficulty)}`}>
                    {task.difficulty.toUpperCase()}
                  </span>
                  <span className="text-gray-400 text-xs">•</span>
                  <span className="text-gray-400 text-xs">{getCategoryIcon(task.category)} {task.category}</span>
                </div>
                
                {task.requirements.minLevel && (
                  <div className="text-gray-400 font-mono text-xs">
                    Level {task.requirements.minLevel} required
                  </div>
                )}
              </div>
              
                            <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedTask(task);
                    setShowTaskDetails(true);
                    setWizardStep(1); // Reset wizard step when opening task details
                    setIsTimerRunning(false); // Reset timer state
                    setPracticeTimer(0); // Reset timer
                    setTaskCompleted(false); // Reset completion state
                  }}
                  disabled={currentTaskInProgress !== null && currentTaskInProgress !== task.id}
                  className={`w-full py-3 rounded-lg font-mono font-bold text-sm tracking-wider transition-all duration-300 border flex items-center justify-center gap-2 ${
                    dailyStreak.completedTasks.includes(task.id)
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white border-green-400 cursor-not-allowed'
                      : currentTaskInProgress !== null && currentTaskInProgress !== task.id
                      ? 'bg-gray-600 text-gray-400 border-gray-500 cursor-not-allowed'
                      : currentTaskInProgress === task.id
                      ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white border-orange-400 hover:scale-105 shadow-lg hover:shadow-orange-500/25'
                      : 'bg-gradient-to-r from-cyan-600 via-purple-600 to-pink-600 hover:from-cyan-500 hover:via-purple-500 hover:to-pink-500 text-white border-cyan-400 hover:scale-105 shadow-lg hover:shadow-cyan-500/25'
                  }`}
                >
                  <span>
                    {dailyStreak.completedTasks.includes(task.id) 
                      ? '✅' 
                      : currentTaskInProgress === task.id 
                      ? (taskCompleted && practiceTimer === 0 ? '🎁' : '⏱️')
                      : '🌟'
                    }
                  </span>
                  <span>
                    {dailyStreak.completedTasks.includes(task.id)
                      ? 'TASK COMPLETED'
                      : currentTaskInProgress === task.id 
                      ? (taskCompleted && practiceTimer === 0 ? 'READY TO CLAIM' : 'COMPLETE TIMER')
                      : currentTaskInProgress !== null 
                      ? 'ANOTHER TASK ACTIVE' 
                      : 'START WIZARD'
                    }
                  </span>
                  <span>
                    {dailyStreak.completedTasks.includes(task.id)
                      ? '🎉'
                      : currentTaskInProgress === task.id 
                      ? (taskCompleted && practiceTimer === 0 ? '✨' : '⏰')
                      : '🧙‍♀️'
                    }
                  </span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🎉</div>
            <div className="text-white font-mono font-bold text-xl mb-2">All Daily Tasks Completed!</div>
            <div className="text-green-400 font-mono text-sm mb-4">🌟 Congratulations on your spiritual dedication! 🌟</div>
            <div className="text-gray-400 font-mono text-sm mb-2">You've completed all available spiritual tasks for today.</div>
            <div className="text-gray-500 font-mono text-xs">New tasks will be available tomorrow at midnight.</div>
            
            {/* Completion Stats */}
            <div className="mt-6 bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-lg p-4">
              <div className="text-green-400 font-mono font-bold text-sm mb-2">TODAY'S ACHIEVEMENTS</div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-white font-mono font-bold">{dailyStreak.dailyTaskProgress}</div>
                  <div className="text-gray-400 text-xs">Tasks Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-white font-mono font-bold">{dailyStreak.spiritualLevel}</div>
                  <div className="text-gray-400 text-xs">Spiritual Level</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Task Detail Modal */}
      {showTaskDetails && selectedTask && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-black/90 border border-cyan-500/30 rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Wizard Header */}
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">🌟</div>
              <div className="text-cyan-400 font-mono font-bold text-lg mb-1">SPIRITUAL JOURNEY WIZARD</div>
              <div className="text-gray-400 font-mono text-sm">Your path to enlightenment awaits</div>
            </div>

            {/* Wizard Progress Steps */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-cyan-400 font-mono font-bold text-sm">SPIRITUAL JOURNEY PROGRESS</div>
                <div className="text-gray-400 font-mono text-xs">Step {wizardStep} of 4</div>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500" 
                  style={{ width: `${(wizardStep / 4) * 100}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-2">
                <div className={`text-xs font-mono ${wizardStep >= 1 ? 'text-cyan-400' : 'text-gray-500'}`}>📋 Overview</div>
                <div className={`text-xs font-mono ${wizardStep >= 2 ? 'text-purple-400' : 'text-gray-500'}`}>🎯 Preparation</div>
                <div className={`text-xs font-mono ${wizardStep >= 3 ? 'text-green-400' : 'text-gray-500'}`}>🚀 Practice</div>
                <div className={`text-xs font-mono ${wizardStep >= 4 ? 'text-yellow-400' : 'text-gray-500'}`}>✨ Completion</div>
              </div>
            </div>

            {/* Step 1: Task Overview */}
            {wizardStep === 1 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{selectedTask.icon}</div>
                    <div>
                      <div className="text-white font-mono font-bold text-lg">{selectedTask.name}</div>
                      <div className="text-gray-400 font-mono text-sm">{selectedTask.description}</div>
                    </div>
                  </div>
                                <button
                onClick={() => {
                  setShowTaskDetails(false);
                  setWizardStep(1); // Reset wizard when closing
                  setIsTimerRunning(false); // Stop timer when closing
                  setPracticeTimer(0); // Reset timer
                  setCurrentTaskInProgress(null); // Clear current task
                  setTaskCompleted(false); // Reset completion state
                }}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="text-cyan-400 font-mono font-bold text-sm mb-3">📊 TASK STATISTICS</div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Duration:</span>
                        <span className="text-white font-mono">{selectedTask.duration} minutes</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Difficulty:</span>
                        <span className={`font-mono ${getDifficultyColor(selectedTask.difficulty)}`}>
                          {selectedTask.difficulty.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Category:</span>
                        <span className="text-white font-mono">{getCategoryIcon(selectedTask.category)} {selectedTask.category}</span>
                      </div>
                      {selectedTask.timeOfDay && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Best Time:</span>
                          <span className="text-white font-mono capitalize">{selectedTask.timeOfDay}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="text-purple-400 font-mono font-bold text-sm mb-3">🎁 REWARDS</div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Gems:</span>
                        <span className="text-purple-400 font-mono font-bold">+{selectedTask.gemReward}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Experience:</span>
                        <span className="text-yellow-400 font-mono font-bold">+{selectedTask.experienceReward}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Spiritual Level:</span>
                        <span className="text-cyan-400 font-mono font-bold">+1 Progress</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="text-green-400 font-mono font-bold text-sm mb-3">🌟 BENEFITS</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {selectedTask.benefits.map((benefit, index) => (
                      <div key={index} className="flex gap-2 items-start">
                        <div className="text-green-400 mt-0.5">✓</div>
                        <div className="text-white text-sm">{benefit}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedTask.scientificBackground && (
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="text-pink-400 font-mono font-bold text-sm mb-3">🔬 SCIENTIFIC BACKGROUND</div>
                    <div className="text-white text-sm leading-relaxed">{selectedTask.scientificBackground}</div>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    onClick={() => setWizardStep(2)}
                    className="px-6 py-3 rounded-lg font-mono font-bold text-sm bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white transition-all duration-300 hover:scale-105 flex items-center gap-2"
                  >
                    <span>Next Step</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Preparation */}
            {wizardStep === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <div className="text-3xl mb-2">🎯</div>
                  <div className="text-purple-400 font-mono font-bold text-lg mb-1">PREPARATION PHASE</div>
                  <div className="text-gray-400 font-mono text-sm">Let's prepare your sacred space and gather materials</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="text-purple-400 font-mono font-bold text-sm mb-3">📦 REQUIRED MATERIALS</div>
                    {selectedTask.materials && selectedTask.materials.length > 0 ? (
                      <div className="space-y-2">
                        {selectedTask.materials.map((material, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="text-purple-400">•</div>
                            <div className="text-white text-sm">{material}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-400 text-sm">No special materials required</div>
                    )}
                  </div>

                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="text-blue-400 font-mono font-bold text-sm mb-3">🌍 ENVIRONMENT</div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="text-blue-400">📍</div>
                        <div className="text-white text-sm">{selectedTask.environment || 'Any comfortable space'}</div>
                      </div>
                      {selectedTask.weather && (
                        <div className="flex items-center gap-2">
                          <div className="text-blue-400">🌤️</div>
                          <div className="text-white text-sm capitalize">{selectedTask.weather}</div>
                        </div>
                      )}
                      {selectedTask.timeOfDay && (
                        <div className="flex items-center gap-2">
                          <div className="text-blue-400">⏰</div>
                          <div className="text-white text-sm capitalize">{selectedTask.timeOfDay}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="text-yellow-400 font-mono font-bold text-sm mb-3">💡 PRO TIPS</div>
                  <div className="space-y-2">
                    {selectedTask.tips.map((tip, index) => (
                      <div key={index} className="flex gap-2">
                        <div className="text-yellow-400">💡</div>
                        <div className="text-white text-sm">{tip}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-lg p-4">
                  <div className="text-purple-400 font-mono font-bold text-sm mb-2">🎯 PREPARATION CHECKLIST</div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500" />
                      <span className="text-white text-sm">Find a quiet, comfortable space</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500" />
                      <span className="text-white text-sm">Gather required materials</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500" />
                      <span className="text-white text-sm">Set aside {selectedTask.duration} minutes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500" />
                      <span className="text-white text-sm">Turn off distractions (phone, notifications)</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={() => setWizardStep(1)}
                    className="px-6 py-3 rounded-lg font-mono font-bold text-sm bg-gray-600 hover:bg-gray-500 text-white transition-all duration-300 flex items-center gap-2"
                  >
                    <span>←</span>
                    <span>Previous</span>
                  </button>
                  <button
                    onClick={() => {
                      setWizardStep(3);
                      resetTimer(selectedTask.duration); // Initialize timer when entering practice step
                    }}
                    className="px-6 py-3 rounded-lg font-mono font-bold text-sm bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white transition-all duration-300 hover:scale-105 flex items-center gap-2"
                  >
                    <span>Ready to Practice</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Practice */}
            {wizardStep === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <div className="text-3xl mb-2">🚀</div>
                  <div className="text-green-400 font-mono font-bold text-lg mb-1">PRACTICE PHASE</div>
                  <div className="text-gray-400 font-mono text-sm">Follow the step-by-step instructions mindfully</div>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="text-green-400 font-mono font-bold text-sm mb-4">📝 STEP-BY-STEP INSTRUCTIONS</div>
                  <div className="space-y-4">
                    {selectedTask.instructions.map((instruction, index) => (
                      <div key={index} className="flex gap-4 items-start">
                        <div className="bg-green-600 text-white font-mono font-bold text-sm rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="text-white text-sm leading-relaxed flex-1">{instruction}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-lg p-4">
                  <div className="text-green-400 font-mono font-bold text-sm mb-3">⏱️ PRACTICE TIMER</div>
                  <div className="text-center">
                    <div className="text-6xl font-mono font-bold text-white mb-4">
                      {formatTime(practiceTimer)}
                    </div>
                    
                    {/* Timer Progress Bar */}
                    <div className="w-full bg-gray-700 rounded-full h-3 mb-4">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-1000" 
                        style={{ 
                          width: `${selectedTask.duration > 0 ? ((selectedTask.duration * 60 - practiceTimer) / (selectedTask.duration * 60)) * 100 : 0}%` 
                        }}
                      ></div>
                    </div>
                    
                    {/* Timer Controls */}
                    <div className="flex justify-center gap-3 mb-4">
                      {!isTimerRunning && practiceTimer === selectedTask.duration * 60 && (
                        <button
                          onClick={() => startTimer(selectedTask.duration, selectedTask.id)}
                          className="px-6 py-2 rounded-lg font-mono font-bold text-sm bg-green-600 hover:bg-green-500 text-white transition-all duration-300 flex items-center gap-2"
                        >
                          <span>▶️</span>
                          <span>Start Timer</span>
                        </button>
                      )}
                      
                      {isTimerRunning && (
                        <button
                          onClick={pauseTimer}
                          className="px-6 py-2 rounded-lg font-mono font-bold text-sm bg-yellow-600 hover:bg-yellow-500 text-white transition-all duration-300 flex items-center gap-2"
                        >
                          <span>⏸️</span>
                          <span>Pause</span>
                        </button>
                      )}
                      
                      {!isTimerRunning && practiceTimer < selectedTask.duration * 60 && practiceTimer > 0 && (
                        <button
                          onClick={resumeTimer}
                          className="px-6 py-2 rounded-lg font-mono font-bold text-sm bg-green-600 hover:bg-green-500 text-white transition-all duration-300 flex items-center gap-2"
                        >
                          <span>▶️</span>
                          <span>Resume</span>
                        </button>
                      )}
                      
                      {practiceTimer < selectedTask.duration * 60 && (
                        <button
                          onClick={() => resetTimer(selectedTask.duration)}
                          className="px-6 py-2 rounded-lg font-mono font-bold text-sm bg-red-600 hover:bg-red-500 text-white transition-all duration-300 flex items-center gap-2"
                        >
                          <span>🔄</span>
                          <span>Reset</span>
                        </button>
                      )}
                    </div>
                    
                    {/* Timer Status */}
                    <div className="text-gray-400 text-sm mb-2">
                      {isTimerRunning ? '⏱️ Timer is running...' : practiceTimer === 0 ? '✅ Timer completed!' : '⏸️ Timer paused'}
                    </div>
                    
                    {/* Completion Indicator */}
                    {taskCompleted && practiceTimer === 0 && (
                      <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-lg p-3 mb-4">
                        <div className="text-center">
                          <div className="text-2xl mb-2">🎉</div>
                          <div className="text-green-400 font-mono font-bold text-sm mb-1">PRACTICE COMPLETED!</div>
                          <div className="text-white text-sm">You can now proceed to claim your rewards</div>
                        </div>
                      </div>
                    )}
                    
                    <div className="text-sm text-gray-300">
                      {practiceTimer === 0 ? 
                        'Great job! You\'ve completed your practice session.' : 
                        'Take your time and don\'t rush. Quality practice is more important than speed.'
                      }
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="text-blue-400 font-mono font-bold text-sm mb-3">🧘‍♀️ MINDFULNESS REMINDERS</div>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <div className="text-blue-400">🌬️</div>
                      <div className="text-white text-sm">Focus on your breath throughout the practice</div>
                    </div>
                    <div className="flex gap-2">
                      <div className="text-blue-400">🎯</div>
                      <div className="text-white text-sm">Stay present and avoid distractions</div>
                    </div>
                    <div className="flex gap-2">
                      <div className="text-blue-400">💝</div>
                      <div className="text-white text-sm">Be kind to yourself - there's no perfect way</div>
                    </div>
                    <div className="flex gap-2">
                      <div className="text-blue-400">🔄</div>
                      <div className="text-white text-sm">If your mind wanders, gently bring it back</div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={() => setWizardStep(2)}
                    className="px-6 py-3 rounded-lg font-mono font-bold text-sm bg-gray-600 hover:bg-gray-500 text-white transition-all duration-300 flex items-center gap-2"
                  >
                    <span>←</span>
                    <span>Previous</span>
                  </button>
                  <button
                    onClick={() => setWizardStep(4)}
                    className="px-6 py-3 rounded-lg font-mono font-bold text-sm bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white transition-all duration-300 hover:scale-105 flex items-center gap-2"
                  >
                    <span>Practice Complete</span>
                    <span>✨</span>
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Completion */}
            {wizardStep === 4 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <div className="text-3xl mb-2">✨</div>
                  <div className="text-yellow-400 font-mono font-bold text-lg mb-1">COMPLETION PHASE</div>
                  <div className="text-gray-400 font-mono text-sm">Celebrate your spiritual growth and claim your rewards</div>
                </div>

                <div className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border border-yellow-500/30 rounded-lg p-6 text-center">
                  <div className="text-4xl mb-4">🎉</div>
                  <div className="text-yellow-400 font-mono font-bold text-xl mb-2">Congratulations!</div>
                  <div className="text-white text-lg mb-4">You've completed "{selectedTask.name}"</div>
                  <div className="text-gray-300 text-sm mb-6">
                    You've taken another step on your spiritual journey. Every practice session strengthens your connection to your higher self.
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                    <div className="text-2xl mb-2">💎</div>
                    <div className="text-purple-400 font-mono font-bold text-sm">GEMS EARNED</div>
                    <div className="text-white font-mono text-lg">+{selectedTask.gemReward}</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                    <div className="text-2xl mb-2">⭐</div>
                    <div className="text-yellow-400 font-mono font-bold text-sm">EXPERIENCE</div>
                    <div className="text-white font-mono text-lg">+{selectedTask.experienceReward}</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                    <div className="text-2xl mb-2">🌟</div>
                    <div className="text-cyan-400 font-mono font-bold text-sm">SPIRITUAL GROWTH</div>
                    <div className="text-white font-mono text-lg">+1 Level</div>
                  </div>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="text-green-400 font-mono font-bold text-sm mb-3">🌱 INTEGRATION TIPS</div>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <div className="text-green-400">📝</div>
                      <div className="text-white text-sm">Journal about your experience and insights</div>
                    </div>
                    <div className="flex gap-2">
                      <div className="text-green-400">🔄</div>
                      <div className="text-white text-sm">Practice this technique regularly for best results</div>
                    </div>
                    <div className="flex gap-2">
                      <div className="text-green-400">🎯</div>
                      <div className="text-white text-sm">Notice how this practice affects your daily life</div>
                    </div>
                    <div className="flex gap-2">
                      <div className="text-green-400">💝</div>
                      <div className="text-white text-sm">Share your experience with others on their spiritual path</div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={() => setWizardStep(3)}
                    className="px-6 py-3 rounded-lg font-mono font-bold text-sm bg-gray-600 hover:bg-gray-500 text-white transition-all duration-300 flex items-center gap-2"
                  >
                    <span>←</span>
                    <span>Previous</span>
                  </button>
                  <button
                    onClick={() => {
                      completeTask(selectedTask.id);
                      setShowTaskDetails(false);
                      setWizardStep(1); // Reset wizard for next use
                      setCurrentTaskInProgress(null); // Clear current task
                      setTaskCompleted(false); // Reset completion state
                    }}
                    disabled={!(taskCompleted && practiceTimer === 0)}
                    className={`px-6 py-3 rounded-lg font-mono font-bold text-sm transition-all duration-300 flex items-center gap-2 ${
                      taskCompleted && practiceTimer === 0
                        ? 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white hover:scale-105'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <span>{taskCompleted && practiceTimer === 0 ? '🎁' : '⏳'}</span>
                    <span>
                      {taskCompleted && practiceTimer === 0 ? 'Claim Rewards & Continue' : 'Complete Timer First'}
                    </span>
                    <span>{taskCompleted && practiceTimer === 0 ? '🚀' : '⏰'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Completion Result Modal */}
      {showResult && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-black/90 border border-cyan-500/30 rounded-xl p-6 max-w-sm mx-4">
            <div className="text-center">
              <div className="text-4xl mb-4">✨</div>
              <div className="text-white font-mono font-bold text-lg mb-2">Task Completed!</div>
              <div className="text-gray-300 font-mono text-sm mb-4">{rewardMessage}</div>
              <button
                onClick={() => setShowResult(false)}
                className="px-6 py-2 rounded-lg font-mono font-bold text-sm bg-gradient-to-r from-cyan-600 to-blue-600 text-white transition-all duration-300 hover:scale-105"
              >
                CONTINUE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 