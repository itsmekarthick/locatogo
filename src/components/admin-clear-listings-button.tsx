"use client";

import { useState, useTransition } from "react";
import { clearAllListings } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { TrashIcon } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

const CONFIRM_WORD = "DELETE";

export function AdminClearListingsButton({ listingsCount }: { listingsCount: number }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [isPending, startTransition] = useTransition();

  if (listingsCount === 0) return null;

  function close(next: boolean) {
    setOpen(next);
    if (!next) setTyped("");
  }

  function handleClear() {
    startTransition(async () => {
      try {
        await clearAllListings();
        close(false);
        toast({ title: "All listings deleted", description: "You can now import fresh places.", variant: "success" });
      } catch (err) {
        toast({ title: "Couldn't delete listings", description: err instanceof Error ? err.message : "Please try again.", variant: "error" });
      }
    });
  }

  return (
    <>
      <Button variant="secondary" className="text-danger" leadingIcon={<TrashIcon className="size-4" />} onClick={() => setOpen(true)} title="Delete all current listings">
        Delete all listings ({listingsCount.toLocaleString("en-US")})
      </Button>

      <Dialog
        open={open}
        onOpenChange={close}
        size="sm"
        dismissible={!isPending}
        title={`Delete all ${listingsCount.toLocaleString("en-US")} listings?`}
        description="This removes every listing and its coordinates from your atlas so you can import fresh data. It can't be undone."
        footer={
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" disabled={isPending} onClick={() => close(false)}>
              Cancel
            </Button>
            <Button variant="danger" loading={isPending} disabled={typed !== CONFIRM_WORD} onClick={handleClear}>
              Delete everything
            </Button>
          </div>
        }
      >
        <Input
          label={`Type ${CONFIRM_WORD} to confirm`}
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          autoComplete="off"
          autoCapitalize="characters"
          data-autofocus
        />
      </Dialog>
    </>
  );
}
