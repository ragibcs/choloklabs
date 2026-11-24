export default function Statement({
  eyebrow = "WHY CHOLOKLABS",
  body = "We ship our own products and engineer for ambitious teams. One studio, from the interface you touch to the transistor underneath.",
}: {
  eyebrow?: string;
  body?: string;
}) {
  return (
    <section className="statement" aria-labelledby="statement-label">
      <div className="wrap statement-inner">
        <span className="eyebrow" id="statement-label"><i />{eyebrow}</span>
        <p data-scrub-text>{body}</p>
      </div>
    </section>
  )
}
