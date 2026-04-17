export function ChatTypingIndicator({ name }: { name: string }) {
  return (
    <div className="flex justify-start">
      <div className="bg-muted text-muted-foreground rounded-lg px-4 py-2.5 text-sm">
        <span className="inline-flex items-center gap-1">
          {name} is typing
          <span className="inline-flex gap-0.5">
            <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:0ms]" />
            <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:300ms]" />
          </span>
        </span>
      </div>
    </div>
  )
}
