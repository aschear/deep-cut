interface ErrorStateProps {
  message: string;
  type?: "no_match" | "api_error";
  onRetry: () => void;
}

export default function ErrorState({ message, type, onRetry }: ErrorStateProps) {
  const headline =
    type === "no_match"
      ? "Couldn't place it."
      : "Something went wrong.";

  return (
    <div className="flex flex-col items-center gap-6 text-center px-2 animate-[fade-in_0.5s_ease-out_forwards]">
      <div className="space-y-2">
        <p className="font-serif text-2xl text-cream/70 italic">{headline}</p>
        <p className="font-body text-sm text-cream-dim leading-relaxed">{message}</p>
      </div>

      <button
        onClick={onRetry}
        className="
          mt-2 font-sans text-[0.65rem] tracking-[0.2em] uppercase
          text-ember border border-ember/40
          px-6 py-3 rounded-sm
          hover:bg-ember/10 hover:border-ember/70
          transition-all duration-200
          focus:outline-none focus-visible:ring-2 focus-visible:ring-ember
        "
      >
        LISTEN AGAIN
      </button>
    </div>
  );
}
