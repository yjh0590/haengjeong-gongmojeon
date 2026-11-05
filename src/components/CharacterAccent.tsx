const scenes = {
  customer: "/brand/characters/customer-scene-v2.webp",
  merchant: "/brand/characters/merchant-scene-v2.webp",
  together: "/brand/characters/together-hero-v3.webp",
};

/** Decorative composited artwork; functional copy stays accessible as ordinary text. */
export default function CharacterAccent({ scene = "merchant", className = "", priority = false }: {
  scene?: keyof typeof scenes; className?: string; priority?: boolean;
}) {
  return <img className={`character-accent character-scene character-scene-${scene} ${className}`}
    src={scenes[scene]} width="960" height="640" alt="" loading={priority ? "eager" : "lazy"}
    fetchPriority={priority ? "high" : undefined} decoding="async" aria-hidden="true" />;
}
