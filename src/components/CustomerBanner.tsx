import { ChevronRight, Coffee, Gamepad2, LayoutGrid, Search, Sparkles, Utensils } from "lucide-react";
import type { FilterType, StoreData } from "../types/street";
import type { StoreGroupId } from "../data/storeGroups";
import "../styles/CustomerBanner.css";
import SceneBanner from "./SceneBanner";
import { validStorefrontImage } from "../data/storefrontImage";
import StoreName from "./StoreName";

// Shortcuts by the kind of store (see storeGroups.ts); the 맛/멋/이벤트 type filters live in the toolbar below.
const categories = [
  { label: "전체", group: null, icon: LayoutGrid },
  { label: "식당", group: "식당", icon: Utensils },
  { label: "카페·빵", group: "카페·빵", icon: Coffee },
  { label: "뷰티", group: "뷰티", icon: Sparkles },
  { label: "생활·놀이", group: "생활·놀이", icon: Gamepad2 },
] satisfies { label: string; group: StoreGroupId | null; icon: typeof Search }[];

type Props = {
  stores: StoreData[];
  published: boolean;
  filter: FilterType;
  group: StoreGroupId | null;
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: (filter: FilterType, query: string, group: StoreGroupId | null) => void;
  onSelectStore: (storeId: number) => void;
};

export default function CustomerBanner({ stores, published, filter, group, query, onQueryChange, onSearch, onSelectStore }: Props) {
  const featured = stores.find(store => store.category.includes("카페")) || stores[0];
  const photo = featured?.category.includes("카페") ? "cafe.jpg" : featured?.type === "맛" ? "restaurant.jpg" : "city.jpg";

  return <section className="customer-banner" aria-labelledby="customer-banner-title">
    <SceneBanner scene="customer" priority />
    <div className="customer-banner-wash" aria-hidden="true" />
    <div className="customer-banner-copy">
      <p className="customer-banner-eyebrow">DISCOVER YOUR INCHEON</p>
      <h1 id="customer-banner-title">인천의<br />좋은 가게를<br />지도로 발견하세요</h1>
      <form className="customer-banner-search" role="search" aria-label="배너에서 가게 검색" onSubmit={event => { event.preventDefault(); onSearch("전체", query, null); }}>
        <Search size={23} aria-hidden="true" />
        <input type="search" value={query} onChange={event => onQueryChange(event.target.value)} placeholder="어떤 가게를 찾고 계세요?" aria-label="가게 이름, 업종 또는 키워드 검색" />
        <button type="submit" aria-label="가게 검색하기"><Search size={25} aria-hidden="true" /></button>
      </form>
      <div className="customer-banner-categories" role="group" aria-label="배너 가게 카테고리">
        {categories.map(({ label, group: categoryGroup, icon: Icon }) => <button
          key={label} type="button" aria-pressed={group === categoryGroup && (categoryGroup !== null || (filter === "전체" && !query))}
          onClick={() => onSearch("전체", "", categoryGroup)}>
          <Icon size={29} strokeWidth={2.5} aria-hidden="true" /><span>{label}</span>
        </button>)}
      </div>
    </div>
    {featured && <button className="customer-banner-featured" type="button" onClick={() => onSelectStore(featured.id)} aria-label={`${featured.name} 상세 보기`}>
      {validStorefrontImage(featured.storefrontImage)
        ? <img src={featured.storefrontImage} alt={`${featured.name} 실제 외관`} width="115" height="137" style={{objectFit: "cover"}} />
        : <img src={`/customer-banner/${photo}`} alt="가게 분위기 예시 사진" width="115" height="137" />}
      <span className="customer-banner-featured-info">
        <span className="customer-banner-chip">{published ? "등록 점포" : "시연용 점포"}</span>
        <strong><StoreName name={featured.name}/></strong>
        <span className="customer-banner-featured-category">{featured.category}</span>
        <span className="customer-banner-tags"><span>{featured.building} {featured.floor}층</span><span>{featured.type}</span></span>
      </span>
      <ChevronRight className="customer-banner-featured-arrow" size={28} aria-hidden="true" />
    </button>}  </section>;
}
