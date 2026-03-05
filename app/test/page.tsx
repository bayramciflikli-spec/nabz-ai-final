/**
 * Sunucu test sayfası – Firebase/layout bağımsız.
 * http://127.0.0.1:3000/test veya http://localhost:3000/test
 */
export default function TestPage() {
  return (
    <div style={{ padding: 40, fontFamily: "sans-serif", background: "#0f172a", color: "#e2e8f0", minHeight: "100vh" }}>
      <h1>Sunucu çalışıyor</h1>
      <p>Port: 3000</p>
      <p><a href="/" style={{ color: "#38bdf8" }}>Ana sayfaya git →</a></p>
    </div>
  );
}
