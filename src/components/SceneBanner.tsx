/** Full-bleed scene with a portrait composition for narrow screens. */
export default function SceneBanner({ scene, priority = false }: {
  scene: "customer" | "merchant" | "store"; priority?: boolean;
}) {
  const desktop = scene === "store" ? "store-banner-v5" : `${scene}-banner-v4`;
  const mobile = scene === "store" ? "store-mobile-v5" : `${scene}-mobile-v4`;
  return <picture className="scene-banner-media" aria-hidden="true">
    <source media="(max-width: 600px)" srcSet={`/brand/characters/${mobile}.webp`} />
    <img src={`/brand/characters/${desktop}.webp`} width="1600" height="667" alt=""
      loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : undefined} decoding="async" />
  </picture>;
}
