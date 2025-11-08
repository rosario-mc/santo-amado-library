import Link from "next/link";

export default function Header() {
    return(
        <header className="border-b border-gray-200">
            <nav className="flex items-center justify-between">
                    <Link href="/" className="text-xl font-bold px-4">
                    Santorio's & Amado's Library
                    </Link>
                    <div className="flex gap-6 px-4 py-4">
                        <Link href="/books">Books
                        </Link>
                        <Link href="/printables">Coloring Pages
                        </Link>
                    </div>
            </nav>
        </header>
    );
}