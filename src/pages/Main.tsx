import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import StoreCard from "@/components/StoreCard";
import BottomNav from "@/components/BottomNav";
import { Link } from "react-router-dom";

const Main = () => {
  const stores = [
    { id: "baskin", name: "베스킨라빈스", distance: "250m", image: "🍦" },
    { id: "starbucks", name: "스타벅스", distance: "320m", image: "☕" },
    { id: "mega", name: "메가커피", distance: "450m", image: "☕" },
    { id: "compose", name: "컴포즈커피", distance: "580m", image: "☕" },
    { id: "ediya", name: "이디야커피", distance: "620m", image: "☕" },
    { id: "paik", name: "백다방", distance: "740m", image: "☕" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border/50 backdrop-blur-sm bg-opacity-95">
        <div className="max-w-md mx-auto px-4 py-4">
          <Link to="/location">
            <Button 
              variant="outline" 
              className="w-full justify-start h-12 rounded-xl border-border/50 hover:border-primary/50 transition-colors"
            >
              <MapPin className="w-5 h-5 mr-2 text-primary" />
              <span className="font-medium">현재 위치: 강남구 역삼동</span>
            </Button>
          </Link>
        </div>
      </header>

      {/* Store Grid */}
      <main className="max-w-md mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">결제 가능 매장</h2>
          <p className="text-muted-foreground">거리 순으로 정렬됩니다</p>
        </div>

        <div className="grid grid-cols-2 gap-4 animate-fade-in">
          {stores.map((store) => (
            <StoreCard key={store.id} {...store} />
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Main;
