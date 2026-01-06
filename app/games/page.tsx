import Image from "next/image";

export default function ComingSoon() {
  return (
    <main className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-2xl">
        <div className="mb-8">
          <div className="flex justify-center items-center mb-4">
            <Image
            src="/games.png"
            alt="Coming Soon!"
            width={200}
            height={100}
            priority
            />
          </div>
          <p className="text-xl text-black mb-8">
            We're working hard to bring you something amazing. 
            Check back soon!
          </p>
        </div>
        
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
          <p className="text-gray-700">
            🚧This feature is currently under construction. 
            Stay tuned for updates!🚧
          </p>
        </div>
      </div>
    </main>
  );
}
