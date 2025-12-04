import { Wrench } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center gap-8 py-16">
      <div className="flex flex-col items-center gap-4">
        <Wrench className="h-16 w-16 text-gray-400" />
        <h1 className="text-4xl font-bold text-center">
          🚧 Under Construction
        </h1>
      </div>
    </div>
  );
}
