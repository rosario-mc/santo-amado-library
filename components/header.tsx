import Link from "next/link";
import Image from "next/image";

export default function Header() {
    return(
        <header className="border-b border-gray-200">
            <nav className="flex items-center justify-between h-16">
                    <Link href="/" className="px-2 py-0 transition-transform hover:scale-105">
                        <Image
                            src="/header-logo.png"
                            alt="LibroLandia"
                            width={180}
                            height={50}
                            priority
                            className="animate-pulse hover:animate-bounce"
                            />
                    </Link>
                    <div className="flex gap-6 px-2 py-1">
                        <Link 
                          href="/library">
                          Books
                        </Link>
                        <Link 
                        href="/printables">
                        Coloring Pages
                        </Link>
                    </div>
            </nav>
        </header>
    );
}