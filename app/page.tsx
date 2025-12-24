import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between gap-6 py-10 px-16 bg-white dark:bg-black sm:items-center">
        <Image
          src="/logo.png"
          alt="Welcome to Santorio's & Amado's Library"
          width={400}
          height={200}
          priority
        />
        <div className="flex flex-col items-center gap-6 text-center sm:items-center sm:text-center">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            Welcome to Santorio & Amado's Library
          </h1>
          <p className="max-w-xs text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Browse the library or upload new books to your personal library!{" "}
          </p>
        </div>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <Link
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-black dark:bg-white text-white dark:text-black px-5 transition-colors hover:bg-zinc-800 dark:hover:bg-zinc-200 md:w-[180px]"
            href="/library"
          >
            📚 Browse Library
          </Link>
          <Link
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black dark:border-white text-black dark:text-white px-5 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 md:w-[180px]"
            href="/upload"
          >
            ➕ Upload Book
          </Link>
        </div>
      </main>
    </div>
  );
}
