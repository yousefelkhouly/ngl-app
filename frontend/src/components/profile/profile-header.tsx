import type { ReactNode } from "react";
import type { PublicProfile } from "@/lib/api/types";
import { Avatar } from "@/components/common/avatar";
import { PaperNote } from "@/components/brand/paper-note";
import { Skeleton } from "@/components/ui/skeleton";
import { CoverBanner } from "./cover-banner";

// cover images across the top, the profile picture overlapping their bottom edge.
// used on your own profile and on the public page people send notes from
export function ProfileHeader({
  profile,
  details,
  actions,
}: {
  profile: PublicProfile;
  // under the name, e.g. the email on your own profile
  details?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <PaperNote className="overflow-hidden">
      <CoverBanner images={profile.coverImagesPath ?? []} name={profile.name} />
      <div className="flex flex-wrap items-end gap-x-5 gap-y-3 px-5 pb-5 sm:px-6 sm:pb-6">
        <Avatar
          id={profile._id}
          name={profile.name}
          picture={profile.profilePicturePath}
          size="xl"
          className="z-10 -mt-12 border-[3px] bg-paper shadow-hard-sm sm:-mt-16"
        />
        {/* basis: on a narrow screen the actions wrap under the name instead of squeezing it */}
        <div className="flex min-w-0 grow basis-52 flex-col gap-1 pt-3">
          <p className="truncate text-3xl font-extrabold tracking-tight">{profile.name}</p>
          {details}
        </div>
        {actions}
      </div>
    </PaperNote>
  );
}

export function ProfileHeaderSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite" className="paper overflow-hidden shadow-hard">
      <span className="sr-only">Loading…</span>
      <Skeleton className="h-36 w-full rounded-none sm:h-52 lg:h-60" />
      <div className="flex items-end gap-5 px-5 pb-5 sm:px-6 sm:pb-6">
        <Skeleton className="-mt-12 size-24 rounded-full sm:-mt-16 sm:size-32" />
        <Skeleton className="h-8 w-48" />
      </div>
    </div>
  );
}
