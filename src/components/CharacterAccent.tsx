const characters = {
  together: { src: "/brand/characters/together.png", width: 369, height: 277 },
  porumi: { src: "/brand/characters/porumi.png", width: 198, height: 276 },
};

/** A small decorative accent; all instructions remain available as ordinary text. */
export default function CharacterAccent({ character = "together", className = "" }: {
  character?: keyof typeof characters; className?: string;
}) {
  return <img className={`character-accent ${className}`} {...characters[character]} alt="" loading="lazy" aria-hidden="true" />;
}
