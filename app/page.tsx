import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="bg-zinc-50 font-sans dark:bg-black">
      <main className="w-full max-w-6xl mx-auto flex flex-col items-center gap-8 py-10 px-4 sm:px-6">
        <div className="flex flex-col items-center gap-4 text-center">
           <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Welcome to
          </h1>
          <Image
            src="/main-logo.png"
            alt="Welcome to Santorio's & Amado's Library"
            width={600}
            height={400}
            priority
          />
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Your personal library and games collection!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          <Link
            className="flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 hover:border-black dark:hover:border-white transition-all hover:shadow-lg"
            href="/library"
          >
            <span className="text-5xl">📚</span>
            <h2 className="text-xl font-semibold text-black dark:text-white text-center">
              Browse Books
            </h2>
          </Link>

          <Link
            className="flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 hover:border-black dark:hover:border-white transition-all hover:shadow-lg"
            href="/upload"
          >
            <span className="text-5xl">➕</span>
            <h2 className="text-xl font-semibold text-black dark:text-white text-center">
              Upload Book
            </h2>
          </Link>

          <Link
            className="flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 hover:border-black dark:hover:border-white transition-all hover:shadow-lg"
            href="/games"
          >
            <span className="text-5xl">🎮</span>
            <h2 className="text-xl font-semibold text-black dark:text-white text-center">
              Browse Games
            </h2>
          </Link>
        </div>
      </main>
    </div>
  );
}
