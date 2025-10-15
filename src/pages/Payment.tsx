import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Gift, CreditCard } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";

const Payment = () => {
  const { storeId } = useParams();

  const storeNames: Record<string, string> = {
    baskin: "베스킨라빈스",
    starbucks: "스타벅스",
    mega: "메가커피",
    compose: "컴포즈커피",
    ediya: "이디야커피",
    paik: "백다방",
  };

  const storeName = storeNames[storeId || ""] || "매장";

  const gifticons = [
    { id: 1, name: "아메리카노 Tall", price: "4,500원", discount: "10%" },
    { id: 2, name: "카페라떼 Grande", price: "5,500원", discount: "15%" },
    { id: 3, name: "프라푸치노 Grande", price: "6,500원", discount: "20%" },
  ];

  const handlePayment = () => {
    toast.success("결제가 완료되었습니다!");
  };

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/main">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold flex-1">{storeName}</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-4">
        {/* Gifticon Section */}
        <Card className="p-5 rounded-2xl border-border/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Gift className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-bold">추천 기프티콘</h2>
          </div>
          
          <div className="space-y-3">
            {gifticons.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 bg-muted/50 rounded-xl hover:bg-muted transition-colors cursor-pointer"
              >
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-muted-foreground line-through">
                      {item.price}
                    </span>
                    <span className="text-sm font-bold text-primary">
                      {item.discount} 할인
                    </span>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="rounded-lg">
                  구매
                </Button>
              </div>
            ))}
          </div>
        </Card>

        {/* Membership Section */}
        <Card className="p-5 rounded-2xl border-border/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-secondary" />
            </div>
            <h2 className="text-lg font-bold">멤버십</h2>
          </div>
          
          <div className="p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl">
            <p className="font-semibold mb-2">스타벅스 골드 회원</p>
            <p className="text-sm text-muted-foreground">
              적립 가능 별: ⭐⭐⭐
            </p>
          </div>
        </Card>

        {/* Payment Button */}
        <Button
          onClick={handlePayment}
          className="w-full h-14 text-lg font-semibold rounded-xl"
        >
          결제하기
        </Button>
      </main>
    </div>
  );
};

export default Payment;
