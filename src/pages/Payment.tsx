import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Gift, CreditCard, Plus, Minus } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UsedGifticon {
  id: string;
  available_at: string;
  expiry_date: string;
  barcode: string;
  original_price: number;
  sale_price: number;
}

interface SelectedGifticon {
  id: string;
  count: number;
  sale_price: number;
  reservedIds: string[]; // 대기중인 기프티콘 ID들
}

const Payment = () => {
  const { storeId } = useParams();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("method1");
  const [gifticons, setGifticons] = useState<UsedGifticon[]>([]);
  const [selectedGifticons, setSelectedGifticons] = useState<Map<string, SelectedGifticon>>(new Map());
  const [userPoints, setUserPoints] = useState<number>(0);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [actualStoreName, setActualStoreName] = useState<string>("");

  const storeNames: Record<string, string> = {
    baskin: "베스킨라빈스",
    starbucks: "스타벅스",
    mega: "메가커피",
    compose: "컴포즈커피",
    ediya: "이디야커피",
    paik: "빽다방",
  };

  const membershipNames: Record<string, string> = {
    baskin: "해피포인트",
    starbucks: "스타벅스 멤버쉽",
    mega: "메가커피 멤버쉽",
    compose: "컴포즈커피 멤버쉽",
    ediya: "이디야 멤버쉽",
    paik: "빽다방 멤버쉽",
  };

  const membershipName = membershipNames[storeId || ""] || "멤버쉽";

  // 실제 매장명 조회 (storeId가 숫자인 경우 Kakao API로 조회)
  useEffect(() => {
    const fetchStoreName = async () => {
      // storeId가 storeNames에 있으면 그대로 사용
      if (storeId && storeNames[storeId]) {
        setActualStoreName(storeNames[storeId]);
        return;
      }

      // storeId가 숫자인 경우 실제 매장명 조회
      if (storeId && /^\d+$/.test(storeId)) {
        try {
          // localStorage에서 매장 정보 확인 (Main 페이지에서 저장한 경우)
          const storedStores = localStorage.getItem('nearbyStores');
          if (storedStores) {
            try {
              const stores = JSON.parse(storedStores);
              const store = stores.find((s: any) => s.id === storeId);
              if (store && store.name) {
                setActualStoreName(store.name);
                return;
              }
            } catch (e) {
              console.error("localStorage 파싱 오류:", e);
            }
          }

          // Kakao API로 장소 ID 기반 검색 (keywordSearch로는 ID 검색 불가)
          // 대신 임시로 매장명 저장 또는 기본값 사용
          const kakao = (window as any).kakao;
          if (kakao?.maps?.services) {
            // 장소 ID로 직접 검색할 수 없으므로, 키워드 기반 검색 시도
            // 실제로는 장소 ID가 아닌 키워드가 필요하므로 임시로 기본값 사용
            setActualStoreName("매장");
          } else {
            setActualStoreName("매장");
          }
        } catch (error) {
          console.error("매장명 조회 오류:", error);
          setActualStoreName("매장");
        }
      } else {
        // storeId가 없거나 매핑되지 않은 경우
        setActualStoreName(storeNames[storeId || ""] || "매장");
      }
    };

    fetchStoreName();
  }, [storeId]);

  const paymentMethods = [
    { 
      id: "method1", 
      name: "기프티콘 + KT 멤버십 할인 + 해피포인트 적립", 
      discount: "25%",
      benefits: ["기프티콘 10% 할인", "KT 멤버십 10% 추가할인", "해피포인트 5% 적립"]
    },
    { 
      id: "method2", 
      name: "기프티콘 + 해피포인트 적립", 
      discount: "15%",
      benefits: ["기프티콘 10% 할인", "해피포인트 5% 적립"]
    },
    { 
      id: "method3", 
      name: "멤버십 할인", 
      discount: "10%",
      benefits: ["해피포인트 10% 할인"]
    },
  ];

  // 사용자 포인트 조회
  useEffect(() => {
    const fetchUserPoints = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('points')
          .eq('id', session.user.id)
          .single();
        
        if (profile) {
          setUserPoints(profile.points || 0);
        }
      }
    };
    fetchUserPoints();
  }, []);

  // 기프티콘 목록 조회 (금액대별 중복 제거)
  useEffect(() => {
    const fetchGifticons = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('used_gifticons')
          .select('*')
          .eq('status', '판매중')
          .order('sale_price', { ascending: true });

        if (error) throw error;

        if (data) {
          // 금액대별 중복 제거: sale_price 기준으로 그룹화하여 각 금액대별 하나씩만 선택
          const groupedByPrice = new Map<number, UsedGifticon>();
          data.forEach((item) => {
            if (!groupedByPrice.has(item.sale_price)) {
              groupedByPrice.set(item.sale_price, item);
            }
          });
          setGifticons(Array.from(groupedByPrice.values()));
        }
      } catch (error: any) {
        console.error("기프티콘 조회 오류:", error);
        toast.error("기프티콘을 불러오는 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchGifticons();
  }, []);

  // 페이지 언마운트 시 선택한 기프티콘 상태 복구
  useEffect(() => {
    return () => {
      const releaseReservedGifticons = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        for (const [price, selected] of selectedGifticons.entries()) {
          if (selected.reservedIds.length > 0) {
            // 대기중 상태를 판매중으로 복구
            await supabase
              .from('used_gifticons')
              .update({ 
                status: '판매중',
                reserved_by: null,
                reserved_at: null
              })
              .in('id', selected.reservedIds)
              .eq('reserved_by', session.user.id)
              .eq('status', '대기중');
          }
        }
      };

      if (selectedGifticons.size > 0) {
        releaseReservedGifticons();
      }
    };
  }, [selectedGifticons]);

  // 기프티콘 개수 증가
  const handleIncrease = async (gifticon: UsedGifticon) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      toast.error("로그인이 필요합니다.");
      return;
    }

    const currentSelected = selectedGifticons.get(gifticon.sale_price.toString()) || {
      id: gifticon.id,
      count: 0,
      sale_price: gifticon.sale_price,
      reservedIds: []
    };

    const newCount = currentSelected.count + 1;
    const totalCost = (currentSelected.count + 1) * gifticon.sale_price;

    // 포인트 한도 체크
    const currentTotalCost = Array.from(selectedGifticons.values())
      .reduce((sum, item) => sum + (item.count * item.sale_price), 0);
    const additionalCost = gifticon.sale_price;

    if (currentTotalCost + additionalCost > userPoints) {
      toast.error(`포인트가 부족합니다. 보유 포인트: ${userPoints.toLocaleString()}원`);
      return;
    }

    // 동시성 처리: 개수만큼 기프티콘을 대기중으로 변경
    try {
      const { data: availableItems, error: fetchError } = await supabase
        .from('used_gifticons')
        .select('id')
        .eq('status', '판매중')
        .eq('sale_price', gifticon.sale_price)
        .limit(newCount);

      if (fetchError) throw fetchError;

      if (!availableItems || availableItems.length < newCount) {
        toast.error("선택 가능한 기프티콘이 부족합니다.");
        return;
      }

      const idsToReserve = availableItems.map(item => item.id);

      // 대기중으로 변경
      const { error: updateError } = await supabase
        .from('used_gifticons')
        .update({
          status: '대기중',
          reserved_by: session.user.id,
          reserved_at: new Date().toISOString()
        })
        .in('id', idsToReserve);

      if (updateError) throw updateError;

      // 선택 상태 업데이트
      setSelectedGifticons(new Map(selectedGifticons).set(gifticon.sale_price.toString(), {
        id: gifticon.id,
        count: newCount,
        sale_price: gifticon.sale_price,
        reservedIds: idsToReserve
      }));

      toast.success(`${gifticon.sale_price.toLocaleString()}원 기프티콘 ${newCount}개 선택`);
    } catch (error: any) {
      console.error("기프티콘 선택 오류:", error);
      toast.error(error.message || "기프티콘 선택 중 오류가 발생했습니다.");
    }
  };

  // 기프티콘 개수 감소
  const handleDecrease = async (gifticon: UsedGifticon) => {
    const currentSelected = selectedGifticons.get(gifticon.sale_price.toString());
    if (!currentSelected || currentSelected.count <= 0) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const newCount = currentSelected.count - 1;

    try {
      if (newCount === 0) {
        // 모두 해제
        const { error } = await supabase
          .from('used_gifticons')
          .update({
            status: '판매중',
            reserved_by: null,
            reserved_at: null
          })
          .in('id', currentSelected.reservedIds);

        if (error) throw error;

        const newMap = new Map(selectedGifticons);
        newMap.delete(gifticon.sale_price.toString());
        setSelectedGifticons(newMap);
      } else {
        // 하나만 해제
        const idsToRelease = currentSelected.reservedIds.slice(0, 1);
        const remainingIds = currentSelected.reservedIds.slice(1);

        const { error } = await supabase
          .from('used_gifticons')
          .update({
            status: '판매중',
            reserved_by: null,
            reserved_at: null
          })
          .in('id', idsToRelease);

        if (error) throw error;

        setSelectedGifticons(new Map(selectedGifticons).set(gifticon.sale_price.toString(), {
          ...currentSelected,
          count: newCount,
          reservedIds: remainingIds
        }));
      }
    } catch (error: any) {
      console.error("기프티콘 해제 오류:", error);
      toast.error("기프티콘 해제 중 오류가 발생했습니다.");
    }
  };

  // 총 선택한 포인트 계산
  const totalCost = Array.from(selectedGifticons.values())
    .reduce((sum, item) => sum + (item.count * item.sale_price), 0);

  const handlePayment = async () => {
    if (selectedGifticons.size === 0) {
      toast.error("선택한 기프티콘이 없습니다.");
      return;
    }

    if (totalCost > userPoints) {
      toast.error("포인트가 부족합니다.");
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      toast.error("로그인이 필요합니다.");
      return;
    }

    setIsLoading(true);
    try {
      // 모든 선택한 기프티콘을 판매완료로 변경
      const allReservedIds: string[] = [];
      for (const selected of selectedGifticons.values()) {
        allReservedIds.push(...selected.reservedIds);
      }

      const { error: updateError } = await supabase
        .from('used_gifticons')
        .update({ status: '판매완료' })
        .in('id', allReservedIds);

      if (updateError) throw updateError;

      // 포인트 차감
      const { error: pointsError } = await supabase
        .from('profiles')
        .update({ points: userPoints - totalCost })
        .eq('id', session.user.id);

      if (pointsError) throw pointsError;

      setUserPoints(userPoints - totalCost);
      toast.success("결제가 완료되었습니다!");
      
      // 선택 상태 초기화
      setSelectedGifticons(new Map());
      setStep(2);
    } catch (error: any) {
      console.error("결제 오류:", error);
      toast.error(error.message || "결제 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmStep1 = () => {
    if (selectedGifticons.size === 0) {
      toast.error("기프티콘을 선택해주세요.");
      return;
    }
    setStep(2);
    setCurrentCardIndex(0);
  };

  // 2단계에서 보여줄 총 카드 수 (기프티콘 + 멤버십)
  const totalCards = Array.from(selectedGifticons.values())
    .reduce((sum, item) => sum + item.count, 0) + 1;

  const BarcodeDisplay = ({ number }: { number: string }) => {
    const bars: { width: number; isBlack: boolean }[] = [];
    bars.push({ width: 2, isBlack: true }, { width: 1, isBlack: false }, { width: 2, isBlack: true });
    
    number.split('').forEach((digit) => {
      const num = parseInt(digit);
      const widths = [1, 2, 1, 3, 2, 1, 3, 2, 2, 1];
      const pattern = [true, false, true, false];
      
      pattern.forEach((isBlack, i) => {
        bars.push({ width: widths[(num + i) % widths.length], isBlack });
      });
    });
    
    bars.push({ width: 2, isBlack: true }, { width: 1, isBlack: false }, { width: 2, isBlack: true });
    
    return (
      <div className="space-y-1">
        <div className="flex gap-0 h-16 items-center justify-center bg-white p-3 rounded-lg">
          {bars.map((bar, i) => (
            <div
              key={i}
              className={bar.isBlack ? 'bg-black' : 'bg-white'}
              style={{
                width: `${bar.width * 2}px`,
                height: '100%',
              }}
            />
          ))}
        </div>
        <p className="text-center font-mono text-xs tracking-widest">{number}</p>
      </div>
    );
  };

  // 선택한 기프티콘 목록 생성 (개수만큼)
  const purchasedGifticonsList: Array<{ id: string; gifticon: UsedGifticon }> = [];
  for (const selected of selectedGifticons.values()) {
    const gifticon = gifticons.find(g => g.sale_price === selected.sale_price);
    if (gifticon) {
      for (let i = 0; i < selected.count; i++) {
        purchasedGifticonsList.push({ id: selected.reservedIds[i] || gifticon.id, gifticon });
      }
    }
  }

  return (
    <div className={`bg-background ${step === 2 ? 'h-screen overflow-hidden' : 'min-h-screen pb-6'}`}>
      {step === 1 && (
        <header className="sticky top-0 z-50 bg-card border-b border-border">
          <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-3 relative">
            <Link to="/main" className="absolute left-4">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold flex-1 text-center">
              {actualStoreName || "매장"}
            </h1>
            <div className="w-10" /> {/* 오른쪽 여백을 위한 빈 div */}
          </div>
        </header>
      )}
      
      <main className={`max-w-md mx-auto ${step === 2 ? 'h-full flex flex-col pl-14 pr-4 overflow-hidden' : 'px-4 py-6 space-y-4'}`}>
        {step === 1 ? (
          <>
            {/* Payment Method Selection */}
            <div className="space-y-3">
              <h2 className="text-lg font-bold mb-4">결제방식 추천</h2>
              {paymentMethods.map((method) => (
                <Card
                  key={method.id}
                  className={`p-4 cursor-pointer transition-all border-2 ${
                    selectedPaymentMethod === method.id
                      ? "border-primary bg-primary/5"
                      : "border-border/50 hover:border-border"
                  }`}
                  onClick={() => setSelectedPaymentMethod(method.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-sm">{method.name}</h3>
                      </div>
                      <div className="space-y-1">
                        {method.benefits.map((benefit, index) => (
                          <p key={index} className="text-xs text-muted-foreground">
                            • {benefit}
                          </p>
                        ))}
                      </div>
                    </div>
                    <div className="ml-3 flex flex-col items-end gap-2">
                      <span className="text-lg font-bold text-primary whitespace-nowrap">
                        최대 {method.discount}
                      </span>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedPaymentMethod === method.id
                            ? "border-primary bg-primary"
                            : "border-muted-foreground"
                        }`}
                      >
                        {selectedPaymentMethod === method.id && (
                          <div className="w-2.5 h-2.5 rounded-full bg-primary-foreground" />
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Gifticon Section */}
            {selectedPaymentMethod && (
              <Card className="p-5 rounded-2xl border-border/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Gift className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-lg font-bold">추천 기프티콘</h2>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    보유 포인트: {userPoints.toLocaleString()}원
                  </div>
                </div>
                
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
                ) : gifticons.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    등록된 기프티콘이 없습니다.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {gifticons.map((gifticon) => {
                      const selected = selectedGifticons.get(gifticon.sale_price.toString());
                      const count = selected?.count || 0;
                      const discountAmount = gifticon.original_price - gifticon.sale_price;
                      const discountPercent = Math.round((discountAmount / gifticon.original_price) * 100);
                      
                      return (
                        <div
                          key={gifticon.id}
                          className={`p-4 rounded-xl transition-all ${
                            count > 0 ? "bg-primary/10 border-2 border-primary" : "bg-muted/50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-semibold">{gifticon.available_at}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm text-muted-foreground line-through">
                                  {gifticon.original_price.toLocaleString()}원
                                </span>
                                <span className="text-sm font-bold text-primary">
                                  {discountPercent}% ({discountAmount.toLocaleString()}원) 할인
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                판매가: {gifticon.sale_price.toLocaleString()}원
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-lg w-8 h-8 p-0"
                                onClick={() => handleDecrease(gifticon)}
                                disabled={count === 0 || isLoading}
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                              <span className="font-bold min-w-[2rem] text-center">
                                {count}
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-lg w-8 h-8 p-0"
                                onClick={() => handleIncrease(gifticon)}
                                disabled={isLoading || (totalCost + gifticon.sale_price > userPoints)}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {totalCost > 0 && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">총 선택 포인트</span>
                      <span className="font-bold text-lg text-primary">
                        {totalCost.toLocaleString()}원
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-muted-foreground">남은 포인트</span>
                      <span className={`font-semibold ${userPoints - totalCost < 0 ? 'text-destructive' : ''}`}>
                        {(userPoints - totalCost).toLocaleString()}원
                      </span>
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* Confirm Button */}
            <Button
              onClick={handleConfirmStep1}
              className="w-full h-14 text-lg font-semibold rounded-xl"
              disabled={selectedGifticons.size === 0 || isLoading}
            >
              확인
            </Button>
          </>
        ) : (
          <>
            {/* Step 2: Vertical Scroll View */}
            <div className="absolute left-2 top-4 flex flex-col gap-3 z-50">
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full"
                onClick={() => setStep(1)}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              
              <div className="flex flex-col gap-1.5">
                {Array.from({ length: totalCards }).map((_, index) => (
                  <div
                    key={index}
                    className={`w-1 rounded-full transition-all duration-300 ${
                      index === currentCardIndex
                        ? "h-8 bg-primary"
                        : "h-4 bg-muted"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col h-full py-4 pb-20 overflow-hidden">
              <div 
                className="flex-1 overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
                style={{
                  scrollSnapType: 'y mandatory',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  WebkitOverflowScrolling: 'touch',
                }}
                onScroll={(e) => {
                  const container = e.currentTarget;
                  const cards = Array.from(container.children);
                  let minDistance = Infinity;
                  let closestIndex = 0;
                  
                  cards.forEach((card, index) => {
                    const rect = (card as HTMLElement).getBoundingClientRect();
                    const containerRect = container.getBoundingClientRect();
                    const distance = Math.abs(rect.top - containerRect.top);
                    
                    if (distance < minDistance) {
                      minDistance = distance;
                      closestIndex = index;
                    }
                  });
                  
                  if (closestIndex !== currentCardIndex) {
                    setCurrentCardIndex(closestIndex);
                  }
                }}
              >
                {purchasedGifticonsList.map((item, index) => {
                  const gifticon = item.gifticon;
                  return (
                    <div
                      key={`gifticon-${item.id}-${index}`}
                      className="snap-start mb-4"
                      style={{
                        scrollSnapAlign: 'start',
                        scrollSnapStop: 'always',
                      }}
                    >
                      <Card className="p-4 rounded-2xl border-border/50">
                        <div className="space-y-3">
                          <BarcodeDisplay number={gifticon.barcode} />
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <Gift className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">기프티콘</p>
                              <p className="font-bold text-sm">{gifticon.available_at}</p>
                              <p className="text-xs text-muted-foreground">
                                {gifticon.sale_price.toLocaleString()}원
                              </p>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </div>
                  );
                })}

                {/* Membership Card */}
                <div 
                  className="snap-start"
                  style={{
                    scrollSnapAlign: 'start',
                    scrollSnapStop: 'always',
                  }}
                >
                  <Card className="p-4 rounded-2xl border-border/50">
                    <div className="space-y-3">
                      <BarcodeDisplay number="1234567890123" />
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                            <CreditCard className="w-4 h-4 text-secondary" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">멤버십</p>
                            <p className="font-bold text-sm">{membershipName}</p>
                          </div>
                        </div>
                        {storeId === "starbucks" && (
                          <div className="flex items-center gap-2 text-xs pl-[44px]">
                            <span className="text-muted-foreground">적립 가능 별:</span>
                            <span>⭐⭐⭐</span>
                          </div>
                        )}
                        {storeId === "baskin" && (
                          <div className="flex items-center gap-2 text-xs pl-[44px]">
                            <span className="text-muted-foreground">보유 포인트:</span>
                            <span className="font-semibold">1,500P</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>

            <div className="absolute bottom-4 left-4 right-4">
              <Button
                onClick={handlePayment}
                className="w-full h-14 text-lg font-semibold rounded-xl"
                disabled={isLoading}
              >
                {isLoading ? "처리 중..." : "결제수단 선택"}
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Payment;
