export default function Footer() {
    return(
        <footer className="border-t border-black">
            <div className="mx-auto max-w-7xl px-4 py-4">
                <p className="text-center text-med text-black font-semibold">
                    © {new Date().getFullYear()} LibroLandia
                </p>
                <p className="text-center text-xs text-gray-500 dark:text-gray-500 mt-2">
                    For Santorio & Amado ❤️
                </p>
            </div>
        </footer>
    );
}