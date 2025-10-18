import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";
import BottomNav from "@/components/BottomNav";

const History = () => {
  const payments = [
    {
      id: 1,
      store: "스타벅스 강남점",
      date: "2025.01.15 14:30",
      amount: 4500,
      method: "카카오페이",
      status: "완료",
    },
    {
      id: 2,
      store: "CU 역삼점",
      date: "2025.01.14 18:20",
      amount: 5000,
      method: "네이버페이",
      status: "완료",
    },
    {
      id: 3,
      store: "맥도날드 신사점",
      date: "2025.01.13 12:15",
      amount: 6500,
      method: "토스페이",
      status: "완료",
    },
    {
      id: 4,
      store: "GS25 서초점",
      date: "2025.01.12 09:45",
      amount: 3000,
      method: "삼성페이",
      status: "완료",
    },
    {
      id: 5,
      store: "스타벅스 서초점",
      date: "2025.01.11 16:30",
      amount: 4500,
      method: "카카오페이",
      status: "취소",
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/mypage">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-xl font-bold">결제 내역</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        <div className="space-y-3">
          {payments.map((payment) => (
            <Card
              key={payment.id}
              className="p-4 rounded-xl border-border/50"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-1">{payment.store}</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {payment.date}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {payment.method}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-primary font-bold text-lg mb-2">
                    {payment.amount.toLocaleString()}원
                  </p>
                  <Badge
                    variant={payment.status === "완료" ? "default" : "secondary"}
                  >
                    {payment.status}
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default History;
