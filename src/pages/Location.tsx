import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, MapPin, Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";

const Location = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const recentLocations = [
    "강남구 역삼동",
    "서초구 서초동",
    "송파구 잠실동",
  ];

  const handleLocationSelect = (location: string) => {
    console.log("Selected location:", location);
    navigate("/main");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/main">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold flex-1">위치 설정</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="동/읍/면으로 검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 rounded-xl"
            />
          </div>
        </div>

        {/* Current Location */}
        <Button
          variant="outline"
          className="w-full justify-start h-14 mb-6 rounded-xl border-primary/50 hover:bg-primary/5"
          onClick={() => handleLocationSelect("현재 위치")}
        >
          <MapPin className="w-5 h-5 mr-3 text-primary" />
          <span className="font-medium">현재 위치로 설정</span>
        </Button>

        {/* Recent Locations */}
        <div>
          <h2 className="text-lg font-bold mb-4">최근 위치</h2>
          <div className="space-y-2">
            {recentLocations.map((location) => (
              <Card
                key={location}
                className="p-4 cursor-pointer hover:bg-accent transition-colors"
                onClick={() => handleLocationSelect(location)}
              >
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-3 text-muted-foreground" />
                  <span className="font-medium">{location}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Location;
