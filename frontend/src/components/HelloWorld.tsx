import { useState } from 'react';

export default function HelloWorld() {
  const [count, setCount] = useState(0);

  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">
        Hello World from TikTok Video Generator!
      </h1>
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
        <p className="text-lg text-gray-600 mb-6">
          Frontend: Astro 4 + React 18 + TypeScript 5 + Tailwind 3
        </p>
        <div className="space-y-4">
          <p className="text-xl font-semibold text-blue-600">
            Licznik: {count}
          </p>
          <button
            onClick={() => setCount(count + 1)}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            Kliknij mnie!
          </button>
        </div>
      </div>
    </div>
  );
} 