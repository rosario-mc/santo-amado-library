import Link from "next/link";
import Image from "next/image";

export default function Header() {
    return(
        <header className="border-b border-black">
            <nav className="flex items-center justify-between h-16">
                    <Link href="/" className="px-2 py-0 transition-transform hover:scale-105">
                        <Image
                            src="/header-logo.png"
                            alt="LibroLandia"
                            width={200}
                            height={50}
                            priority
                            className="hover:scale-105 hover:drop-shadow-lg transition-all duration-300"
                            />
                    </Link>
                    <div className="flex gap-6 px-2 py-1 text-black font-semibold">
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