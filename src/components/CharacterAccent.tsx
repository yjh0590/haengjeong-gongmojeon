const scenes = {
  customer: "/brand/characters/customer-scene-v2.webp",
  merchant: "/brand/characters/merchant-scene-v2.webp",
};

/** Decorative composited artwork; functional copy stays accessible as ordinary text. */
export default function CharacterAccent({ scene = "merchant", className = "" }: {
  scene?: keyof typeof scenes; className?: string;
}) {
  return <img className={`character-accent character-scene character-scene-${scene} ${className}`}
    src={scenes[scene]} width="960" height="640" alt="" loading="lazy" decoding="async" aria-hidden="true" />;
}
