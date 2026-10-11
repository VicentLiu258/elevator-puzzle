interface Props {
  text: string
}

export function EventLog({ text }: Props) {
  return (
    <div className="event-log" role="status" aria-live="polite">
      {text || '编排停靠序列后点击「运行」'}
    </div>
  )
}
