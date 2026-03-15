export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-6 p-6">
      <div className="w-12 h-12 border-2 border-cyan-500/50 border-t-cyan-400 rounded-full animate-spin" />
      <p className="text-white/90 font-medium">Kontrol Kulesi yükleniyor...</p>
    </div>
  );
}
