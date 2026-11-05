import { Award, ChevronRight, Coffee, LayoutGrid, Search, ShoppingBag, Utensils } from "lucide-react";
import type { FilterType, StoreData } from "../types/street";
import "../styles/CustomerBanner.css";
import SceneBanner from "./SceneBanner";

const categories = [
  { label: "맛집", filter: "맛", query: "", icon: Utensils },
  { label: "카페", filter: "맛", query: "카페", icon: Coffee },
  { label: "쇼핑", filter: "멋", query: "쇼핑", icon: ShoppingBag },
  { label: "문화", filter: "멋", query: "문화", icon: Award },
  { label: "전체", filter: "전체", query: "", icon: LayoutGrid },
] satisfies { label: string; filter: FilterType; query: string; icon: typeof Search }[];

type Props = {
  stores: StoreData[];
  published: boolean;
  filter: FilterType;
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: (filter: FilterType, query: string) => void;
  onSelectStore: (storeId: number) => void;
};

export default function CustomerBanner({ stores, published, filter, query, onQueryChange, onSearch, onSelectStore }: Props) {
  const featured = stores.find(store => store.category.includes("카페")) || stores[0];
  const photo = featured?.category.includes("카페") ? "cafe.jpg" : featured?.type === "맛" ? "restaurant.jpg" : "city.jpg";

  return <section className="customer-banner" aria-labelledby="customer-banner-title">
    <SceneBanner scene="customer" priority />
    <div className="customer-banner-wash" aria-hidden="true" />
    <div className="customer-banner-copy">
      <p className="customer-banner-eyebrow">DISCOVER YOUR INCHEON</p>
      <h1 id="customer-banner-title">인천의<br />좋은 가게를<br />지도로 발견하세요</h1>
      <form className="customer-banner-search" role="search" aria-label="배너에서 가게 검색" onSubmit={event => { event.preventDefault(); onSearch("전체", query); }}>
        <Search size={23} aria-hidden="true" />
        <input type="search" value={query} onChange={event => onQueryChange(event.target.value)} placeholder="어떤 가게를 찾고 계세요?" aria-label="가게 이름, 업종 또는 키워드 검색" />
        <button type="submit" aria-label="가게 검색하기"><Search size={25} aria-hidden="true" /></button>
      </form>
      <div className="customer-banner-categories" role="group" aria-label="배너 가게 카테고리">
        {categories.map(({ label, filter: categoryFilter, query: categoryQuery, icon: Icon }) => <button
          key={label} type="button" aria-pressed={filter === categoryFilter && query === categoryQuery}
          onClick={() => onSearch(categoryFilter, categoryQuery)}>
          <Icon size={29} strokeWidth={2.5} aria-hidden="true" /><span>{label}</span>
        </button>)}
      </div>
    </div>
    {featured && <button className="customer-banner-featured" type="button" onClick={() => onSelectStore(featured.id)} aria-label={`${featured.name} 상세 보기`}>
      <img src={`/customer-banner/${photo}`} alt="가게 분위기 예시 사진" width="115" height="137" />
      <span className="customer-banner-featured-info">
        <span className="customer-banner-chip">{published ? "등록 점포" : "시연용 점포"}</span>
        <strong>{featured.name}</strong>
        <span className="customer-banner-featured-category">{featured.category}</span>
        <span className="customer-banner-tags"><span>{featured.building} {featured.floor}층</span><span>{featured.type}</span></span>
      </span>
      <ChevronRight className="customer-banner-featured-arrow" size={28} aria-hidden="true" />
    </button>}
    <p className="customer-banner-caption">배너는 연출된 일러스트입니다. 실제 점포 위치는 아래 안내도에서 확인하세요.</p>
  </section>;
}
