/** Split "Lucass Pizza(루카스피자)" into ["Lucass Pizza", "(루카스피자)"] so the bracket part can go on its own line. */
export function splitStoreName(name: string): [string, string] {
  const match = name.match(/^(.*?\S)\s*(\([^()]*\))$/);
  return match ? [match[1], match[2]] : [name, ""];
}
