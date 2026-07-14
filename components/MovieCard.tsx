type MovieCardProps = {
  title: string;
  year: string;
  rating: number;
  posterText: string;
};

export default function MovieCard({
  title,
  year,
  rating,
  posterText,
}: MovieCardProps) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 transition hover:-translate-y-1 hover:border-yellow-400/60">
      <div className="mb-4 flex h-64 items-center justify-center rounded-lg bg-neutral-800">
        <span className="text-lg font-bold tracking-widest text-neutral-500">
          {posterText}
        </span>
      </div>

      <h3 className="text-lg font-semibold text-white">{title}</h3>

      <div className="mt-2 flex items-center justify-between text-sm text-neutral-400">
        <span>{year}</span>

        <span className="rounded-md bg-yellow-400 px-2 py-1 font-semibold text-black">
          {rating}
        </span>
      </div>
    </div>
  );
}