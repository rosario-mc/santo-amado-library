export const CHEERS = [
  'Great job! ⭐',
  'Amazing! 🌟',
  'You did it! 🎉',
  'Awesome! 🦕',
  'Super star! 💫',
  'Wow! 🌈',
  'Fantastic! 🎊',
  'Way to go! 🚀',
]

export function randomCheer() {
  return CHEERS[Math.floor(Math.random() * CHEERS.length)]
}

export function speakWord(word: string) {
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(word)
  utterance.rate = 0.8
  utterance.pitch = 1.1
  window.speechSynthesis.speak(utterance)
}
