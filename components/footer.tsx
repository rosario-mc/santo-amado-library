export default function Footer() {
    return(
        <footer className="border-t border-black mt-8">
            <div className="mx-auto max-w-7xl px-4 py-8">
                <p className="text-center text-med text-black font-semibold">
                    © {new Date().getFullYear()} LibroLandia
                </p>
                <p className="text-center text-xs text-black font-semibold mt-2">
                    For Santorio & Amado ❤️
                </p>
            </div>
        </footer>
    );
}
