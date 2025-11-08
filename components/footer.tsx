export default function Footer() {
    return(
        <footer className="border-t border-gray-200 mt-auto">
            <div className="mx-auto max-w-7xl px-4 py-8">
                <p className="text-center text-sm text-gray-600">
                    © {new Date().getFullYear()} Santorio's & Amado's Library
                </p>
            </div>
        </footer>
    );
}