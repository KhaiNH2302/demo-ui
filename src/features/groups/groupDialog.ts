/** Keep shared dialogs open after failed mutations; mutation onError supplies feedback. */
export function createGroupDialogAction(onOpenChange: (open: boolean) => void) {
  let submitting = false;
  let suppressNextClose = false;

  return {
    async submit(action: () => Promise<unknown>) {
      if (submitting) return;
      submitting = true;
      suppressNextClose = false;
      try {
        await action();
      } catch {
        // Shared dialogs request closure when their onConfirm promise resolves.
        suppressNextClose = true;
      } finally {
        submitting = false;
      }
    },
    changeOpen(open: boolean) {
      if (!open && submitting) return;
      if (!open && suppressNextClose) {
        suppressNextClose = false;
        return;
      }
      onOpenChange(open);
    },
  };
}
