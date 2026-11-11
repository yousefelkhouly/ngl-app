import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// a submit button that says what it's doing while the request runs
export function SubmitButton({
  pending,
  pendingLabel,
  children,
  ...props
}: React.ComponentProps<typeof Button> & { pending: boolean; pendingLabel: string }) {
  return (
    <Button type="submit" {...props} disabled={pending || props.disabled} aria-busy={pending}>
      {pending ? (
        <>
          <Loader2 aria-hidden="true" className="animate-spin" />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
