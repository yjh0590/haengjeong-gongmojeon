import { splitStoreName } from "../data/storeName";

/** Store name with any trailing (bracket part) on a second, smaller line. */
export default function StoreName({ name }: { name: string }) {
  const [main, sub] = splitStoreName(name);
  return <>{main}{sub && <small className="store-name-sub">{sub}</small>}</>;
}
