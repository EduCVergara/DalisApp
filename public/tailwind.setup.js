if (window.tailwind && window.tailwindSharedConfig) {
  window.tailwind.config = window.tailwindSharedConfig;

  if (typeof window.tailwind.refresh === "function") {
    window.tailwind.refresh();
  }
}
