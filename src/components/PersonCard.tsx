import { Link } from "@tanstack/react-router";
import { User } from "lucide-react";
import { useI18n } from "../i18n";
import { pathId } from "../lib/ids";
import { imageUrl, profileSrcSet } from "../lib/images";

export function PersonCard({
  id,
  name,
  role,
  profilePath,
}: {
  id: number;
  name: string;
  role?: string;
  profilePath: string | null;
}) {
  const { langParam } = useI18n();
  return (
    <Link
      to="/{-$lang}/person/$id/"
      params={{ lang: langParam, id: pathId(id, name) }}
      className="group block rounded-xl outline-offset-4"
    >
      <div className="overflow-hidden rounded-xl bg-raised ring-1 ring-line">
        {profilePath ? (
          <img
            src={imageUrl(profilePath, "w185")}
            srcSet={profileSrcSet(profilePath)}
            sizes="9rem"
            alt=""
            width={185}
            height={278}
            loading="lazy"
            decoding="async"
            className="aspect-[2/3] w-full object-cover grayscale-[35%] transition duration-500 ease-out-expo group-hover:scale-[1.04] group-hover:grayscale-0"
          />
        ) : (
          <div className="flex aspect-[2/3] items-center justify-center text-muted">
            <User className="size-8" aria-hidden="true" />
          </div>
        )}
      </div>
      <p className="mt-2 line-clamp-2 text-sm leading-snug font-semibold group-hover:text-accent-text">
        {name}
      </p>
      {role && <p className="mt-0.5 line-clamp-2 text-xs text-muted">{role}</p>}
    </Link>
  );
}
