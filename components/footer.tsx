'use client'

import { useLanguage } from '@/lib/i18n'

export default function Footer() {
    const { t } = useLanguage()

    return(
        <footer className="relative z-20 bg-gradient-to-r from-[#145A32] via-[#1A4D6E] to-[#2D1B69] border-t-4 border-[#4ECDC4]/60">
            <div className="mx-auto max-w-7xl px-4 py-8">
                <p
                    className="text-center text-2xl text-shimmer font-bold"
                    style={{ fontFamily: 'var(--font-fredoka), Fredoka, sans-serif' }}
                >
                    LibroLandia
                </p>
                <p className="text-center text-sm text-white/70 font-semibold mt-3">
                    {t('footer.dedication')} <span className="inline-block animate-heartbeat">❤️</span>
                </p>
            </div>
        </footer>
    );
}
