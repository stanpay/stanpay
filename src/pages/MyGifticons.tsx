import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";
import BottomNav from "@/components/BottomNav";

const MyGifticons = () => {
  const gifticons = [
    {
      id: 1,
      brand: "스타벅스",
      name: "카페 아메리카노 Tall",
      price: 4500,
      expiryDate: "2025.12.31",
      status: "사용가능",
    },
    {
      id: 2,
      brand: "CU",
      name: "5천원권",
      price: 5000,
      expiryDate: "2025.11.30",
      status: "사용가능",
    },
    {
      id: 3,
      brand: "맥도날드",
      name: "빅맥 세트",
      price: 6500,
      expiryDate: "2025.10.15",
      status: "사용가능",
    },
    {
      id: 4,
      brand: "GS25",
      name: "3천원권",
      price: 3000,
      expiryDate: "2025.09.20",
      status: "사용완료",
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/mypage">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-xl font-bold">내 기프티콘</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        <div className="space-y-3">
          {gifticons.map((gifticon) => (
            <Card
              key={gifticon.id}
              className="p-4 rounded-xl border-border/50"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {gifticon.brand}
                  </p>
                  <h3 className="font-bold text-lg mb-2">{gifticon.name}</h3>
                  <p className="text-primary font-bold">
                    {gifticon.price.toLocaleString()}원
                  </p>
                </div>
                <Badge
                  variant={
                    gifticon.status === "사용가능" ? "default" : "secondary"
                  }
                >
                  {gifticon.status}
                </Badge>
              </div>
              <div className="pt-3 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  유효기간: {gifticon.expiryDate}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default MyGifticons;
