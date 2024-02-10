export function getRandomIntro(): string {
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
  ]
  return intros[Math.floor(Math.random() * intros.length)]
}
