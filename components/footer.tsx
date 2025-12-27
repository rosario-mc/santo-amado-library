export default function Footer() {
    return(
        <footer className="border-t border-gray-200 mt-auto">
            <div className="mx-auto max-w-7xl px-4 py-8">
                <p className="text-center text-med text-gray-600">
                    © {new Date().getFullYear()} LibroLandia
                </p>
                <p className="text-center text-xs text-gray-500 dark:text-gray-500 mt-2">
                    For Santorio & Amado ❤️
                </p>
            </div>
        </footer>
    );
}