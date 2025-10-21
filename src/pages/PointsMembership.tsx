import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";
import BottomNav from "@/components/BottomNav";

const PointsMembership = () => {
  const [pointsState, setPointsState] = useState({
    "해피포인트": false,
    "CJONE": false,
    "LPoint": false,
    "Hpoint": false,
  });

  const [membershipState, setMembershipState] = useState({
    "스타벅스": false,
    "빽다방": false,
    "투썸": false,
    "메가커피": false,
    "컴포즈커피": false,
    "이디야커피": false,
  });

  const [carrierState, setCarrierState] = useState({
    "SKT": false,
    "KT": false,
    "LG U+": false,
  });

  const handleToggle = (
    category: "points" | "membership" | "carrier",
    item: string
  ) => {
    if (category === "points") {
      setPointsState((prev) => ({ ...prev, [item]: !prev[item as keyof typeof prev] }));
    } else if (category === "membership") {
      setMembershipState((prev) => ({ ...prev, [item]: !prev[item as keyof typeof prev] }));
    } else {
      setCarrierState((prev) => ({ ...prev, [item]: !prev[item as keyof typeof prev] }));
    }
  };

  const renderItems = (
    items: Record<string, boolean>,
    category: "points" | "membership" | "carrier"
  ) => {
    return (
      <div className="space-y-2">
        {Object.entries(items).map(([name, isEnabled]) => (
          <Card
            key={name}
            className="p-4 flex items-center justify-between rounded-xl border-border/50"
          >
            <span className="font-medium">{name}</span>
            <Switch
              checked={isEnabled}
              onCheckedChange={() => handleToggle(category, name)}
            />
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/mypage">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-xl font-bold">포인트/멤버십 관리</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        <Tabs defaultValue="points" className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-6">
            <TabsTrigger value="points">포인트</TabsTrigger>
            <TabsTrigger value="membership">멤버십</TabsTrigger>
            <TabsTrigger value="carrier">통신사</TabsTrigger>
          </TabsList>

          <TabsContent value="points">
            {renderItems(pointsState, "points")}
          </TabsContent>

          <TabsContent value="membership">
            {renderItems(membershipState, "membership")}
          </TabsContent>

          <TabsContent value="carrier">
            {renderItems(carrierState, "carrier")}
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />
    </div>
  );
};

export default PointsMembership;
