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
  ]
  return intros[Math.floor(Math.random() * intros.length)]
}
