export function getRandomIntro(petName: string, species: string): string {
  const defaultIntro = 'Introducing a special friend in need of a loving home:'

  if (/^\d/.test(petName) || /\D\d/.test(petName))
    return defaultIntro

  const generalIntros = [
    'Meet your new best friend,',
    'Looking for a companion? Say hello to,',
    'Ready to open your heart and home? Introducing,',
    'This friend is in search of a forever home:',
    'Your future companion awaits! Meet',
    'Discover your next family member:',
    'Add a little joy to your life with',
    'A bundle of joy named',
    'Could this be your new buddy?',
    'Find a place in your heart for',
    'Embrace the adventure of friendship with',
    'Your next loyal friend could be',
    'Imagine the possibilities with',
    'Welcoming a new friend is a walk in the park with',
    'Leap into a lifetime of love with',
    'Let your heart be stolen by',
    'Every journey begins with a single step: meet',
    'Bringing love into your life:',
    'Share your life with a soul named',
    'Embark on a journey of companionship with,',
    'Your home is just a hop, skip, and a jump away from,',
    'Find your forever friend and adventure buddy:',
    'Open your doors to a lifetime of companionship with,',
    'Get ready to fall in love with,',
    'Your next best friend is just a moment away:',
    'Enrich your family with the love of,',
    'Ready to make your heart a little bigger? Welcome,',
    'The journey to unconditional love starts with,',
    'Elevate your happiness with a friend named,',
    'Your companion and ally awaits:',
    'Unlock endless joy and companionship with,',
    'Step into a world of love with,',
    'Begin a new chapter of love and laughter with,',
    'Your guide to endless adventures:',
    'Let your life bloom with companionship and joy with,',
    'Meet the newest member of your family circle:',
    'Embrace the joy of unconditional love with,',
  ]

  const dogCatIntros = {
    dog: [
      'Add a little paw-sitivity to your life with',
      'Paws what you\'re doing and meet',
      'Your couch companion and adventure ally awaits:',
      'Unlock endless joy and companionship with,',
      'Step into a world of love and licks with,',
      'Let the tail wags and adventures begin! Meet,',
      'Say hello to your new partner in play:',
      'Get ready to fall in love with every wag of,',
    ],
    cat: [
      'Add a little purr-sonality to your home with',
      'Pause for a moment and meet,',
      'Your lap warmer and quiet companion awaits:',
      'Unlock endless purrs and companionship with,',
      'Step into a world of love and gentle purrs with,',
      'Let the purrs and playful moments begin! Meet,',
      'Say hello to your new cozy companion:',
      'Get ready to fall in love with every purr of,',
    ],
  }

  const specificIntros = {
    'rabbit': [
      'Hop into happiness with a furry friend named,',
      'Let the fun begin with every hop! Meet,',
      'Ready for some bunny to love? Say hello to,',
      'Your garden of joy awaits with,',
      'Discover the joy of hoppy moments with,',
    ],
    'small-furry': [
      'Add a little whisker of joy to your life with,',
      'Tiny paws, big heart! Meet,',
      'Your pocket-sized companion awaits:',
      'Let the little wonders of life cheer you up with,',
      'Find joy in the little things with,',
    ],
    'horse': [
      'Gallop into a new friendship with,',
      'Ready to ride into the sunset? Meet,',
      'Your majestic companion awaits:',
      'Embrace the joy of open fields and companionship with,',
      'Begin a journey of friendship and adventure with,',
    ],
    'bird': [
      'Let your heart soar with the wings of,',
      'A melody of joy awaits you with,',
      'Your feathered friend and song companion awaits:',
      'Unlock a world of songs and companionship with,',
      'Experience the joy of feathered melodies with,',
    ],
  }

  const speciesLower = species.toLowerCase()
  let intros
  if (dogCatIntros[speciesLower])
    intros = [...generalIntros, ...dogCatIntros[speciesLower]]
  else if (specificIntros[speciesLower])
    intros = [...generalIntros, ...specificIntros[speciesLower]]
  else intros = generalIntros

  return intros[Math.floor(Math.random() * intros.length)]
}
