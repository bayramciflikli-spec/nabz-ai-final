"use client";

const AI_IMAGES = [
  "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800",
  "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800",
  "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800",
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800",
  "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=800",
  "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800",
  "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800",
  "https://images.unsplash.com/photo-1634017839464-5c339bbe3c35?w=800",
  "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800",
  "https://images.unsplash.com/photo-1563089145-599997674d42?w=800",
  "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800",
  "https://images.unsplash.com/photo-1557683316-973673baf926?w=800",
];

export function AIBackground() {
  const duplicated = [...AI_IMAGES, ...AI_IMAGES];

  return (
    <div className="fixed inset-0 z-0 overflow-hidden w-screen h-screen">
      {/* Kayan görseller - yatay, tam ekran */}
      <div className="absolute inset-0 flex flex-nowrap h-full animate-ai-bg-scroll">
        {duplicated.map((src, i) => (
          <div
            key={`${i}-${src}`}
            className="relative h-full flex-shrink-0 w-[50vw] min-w-[500px]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-50"
            />
          </div>
        ))}
      </div>
      {/* Koyu overlay - içerik okunabilir olsun */}
      <div className="absolute inset-0 bg-black/75" />
    </div>
  );
}
