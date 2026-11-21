import { backdropSrcSet, imageUrl } from "../lib/images";

// The page's backdrop, blurred and spread behind the top of the page: the "ambient light" of the film.
export function Backdrop({ path, priority = true }: { path: string | null; priority?: boolean }) {
  if (!path) return <div className="h-40 bg-linear-to-b from-raised to-canvas sm:h-56" />;
  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[150%] overflow-hidden"
      >
        <img
          src={imageUrl(path, "w300")}
          alt=""
          className="size-full scale-125 object-cover opacity-50 blur-3xl saturate-150"
        />
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-canvas/70 to-canvas" />
      </div>
      <div className="relative h-[46vh] min-h-72 overflow-hidden sm:h-[62vh] lg:h-[72vh] lg:max-h-[46rem]">
        <img
          src={imageUrl(path, "w1280")}
          srcSet={backdropSrcSet(path)}
          sizes="100vw"
          alt=""
          width={1280}
          height={720}
          fetchPriority={priority ? "high" : "auto"}
          className="fade-in size-full object-cover object-[center_20%]"
        />
        <div className="absolute inset-0 bg-linear-to-t from-canvas via-canvas/40 to-canvas/40" />
        <div className="absolute inset-0 bg-linear-to-r from-canvas/70 via-transparent to-transparent" />
      </div>
    </div>
  );
}
