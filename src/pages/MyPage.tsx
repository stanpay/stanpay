import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronRight, Gift, History, Settings, LogOut, Plus } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { Link } from "react-router-dom";

const MyPage = () => {
  const menuItems = [
    { icon: Gift, label: "내 기프티콘", path: "/my-gifticons" },
    { icon: History, label: "결제 내역", path: "/history" },
    { icon: Settings, label: "포인트/멤버십 관리", path: "/points-membership" },
    { icon: Settings, label: "결제수단 설정", path: "/payment-methods" },
    { icon: Settings, label: "설정", path: "/settings" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="max-w-md mx-auto px-4 py-4">
          <h1 className="text-xl font-bold">마이페이지</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        {/* Profile Section */}
        <Card className="p-6 mb-6 rounded-2xl border-border/50">
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground text-xl font-bold">
                사용자
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-1">사용자님</h2>
              <p className="text-sm text-muted-foreground">user@example.com</p>
            </div>
          </div>

          {/* Points Balance */}
          <div className="flex items-center justify-between py-4 border-y border-border my-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">포인트 잔액</p>
              <p className="text-2xl font-bold text-primary">15,000 P</p>
            </div>
            <Button className="rounded-xl gap-2">
              <Plus className="w-4 h-4" />
              충전
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4">
            <Link to="/my-gifticons" className="text-center cursor-pointer hover:opacity-80 transition-opacity">
              <p className="text-2xl font-bold text-primary mb-1">12</p>
              <p className="text-xs text-muted-foreground">보유 기프티콘</p>
            </Link>
            <Link to="/history" className="text-center border-l border-r border-border cursor-pointer hover:opacity-80 transition-opacity">
              <p className="text-2xl font-bold text-primary mb-1">45</p>
              <p className="text-xs text-muted-foreground">결제 횟수</p>
            </Link>
            <Link to="/my-gifticons?filter=사용가능&subFilter=판매중" className="text-center cursor-pointer hover:opacity-80 transition-opacity">
              <p className="text-2xl font-bold text-primary mb-1">8</p>
              <p className="text-xs text-muted-foreground">판매 중</p>
            </Link>
          </div>
        </Card>

        {/* Menu Items */}
        <div className="space-y-2 mb-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.path} to={item.path}>
                <Card className="p-4 flex items-center justify-between hover:bg-accent transition-colors cursor-pointer rounded-xl border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Logout Button */}
        <Button
          variant="outline"
          className="w-full h-12 rounded-xl border-border/50"
        >
          <LogOut className="w-5 h-5 mr-2" />
          로그아웃
        </Button>
      </main>

      <BottomNav />
    </div>
  );
};

export default MyPage;
