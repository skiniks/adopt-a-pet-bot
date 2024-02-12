export function getRandomIntro(petName: string): string {
  const intros = [
    'Meet your new best friend,',
    'Looking for a companion? Say hello to,',
    'Ready to open your heart and home? Introducing,',
    'This furry friend is in search of a forever home:',
    'Your future companion awaits! Meet',
    'Discover your next family member:',
    'Add a little paw-sitivity to your life with',
    'A bundle of joy named',
    'Could this be your new cuddle buddy?',
    'Find a place in your heart for',
    'Embrace the adventure of friendship with',
    'Your next loyal friend could be',
    'Imagine the paw-sibilities with',
    'Welcoming a new friend is a walk in the park with',
    'Leap into a lifetime of love with',
    'Let your heart be stolen by',
    'Paws what you\'re doing and meet',
    'Every journey begins with a single paw: meet',
    'Bringing love and wags into your life:',
    'Share your life with a furry soul named',
    'Embark on a journey of companionship with,',
    'Let the purrs and tail wags begin! Meet,',
    'Your home is just a hop, skip, and a bark away from,',
    'Find your forever friend and adventure buddy:',
    'Open your doors to a lifetime of snuggles with,',
    'Say hello to your new partner in cuddles:',
    'Get ready to fall in love with every wag and purr of,',
    'Your next best friend is just a tail wag away:',
    'Enrich your family with the love of,',
    'Ready to make your heart a little bigger? Welcome,',
    'The journey to unconditional love starts with,',
    'Elevate your happiness with a bundle of fur named,',
    'Your couch companion and adventure ally awaits:',
    'Unlock endless joy and companionship with,',
    'Step into a world of love and licks with,',
    'Begin a new chapter of love and laughter with,',
    'Your guide to endless cuddles and adventures:',
    'Let your life bloom with companionship and joy with,',
    'Meet the newest member of your family circle:',
    'Embrace the joy of unconditional love with,',
  ]
  const defaultIntro = 'Introducing a special friend in need of a loving home:'

  if (/^\d/.test(petName))
    return defaultIntro
  else
    return intros[Math.floor(Math.random() * intros.length)]
}
