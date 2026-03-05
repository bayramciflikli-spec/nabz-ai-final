export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080808] text-white">
      <div className="text-center">
        <div className="font-['Orbitron'] font-black text-2xl mb-4 text-white/90">
          NABZ-AI
        </div>
        <div className="w-8 h-8 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin mx-auto" />
        <p className="mt-4 text-sm text-white/50">Yükleniyor...</p>
      </div>
    </div>
  );
}
