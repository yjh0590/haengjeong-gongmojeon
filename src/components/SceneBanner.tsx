/** Full-bleed scene with a portrait composition for narrow screens. */
export default function SceneBanner({ scene, priority = false }: {
  scene: "customer" | "merchant"; priority?: boolean;
}) {
  return <picture className="scene-banner-media" aria-hidden="true">
    <source media="(max-width: 600px)" srcSet={`/brand/characters/${scene}-mobile-v4.webp`} />
    <img src={`/brand/characters/${scene}-banner-v4.webp`} width="1600" height="667" alt=""
      loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : undefined} decoding="async" />
  </picture>;
}
