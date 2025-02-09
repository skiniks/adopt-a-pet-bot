type Species = 'dog' | 'cat' | 'rabbit' | 'small-furry' | 'horse' | 'bird'

type SpeciesIntros = {
  [K in Species]: string[];
}

const speciesIntros: SpeciesIntros = {
  'dog': [
    'Meet your new best friend,',
    'Looking for a companion? Say hello to,',
    'Ready to open your heart and home? Introducing,',
    'This friend is in search of a forever home:',
    'Your couch companion and adventure ally awaits:',
    'Unlock endless joy and companionship with,',
    'Step into a world of love and licks with,',
    'Let the tail wags and adventures begin! Meet,',
    'Get ready to fall in love with every wag of,',
    'Your loyal friend and adventure buddy awaits:',
    'Ready to add a little wag to your life? Say hello to,',
  ],
  'cat': [
    'Discover your next family member:',
    'Add a little joy to your life with',
    'A bundle of joy named',
    'Find a place in your heart for',
    'Your lap warmer and quiet companion awaits:',
    'Unlock endless purrs and companionship with,',
    'Step into a world of love and gentle purrs with,',
    'Let the purrs and playful moments begin! Meet,',
    'Get ready to fall in love with every purr of,',
    'Your quiet friend and nap companion awaits:',
    'Ready to add a little purr to your life? Say hello to,',
    'Meet your new feline friend,',
  ],
  'rabbit': [
    'Could this be your new buddy?',
    'Hop into happiness with a furry friend named,',
    'Let the fun begin with every hop! Meet,',
    'Ready for some bunny to love? Say hello to,',
    'Your garden of joy awaits with,',
  ],
  'small-furry': [
    'Embrace the adventure of friendship with',
    'Your next loyal friend could be',
    'Add a little whisker of joy to your life with,',
    'Tiny paws, big heart! Meet,',
    'Your pocket-sized companion awaits:',
  ],
  'horse': [
    'Imagine the possibilities with',
    'Gallop into a new friendship with',
    'Ready to ride into the sunset? Meet,',
    'Your majestic companion awaits:',
    'Begin a journey of friendship and adventure with,',
  ],
  'bird': [
    'Let your heart be stolen by',
    'Let your heart soar with the wings of,',
    'A melody of joy awaits you with,',
    'Your feathered friend and song companion awaits:',
    'Unlock a world of songs and companionship with,',
  ],
}

export function getRandomIntro(petName: string, species: string): string {
  const defaultIntro = 'Introducing a special friend in need of a loving home:'

  if (/^\d/.test(petName) || /\D\d/.test(petName)) {
    return defaultIntro
  }

  const speciesLower = species.toLowerCase() as Species

  if (speciesLower in speciesIntros) {
    const intros = speciesIntros[speciesLower]
    return intros[Math.floor(Math.random() * intros.length)]
  }

  return defaultIntro
}
