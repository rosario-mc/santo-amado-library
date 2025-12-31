import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="font-sans">
      <main className="w-full max-w-6xl mx-auto flex flex-col items-center gap-8 py-10 px-4 sm:px-6">
        <div className="flex flex-col items-center gap-4 text-center">
           <h1 className="text-3xl font-semibold tracking-tight text-black">
            <Image
            src="/welcome.png"
            alt="Welcome to"
            width={400}
            height={100}
            priority
            />
          </h1>
          <Image
            src="/home-logo.png"
            alt="Welcome to Santorio's & Amado's Library"
            width={800}
            height={400}
            priority
          />
          <p className="text-lg text-black font-semibold">
            Your personal library and games collection!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          <Link
            className="flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border-2 border-zinc-200 hover:border-black transition-all hover:shadow-lg backdrop-blur-md bg-white/10"
            href="/library"
          >
            <span className="text-5xl">
              <Image
              src="/triceratops.png"
              alt="📚"
              width={200}
              height={200}
              priority
              />
            </span>
            <h2 className="text-xl font-semibold text-black text-center">
              Browse Books
            </h2>
          </Link>

          <Link
            className="flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border-2 border-zinc-200 hover:border-black transition-all hover:shadow-lg backdrop-blur-md bg-white/10"
            href="/upload"
          >
            <span className="text-5xl">
              <Image
              src="/upload.png"
              alt="Browse Books"
              width={200}
              height={200}
              priority
              />
            </span>
            <h2 className="text-xl font-semibold text-black text-center">
              Upload a New Book
            </h2>
          </Link>

          <Link
            className="flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border-2 border-zinc-200 hover:border-black transition-all hover:shadow-lg backdrop-blur-md bg-white/10"
            href="/games"
          >
            <span className="text-5xl">
              <Image
              src="/crab.png"
              alt="🎮"
              width={150}
              height={70}
              priority
              />
              </span>
            <h2 className="text-xl font-semibold text-black text-center">
              Browse Games
            </h2>
          </Link>
        </div>
      </main>
    </div>
  );
}
