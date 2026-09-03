interface Props {
  count?: number;
  type?: "card" | "hero" | "detail" | "text";
}

function CardSkeleton() {
  return (
    <div className="card">
      <div className="skeleton aspect-3/4 w-full" />
      <div className="p-3 space-y-2">
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
        <div className="flex gap-2">
          <div className="skeleton h-5 w-10 rounded-full" />
          <div className="skeleton h-5 w-10 rounded-full" />
        </div>
      </div>
    </div>
  );
}

function HeroSkeleton() {
  return (
    <div className="relative w-full h-[60vh] min-h-[420px] sm:h-[65vh] sm:min-h-[480px] md:h-[70vh]">
      <div className="skeleton absolute inset-0" />
      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8 space-y-4">
        <div className="skeleton h-7 sm:h-8 w-2/3 sm:w-1/3 rounded" />
        <div className="skeleton h-5 sm:h-6 w-1/2 sm:w-1/4 rounded" />
        <div className="skeleton h-4 w-2/3 rounded" />
        <div className="skeleton h-4 w-1/2 rounded" />
        <div className="flex gap-3 mt-4">
          <div className="skeleton h-11 sm:h-12 w-32 sm:w-36 rounded-lg" />
          <div className="skeleton h-11 sm:h-12 w-32 sm:w-36 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="skeleton w-48 h-64 rounded-xl shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="skeleton h-8 w-2/3 rounded" />
          <div className="skeleton h-5 w-1/3 rounded" />
          <div className="skeleton h-4 w-full rounded" />
          <div className="skeleton h-4 w-full rounded" />
          <div className="skeleton h-4 w-3/4 rounded" />
          <div className="flex gap-2 mt-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton h-7 w-20 rounded-full" />
            ))}
          </div>
          <div className="flex gap-3 mt-4">
            <div className="skeleton h-12 w-36 rounded-lg" />
            <div className="skeleton h-12 w-36 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

function TextSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="skeleton h-4 w-3/4 rounded" />
      <div className="skeleton h-4 w-1/2 rounded" />
    </div>
  );
}

export default function Loading({ count = 8, type = "card" }: Props) {
  if (type === "hero") return <HeroSkeleton />;
  if (type === "detail") return <DetailSkeleton />;
  if (type === "text") return <TextSkeleton />;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
