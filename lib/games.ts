import { randomCheer as randomCheerI18n, speakWord as speakWordI18n } from './i18n'

export const CHEERS = [
  'Great job! ⭐',
  'Amazing! 🌟',
  'You did it! 🎉',
  'Awesome! 🦕',
  'Super star! 💫',
  'Wow! 🌈',
  'Fantastic! 🎊',
  'Way to go! 🚀',
  'Wahoo! 🪙',
  "Let's-a go! 🍄",
  'Mamma mia! 🌟',
  'Here we go! 🪙',
  'Yahoo! ⭐',
  'Okey-dokey! 🍄',
  'Power up! 💥',
  'Super! 🌟',
]

export function randomCheer(lang: 'en' | 'es' = 'en') {
  return randomCheerI18n(lang)
}

export function speakWord(word: string, lang: 'en' | 'es' = 'en') {
  speakWordI18n(word, lang)
}
