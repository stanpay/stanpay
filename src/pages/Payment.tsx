import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Gift, CreditCard, Loader2 } from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import JsBarcode from "jsbarcode";

interface UsedGifticon {
  id: string;
  available_at: string;
  name?: string;
  expiry_date: string;
  barcode: string;
  original_price: number;
  sale_price: number;
}

interface SelectedGifticon {
  id: string;
  sale_price: number;
  reservedId: string; // 대기중인 기프티콘 ID (단일 선택)
}

const Payment = () => {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [gifticons, setGifticons] = useState<UsedGifticon[]>([]);
  const [selectedGifticons, setSelectedGifticons] = useState<Map<string, SelectedGifticon>>(new Map());
  // 추가로 불러온 기프티콘의 관계 추적 (key: 추가된 기프티콘 ID, value: 원본 기프티콘 ID)
  const [addedGifticonRelations, setAddedGifticonRelations] = useState<Map<string, string>>(new Map());
  // 초기 로딩된 기프티콘 ID 목록 (화면에서 사라지지 않아야 하는 기프티콘들)
  const [initialGifticonIds, setInitialGifticonIds] = useState<Set<string>>(new Set());
  // 각 기프티콘의 불러온 순서 추적 (key: 기프티콘 ID, value: 불러온 순서)
  const [gifticonLoadOrder, setGifticonLoadOrder] = useState<Map<string, number>>(new Map());
  let loadOrderCounter = useRef(0);
  // 추가 로드 중인 기프티콘 ID 추적 (중복 호출 방지)
  const loadingGifticonIds = useRef<Set<string>>(new Set());
  const [userPoints, setUserPoints] = useState<number>(0);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [actualStoreName, setActualStoreName] = useState<string>("");
  const [recentlyPurchasedCount, setRecentlyPurchasedCount] = useState<number>(0);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [storeBrand, setStoreBrand] = useState<string>(""); // 매장 브랜드명 (스타벅스, 파스쿠찌 등)
  const [actualGifticonBarcodes, setActualGifticonBarcodes] = useState<Map<string, string>>(new Map()); // 실제 기프티콘 바코드 맵
  const [franchiseId, setFranchiseId] = useState<string | null>(null);
  const [franchisePaymentMethods, setFranchisePaymentMethods] = useState<Array<{
    method_name: string;
    method_type: string | null;
    rate: number | null;
  }>>([]);
  // 결제 완료된 기프티콘 추적 (뒤로가기 방지용)
  const [completedPurchases, setCompletedPurchases] = useState<Set<string>>(new Set());
  
  const [storeInfo, setStoreInfo] = useState<{
    gifticon_available: boolean;
    local_currency_available: boolean;
    local_currency_discount_rate: number | null;
    parking_available: boolean;
    free_parking: boolean;
    parking_size: string | null;
  } | null>(null);
  const [selectedPaymentOptions, setSelectedPaymentOptions] = useState<Set<string>>(new Set());
  const [isLoadingPaymentMethods, setIsLoadingPaymentMethods] = useState<boolean>(true);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [inputBudget, setInputBudget] = useState<number | null>(null); // 입력된 예산
  const [isAutoSelectMode, setIsAutoSelectMode] = useState<boolean>(false); // 자동선택 모드 여부
  const [autoSelectGifticons, setAutoSelectGifticons] = useState<UsedGifticon[]>([]); // 자동선택용 기프티콘 목록

  // 기프티콘 할인율 중 최대값 계산
  const maxGifticonDiscount = useMemo(() => {
    if (gifticons.length === 0) return 0;
    return Math.max(...gifticons.map(g => {
      const discountAmount = g.original_price - g.sale_price;
      return Math.round((discountAmount / g.original_price) * 100);
    }));
  }, [gifticons]);

  // 기프티콘 할인 방식의 할인율을 동적으로 계산
  const gifticonMethodDiscount = maxGifticonDiscount > 0 
    ? `${maxGifticonDiscount}%`
    : "0%";

  // 더미 기프티콘 데이터
  const dummyGifticons: UsedGifticon[] = [
    {
      id: "dummy-1",
      available_at: "스타벅스",
      name: "스타벅스 아메리카노 Tall",
      expiry_date: "2025-12-31",
      barcode: "1234567890123",
      original_price: 4500,
      sale_price: 3600,
    },
    {
      id: "dummy-2",
      available_at: "베스킨라빈스",
      name: "베스킨라빈스 싱글레귤러",
      expiry_date: "2025-11-30",
      barcode: "2345678901234",
      original_price: 3500,
      sale_price: 2800,
    },
    {
      id: "dummy-3",
      available_at: "메가커피",
      name: "메가커피 메가리치아이스티",
      expiry_date: "2025-10-31",
      barcode: "3456789012345",
      original_price: 3000,
      sale_price: 2400,
    },
    {
      id: "dummy-4",
      available_at: "컴포즈커피",
      name: "컴포즈커피 아메리카노",
      expiry_date: "2025-09-30",
      barcode: "4567890123456",
      original_price: 2500,
      sale_price: 2000,
    },
    {
      id: "dummy-5",
      available_at: "이디야커피",
      name: "이디야커피 카페라떼",
      expiry_date: "2025-08-31",
      barcode: "5678901234567",
      original_price: 4000,
      sale_price: 3200,
    },
    {
      id: "dummy-6",
      available_at: "파스쿠찌",
      name: "파스쿠찌 아메리카노",
      expiry_date: "2025-12-31",
      barcode: "6789012345678",
      original_price: 5000,
      sale_price: 4000,
    },
    {
      id: "dummy-7",
      available_at: "파스쿠찌",
      name: "파스쿠찌 카페라떼",
      expiry_date: "2025-11-30",
      barcode: "7890123456789",
      original_price: 5500,
      sale_price: 4400,
    },
  ];

  const storeNames: Record<string, string> = {
    baskin: "베스킨라빈스",
    starbucks: "스타벅스",
    mega: "메가커피",
    compose: "컴포즈커피",
    ediya: "이디야커피",
    paik: "빽다방",
    pascucci: "파스쿠찌",
    twosome: "투썸플레이스",
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

  // 실제 매장명 조회 및 브랜드 설정 (Main 페이지에서 넘어온 매장명 매칭)
  useEffect(() => {
    const fetchStoreName = async () => {
      if (!storeId) {
        setActualStoreName("매장");
        setStoreBrand("");
        return;
      }

      try {
        // 1. localStorage에서 매장 정보 확인 (Main 페이지에서 저장한 경우) - 우선순위 1
        const storedStores = localStorage.getItem('nearbyStores');
        if (storedStores) {
          try {
            const stores = JSON.parse(storedStores);
            // storeId와 정확히 일치하는 매장 찾기
            const store = stores.find((s: any) => String(s.id) === String(storeId));
            if (store) {
              if (store.name) {
                setActualStoreName(store.name);
              }
              // 매장의 image 필드를 브랜드명으로 변환
              if (store.image && storeNames[store.image]) {
                setStoreBrand(storeNames[store.image]);
              } else if (store.image) {
                // storeNames에 없는 경우 image 값을 그대로 사용 (한글인 경우)
                setStoreBrand(store.image);
              }
              return;
            }
          } catch (e) {
            console.error("localStorage 파싱 오류:", e);
          }
        }

        // 2. storeNames에서 브랜드명 매핑 확인 - 우선순위 2
        if (storeNames[storeId]) {
          setActualStoreName(storeNames[storeId]);
          setStoreBrand(storeNames[storeId]);
          return;
        }

        // 3. 기본값
        setActualStoreName("매장");
        setStoreBrand("");
      } catch (error) {
        console.error("매장명 조회 오류:", error);
        setActualStoreName("매장");
        setStoreBrand("");
      }
    };

    fetchStoreName();
  }, [storeId]);

  // 프랜차이즈 및 매장 정보 조회
  useEffect(() => {
    const fetchFranchiseAndStoreInfo = async () => {
      if (!storeBrand) {
        setIsLoadingPaymentMethods(false);
        return;
      }

      try {
        // 1. 프랜차이즈 정보 조회
        const { data: franchiseData, error: franchiseError } = await supabase
          .from('franchises' as any)
          .select('id')
          .eq('name', storeBrand)
          .single();

        if (franchiseError && franchiseError.code !== 'PGRST116') {
          console.error("프랜차이즈 조회 오류:", franchiseError);
          setIsLoadingPaymentMethods(false);
          return;
        }

        if (franchiseData) {
          setFranchiseId(franchiseData.id);

          // 2. 프랜차이즈별 결제 방식 조회 (method_name, method_type, rate 포함)
          const { data: paymentMethodsData, error: paymentMethodsError } = await supabase
            .from('franchise_payment_methods' as any)
            .select('method_name, method_type, rate')
            .eq('franchise_id', franchiseData.id);

          if (paymentMethodsError) {
            console.error("결제 방식 조회 오류:", paymentMethodsError);
            setIsLoadingPaymentMethods(false);
          } else if (paymentMethodsData) {
            setFranchisePaymentMethods(paymentMethodsData.map((pm: any) => ({
              method_name: pm.method_name,
              method_type: pm.method_type,
              rate: pm.rate,
            })));
            setIsLoadingPaymentMethods(false);
          } else {
            setIsLoadingPaymentMethods(false);
          }
        } else {
          // 프랜차이즈 정보가 없으면 로딩 완료
          setIsLoadingPaymentMethods(false);
        }

        // 3. 매장 정보 조회 (storeId를 기반으로)
        if (storeId) {
          // storeId가 UUID 형식인지 확인 (UUID는 8-4-4-4-12 패턴)
          const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(storeId);
          
          if (isUUID) {
            // storeId가 UUID인 경우, id 컬럼으로 조회
            const { data: storeData, error: storeError } = await supabase
              .from('stores' as any)
              .select('gifticon_available, local_currency_available, local_currency_discount_rate, parking_available, free_parking, parking_size')
              .eq('id', storeId)
              .single();

            if (!storeError && storeData) {
              setStoreInfo({
                gifticon_available: storeData.gifticon_available || false,
                local_currency_available: storeData.local_currency_available || false,
                local_currency_discount_rate: storeData.local_currency_discount_rate || null,
                parking_available: storeData.parking_available || false,
                free_parking: storeData.free_parking || false,
                parking_size: storeData.parking_size,
              });
            }
          } else {
            // storeId가 숫자인 경우, franchise_id로 조회
            if (franchiseData) {
              const { data: storeData, error: storeError } = await supabase
                .from('stores' as any)
                .select('gifticon_available, local_currency_available, local_currency_discount_rate, parking_available, free_parking, parking_size')
                .eq('franchise_id', franchiseData.id)
                .limit(1)
                .single();

              if (!storeError && storeData) {
                setStoreInfo({
                  gifticon_available: storeData.gifticon_available || false,
                  local_currency_available: storeData.local_currency_available || false,
                  local_currency_discount_rate: storeData.local_currency_discount_rate || null,
                  parking_available: storeData.parking_available || false,
                  free_parking: storeData.free_parking || false,
                  parking_size: storeData.parking_size,
                });
              }
            }
          }
        }
      } catch (error) {
        console.error("프랜차이즈/매장 정보 조회 오류:", error);
        setIsLoadingPaymentMethods(false);
      }
    };

    fetchFranchiseAndStoreInfo();
  }, [storeBrand, storeId]);

  // 기프티콘 사용 가능 여부 계산 (결제 방식 생성 및 useEffect에서 사용)
  const isGifticonAvailable = storeInfo?.gifticon_available || false;
  const hasGifticons = gifticons.length > 0;
  const canUseGifticon = isGifticonAvailable && hasGifticons;

  // 동적 결제 방식 생성 (프랜차이즈 결제 방식 + 기프티콘 분리)
  const paymentMethods = useMemo(() => {
    const methods: Array<{
      id: string;
      name: string;
      enabled: boolean;
      type: 'membership' | 'gifticon' | 'local_currency' | 'combined';
      method_type?: string | null;
      rate?: number | null;
      gifticonDiscount?: number;
      description?: string;
    }> = [];

    // 기프티콘 사용 가능 여부 및 최대 할인율 (이미 상단에서 계산됨)

    // 프랜차이즈별 결제 방식 추가 (기프티콘과 분리)
    if (franchisePaymentMethods.length > 0) {
      franchisePaymentMethods.forEach((method) => {
        // 프랜차이즈 결제 방식만 별도로 추가
        let description = "";
        if (method.method_type === '적립' && method.rate) {
          description = `${method.rate}% 적립`;
        } else if (method.method_type === '스탬프') {
          description = "스탬프 적립";
        } else if (method.method_type === '결제' && method.rate) {
          description = `${method.rate}% 할인`;
        }

        // 해피포인트와 투썸하트는 추후 서비스 예정으로 설정
        const isComingSoon = method.method_name === '해피포인트' || method.method_name === '투썸하트';

        methods.push({
          id: `method-${method.method_name}`,
          name: method.method_name,
          enabled: !isComingSoon, // 해피포인트, 투썸하트는 false
          type: 'membership',
          method_type: method.method_type,
          rate: method.rate,
          description: description,
        });
      });
    }

    // 기프티콘 결제 방식 추가 (항상 별도로 표시)
    if (canUseGifticon) {
      methods.push({
        id: 'method-gifticon',
        name: '기프티콘',
        enabled: true,
        type: 'gifticon',
        gifticonDiscount: maxGifticonDiscount,
        description: `기프티콘 ${maxGifticonDiscount}% 할인`,
      });
    }

    // 지역화폐 사용 가능 여부에 따라 지역화폐 옵션 추가
    if (storeInfo?.local_currency_available) {
      const discountRate = storeInfo.local_currency_discount_rate;
      const description = discountRate 
        ? `지역화폐 ${discountRate}% 할인`
        : "지역화폐 사용";
      
      methods.push({
        id: 'method-local-currency',
        name: '지역화폐',
        enabled: true,
        type: 'local_currency',
        description: description,
      });
    }

    // 기본값 제거: 로딩 중이거나 정보가 없으면 빈 배열 반환
    // 프랜차이즈 정보가 로딩 중이거나 없는 경우 빈 배열 반환하여 기본값이 표시되지 않도록 함
    if (isLoadingPaymentMethods || (methods.length === 0 && !storeInfo)) {
      return [];
    }

    return methods;
  }, [franchisePaymentMethods, storeInfo, gifticons, maxGifticonDiscount, isLoadingPaymentMethods]);


  // 이전 로그인 상태를 추적하기 위한 ref 사용
  const prevSessionRef = useMemo(() => ({ current: null as any }), []);

  // 로그인 상태 확인
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const loggedIn = !!session;
      setIsLoggedIn(loggedIn);
      
      // 초기 세션 상태 저장
      prevSessionRef.current = session;
      
      if (!loggedIn) {
        // 데모 모드: 더미 포인트 설정
        // 기프티콘은 fetchGifticons에서 브랜드별로 필터링하여 설정됨
        setUserPoints(50000);
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  // 세션 만료 감지 및 로그아웃 처리
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const wasLoggedIn = !!prevSessionRef.current;
      const isNowLoggedIn = !!session;
      
      // INITIAL_SESSION 이벤트 처리: 세션이 없고 이전에 로그인 상태였다면 로그아웃으로 간주
      if (event === "INITIAL_SESSION" && !session && wasLoggedIn) {
        console.log("⚠️ [Payment] 세션 만료 - 로그인 페이지로 이동");
        setIsLoggedIn(false);
        
        toast.error("세션이 만료되었습니다. 다시 로그인해주세요.");
        
        // 로그인 페이지로 리다이렉트
        navigate("/");
        prevSessionRef.current = null;
        return;
      }
      
      if (event === "SIGNED_OUT" || (!session && wasLoggedIn)) {
        // 세션이 만료되거나 로그아웃된 경우
        console.log("⚠️ [Payment] 로그아웃 감지 - 로그인 페이지로 이동");
        setIsLoggedIn(false);
        
        // 로그인 상태였다가 만료된 경우에만 알림 표시 후 로그인 페이지로 이동
        if (wasLoggedIn) {
          toast.error("세션이 만료되었습니다. 다시 로그인해주세요.");
          
          // 로그인 페이지로 리다이렉트
          navigate("/");
        }
      } else if (event === "SIGNED_IN" || (session && isNowLoggedIn)) {
        // 로그인되거나 토큰이 갱신된 경우
        setIsLoggedIn(true);
      }
      
      // 현재 세션 상태 저장
      prevSessionRef.current = session;
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  // 초기 데이터 로딩 완료 체크
  useEffect(() => {
    // storeBrand가 설정되고, 결제 방식 로딩이 완료되면 초기 로딩 종료
    if (storeBrand && !isLoadingPaymentMethods) {
      // 약간의 지연을 두고 초기 로딩 종료 (데이터 렌더링 완료 대기)
      const timer = setTimeout(() => {
        setIsInitialLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    } else if (!storeBrand) {
      // storeBrand가 없으면 즉시 로딩 종료
      setIsInitialLoading(false);
    }
  }, [storeBrand, isLoadingPaymentMethods]);

  // 사용자 포인트 조회
  useEffect(() => {
    const fetchUserPoints = async () => {
      if (!isLoggedIn) return;
      
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
  }, [isLoggedIn]);

  // 기프티콘 목록 조회 (브랜드별 필터링 및 천원대별 중복 제거, 할인율 순 정렬)
  useEffect(() => {
    const fetchGifticons = async () => {
      if (!isLoggedIn) {
        // 데모 모드: 더미 데이터 필터링 및 천원대별로 그룹화 (storeBrand에 따라)
        let filteredDummy = storeBrand 
          ? dummyGifticons.filter((gifticon) => gifticon.available_at === storeBrand)
          : dummyGifticons;

        // 할인효율 기준으로 한 번 정렬
        const sortedDummy = [...filteredDummy].sort(sortByDiscountEfficiency);

        // 천원대별로 그룹화하면서 할인효율이 높은 순으로 이미 정렬된 데이터를 사용
        const groupedByThousand = new Map<number, UsedGifticon>();
        sortedDummy.forEach((item) => {
          const priceRange = getPriceRange(item.original_price);
          // 같은 천원대에 아직 항목이 없으면 추가 (이미 할인효율 순으로 정렬되어 있으므로 첫 번째가 최고 효율)
          if (!groupedByThousand.has(priceRange)) {
            groupedByThousand.set(priceRange, item);
          }
        });

        // 그룹화된 항목들을 배열로 변환 (이미 할인효율 순으로 정렬됨)
        const selectedGifticons: UsedGifticon[] = Array.from(groupedByThousand.values());

        // 불러온 순서 추적 및 초기 기프티콘 ID 저장
        const initialIds = new Set<string>();
        const loadOrder = new Map<string, number>();
        selectedGifticons.forEach((gifticon, index) => {
          initialIds.add(gifticon.id);
          loadOrder.set(gifticon.id, loadOrderCounter.current++);
        });

        // 정렬: 할인효율 기준 (할인효율 내림차순, 같은 효율일 땐 판매가 오름차순)
        selectedGifticons.sort(sortByDiscountEfficiency);

        setGifticons(selectedGifticons);
        setInitialGifticonIds(initialIds);
        setGifticonLoadOrder(loadOrder);
        return;
      }

      if (!storeBrand) {
        // 브랜드 정보가 없으면 기프티콘 조회하지 않음
        setGifticons([]);
        return;
      }

      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          setGifticons([]);
          return;
        }

        // 먼저 이미 내가 예약한 대기중 기프티콘 조회
        const { data: existingPending, error: existingError } = await supabase
          .from('used_gifticons')
          .select('*')
          .eq('status', '대기중')
          .eq('available_at', storeBrand)
          .eq('reserved_by', session.user.id);

        if (existingError) throw existingError;

        // 이미 대기중인 기프티콘이 있고 천원대별로 하나씩 이상 있으면 그것만 표시
        if (existingPending && existingPending.length > 0) {
          // 할인효율 기준으로 한 번 정렬 (DB 레벨에서는 계산식 정렬이 불가능하므로 클라이언트에서 정렬)
          const sortedPending = [...existingPending].sort(sortByDiscountEfficiency);

          // 천원대별로 그룹화하면서 할인효율이 높은 순으로 이미 정렬된 데이터를 사용
          const existingGroupedByThousand = new Map<number, UsedGifticon>();
          sortedPending.forEach((item) => {
            const priceRange = getPriceRange(item.original_price);
            // 같은 천원대에 아직 항목이 없으면 추가 (이미 할인효율 순으로 정렬되어 있으므로 첫 번째가 최고 효율)
            if (!existingGroupedByThousand.has(priceRange)) {
              existingGroupedByThousand.set(priceRange, item);
            }
          });

          // 그룹화된 항목들을 배열로 변환 (이미 할인효율 순으로 정렬됨)
          const selectedGifticons: UsedGifticon[] = Array.from(existingGroupedByThousand.values());

          // 불러온 순서 추적 및 초기 기프티콘 ID 저장
          const initialIds = new Set<string>();
          const loadOrder = new Map<string, number>();
          selectedGifticons.forEach((gifticon) => {
            initialIds.add(gifticon.id);
            loadOrder.set(gifticon.id, loadOrderCounter.current++);
          });

          // 정렬: 할인효율 기준 (할인효율 내림차순, 같은 효율일 땐 판매가 오름차순)
          selectedGifticons.sort(sortByDiscountEfficiency);

          setGifticons(selectedGifticons);
          setInitialGifticonIds(initialIds);
          setGifticonLoadOrder(loadOrder);
          setIsLoading(false);
          return;
        }

        // 대기중인 기프티콘이 없거나 없는 천원대가 있으면 판매중에서 가져오기
        const { data: allData, error: fetchError } = await supabase
          .from('used_gifticons')
          .select('*')
          .eq('status', '판매중')
          .eq('available_at', storeBrand);

        if (fetchError) throw fetchError;

        if (!allData || allData.length === 0) {
          setGifticons([]);
          setIsLoading(false);
          return;
        }

        // 할인효율 기준으로 한 번 정렬 (DB 레벨에서는 계산식 정렬이 불가능하므로 클라이언트에서 정렬)
        const sortedData = [...allData].sort(sortByDiscountEfficiency);

        // 천원대별로 그룹화하면서 할인효율이 높은 순으로 이미 정렬된 데이터를 사용
        const groupedByThousand = new Map<number, UsedGifticon>();
        sortedData.forEach((item) => {
          const priceRange = getPriceRange(item.original_price);
          // 같은 천원대에 아직 항목이 없으면 추가 (이미 할인효율 순으로 정렬되어 있으므로 첫 번째가 최고 효율)
          if (!groupedByThousand.has(priceRange)) {
            groupedByThousand.set(priceRange, item);
          }
        });

        // 그룹화된 항목들을 배열로 변환 (이미 할인효율 순으로 정렬됨)
        const displayGifticons: UsedGifticon[] = Array.from(groupedByThousand.values());
        for (const gifticon of displayGifticons) {
          // 각 천원대의 첫 번째 기프티콘만 대기중으로 변경
          const { error: reserveError } = await supabase
            .from('used_gifticons')
            .update({
              status: '대기중',
              reserved_by: session.user.id,
              reserved_at: new Date().toISOString()
            })
            .eq('id', gifticon.id);

          if (reserveError) {
            console.error("기프티콘 예약 오류:", reserveError);
          }
        }

        // 대기중으로 변경된 기프티콘 조회 (내가 예약한 것만)
        const { data, error } = await supabase
          .from('used_gifticons')
          .select('*')
          .eq('status', '대기중')
          .eq('available_at', storeBrand)
          .eq('reserved_by', session.user.id);

        if (error) throw error;

        if (data) {
          // 할인효율 기준으로 한 번 정렬 (DB 레벨에서는 계산식 정렬이 불가능하므로 클라이언트에서 정렬)
          const sortedData = [...data].sort(sortByDiscountEfficiency);

          // 천원대별로 그룹화하면서 할인효율이 높은 순으로 이미 정렬된 데이터를 사용
          const finalGroupedByThousand = new Map<number, UsedGifticon>();
          sortedData.forEach((item) => {
            const priceRange = getPriceRange(item.original_price);
            // 같은 천원대에 아직 항목이 없으면 추가 (이미 할인효율 순으로 정렬되어 있으므로 첫 번째가 최고 효율)
            if (!finalGroupedByThousand.has(priceRange)) {
              finalGroupedByThousand.set(priceRange, item);
            }
          });

          // 그룹화된 항목들을 배열로 변환 (이미 할인효율 순으로 정렬됨)
          const finalGifticons: UsedGifticon[] = Array.from(finalGroupedByThousand.values());

          // 불러온 순서 추적 및 초기 기프티콘 ID 저장
          const initialIds = new Set<string>();
          const loadOrder = new Map<string, number>();
          finalGifticons.forEach((gifticon) => {
            initialIds.add(gifticon.id);
            loadOrder.set(gifticon.id, loadOrderCounter.current++);
          });

          // 정렬: 할인효율 기준 (할인효율 내림차순, 같은 효율일 땐 판매가 오름차순)
          finalGifticons.sort(sortByDiscountEfficiency);

          setGifticons(finalGifticons);
          setInitialGifticonIds(initialIds);
          setGifticonLoadOrder(loadOrder);
        } else {
          setGifticons([]);
        }
      } catch (error: any) {
        console.error("기프티콘 조회 오류:", error);
        toast.error("기프티콘을 불러오는 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchGifticons();
  }, [isLoggedIn, storeBrand]);

  // 페이지 언마운트 시 모든 대기중 기프티콘을 판매중으로 복구
  useEffect(() => {
    return () => {
      if (!isLoggedIn) return; // 데모 모드에서는 상태 복구 불필요

      const releaseAllReservedGifticons = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user || !storeBrand) return;

        // 해당 사용자가 예약한 해당 브랜드의 대기중 기프티콘을 판매중으로 복구
        await supabase
          .from('used_gifticons')
          .update({ 
            status: '판매중',
            reserved_by: null,
            reserved_at: null
          })
          .eq('available_at', storeBrand)
          .eq('status', '대기중')
          .eq('reserved_by', session.user.id);
      };

      releaseAllReservedGifticons();
    };
  }, [isLoggedIn, storeBrand]);

  // 기프티콘 선택 시 결제방식에서도 자동으로 기프티콘 선택
  useEffect(() => {
    if (selectedGifticons.size > 0) {
      // 기프티콘을 하나라도 선택하면 결제방식에서도 기프티콘 선택
      setSelectedPaymentOptions(prev => {
        const newSet = new Set(prev);
        if (canUseGifticon && !newSet.has('method-gifticon')) {
          newSet.add('method-gifticon');
        }
        return newSet;
      });
    } else {
      // 기프티콘을 모두 해제하면 결제방식에서도 기프티콘 해제
      setSelectedPaymentOptions(prev => {
        const newSet = new Set(prev);
        newSet.delete('method-gifticon');
        return newSet;
      });
    }
  }, [selectedGifticons.size, canUseGifticon]);

  // 천원대별로 그룹화하는 헬퍼 함수
  const getPriceRange = (price: number): number => {
    return Math.floor(price / 1000) * 1000;
  };

  // 할인율 계산 함수
  const getDiscountRate = (originalPrice: number, salePrice: number): number => {
    const discountAmount = originalPrice - salePrice;
    return Math.round((discountAmount / originalPrice) * 100);
  };

  // 할인효율 계산 함수: (원가-할인가)/할인가
  const getDiscountEfficiency = (originalPrice: number, salePrice: number): number => {
    if (salePrice === 0) return 0;
    return (originalPrice - salePrice) / salePrice;
  };

  // 정렬 함수 (마감일 임박순 최우선, 그 다음 할인효율 내림차순, 같은 효율일 땐 판매가 오름차순)
  const sortByDiscountEfficiency = useCallback((a: UsedGifticon, b: UsedGifticon): number => {
    // 1순위: 마감일 임박순 (expiry_date 오름차순)
    const expiryA = new Date(a.expiry_date).getTime();
    const expiryB = new Date(b.expiry_date).getTime();
    if (expiryA !== expiryB) {
      return expiryA - expiryB; // 마감일 임박순 (오름차순)
    }
    
    // 2순위: 할인효율 내림차순
    const efficiencyA = getDiscountEfficiency(a.original_price, a.sale_price);
    const efficiencyB = getDiscountEfficiency(b.original_price, b.sale_price);
    if (efficiencyA !== efficiencyB) {
      return efficiencyB - efficiencyA; // 할인효율 내림차순
    }
    
    // 3순위: 같은 효율일 경우 판매가 오름차순
    return a.sale_price - b.sale_price;
  }, []);

  // 자동선택 모드로 전환 (확인 버튼 클릭 시 호출)
  const executeAutoSelect = async () => {
    if (!inputBudget || inputBudget <= 0 || !canUseGifticon) {
      toast.error("금액을 입력해주세요.");
      return;
    }

    if (!isLoggedIn || !storeBrand) {
      toast.error("로그인이 필요합니다.");
      return;
    }

    // 기존 선택/대기중인 기프티콘들을 판매중으로 복구
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      try {
        // 선택된 기프티콘 중 대기중인 것들을 판매중으로 복구
        const reservedIds: string[] = [];
        selectedGifticons.forEach((selected) => {
          reservedIds.push(selected.reservedId);
        });

        if (reservedIds.length > 0) {
          await supabase
            .from('used_gifticons')
            .update({
              status: '판매중',
              reserved_by: null,
              reserved_at: null
            })
            .in('id', reservedIds);
        }

        // 기존 추천 기프티콘 중 대기중인 것들도 판매중으로 복구
        const initialReservedIds: string[] = [];
        gifticons.forEach((gifticon) => {
          initialReservedIds.push(gifticon.id);
        });

        if (initialReservedIds.length > 0) {
          await supabase
            .from('used_gifticons')
            .update({
              status: '판매중',
              reserved_by: null,
              reserved_at: null
            })
            .eq('available_at', storeBrand)
            .eq('status', '대기중')
            .in('id', initialReservedIds);
        }
      } catch (error) {
        console.error("기존 기프티콘 상태 복구 오류:", error);
      }
    }

    // 기존 선택 초기화
    setSelectedGifticons(new Map());
    setIsLoading(true);

    try {
      // DB에서 자동선택용 기프티콘 새로 조회
      const { data: autoSelectData, error: fetchError } = await supabase
        .from('used_gifticons')
        .select('*')
        .eq('status', '판매중')
        .eq('available_at', storeBrand);

      if (fetchError) throw fetchError;

      if (!autoSelectData || autoSelectData.length === 0) {
        setAutoSelectGifticons([]);
        setIsAutoSelectMode(true);
        setIsLoading(false);
        toast.error("사용 가능한 기프티콘이 없습니다.");
        return;
      }

      // 할인효율 기준으로 정렬
      const sortedData = [...autoSelectData].sort(sortByDiscountEfficiency);

      // 천원대별로 그룹화하면서 할인효율이 높은 순으로 이미 정렬된 데이터를 사용
      const groupedByThousand = new Map<number, UsedGifticon>();
      sortedData.forEach((item) => {
        const priceRange = getPriceRange(item.original_price);
        if (!groupedByThousand.has(priceRange)) {
          groupedByThousand.set(priceRange, item);
        }
      });

      // 그룹화된 항목들을 배열로 변환
      const autoSelectList: UsedGifticon[] = Array.from(groupedByThousand.values());

      setAutoSelectGifticons(autoSelectList);
      setIsAutoSelectMode(true);
      setIsLoading(false);
    } catch (error: any) {
      console.error("자동선택 기프티콘 조회 오류:", error);
      toast.error("기프티콘을 불러오는 중 오류가 발생했습니다.");
      setIsLoading(false);
    }
  };

  // 자동선택 취소 (취소 버튼 클릭 시 호출)
  const cancelAutoSelect = async () => {
    if (!isLoggedIn || !storeBrand) {
      setIsAutoSelectMode(false);
      setAutoSelectGifticons([]);
      setSelectedGifticons(new Map());
      return;
    }

    // 자동선택 모드에서 선택/대기중인 기프티콘들을 판매중으로 복구
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      try {
        // 선택된 기프티콘 중 대기중인 것들을 판매중으로 복구
        const reservedIds: string[] = [];
        selectedGifticons.forEach((selected) => {
          reservedIds.push(selected.reservedId);
        });

        if (reservedIds.length > 0) {
          await supabase
            .from('used_gifticons')
            .update({
              status: '판매중',
              reserved_by: null,
              reserved_at: null
            })
            .in('id', reservedIds);
        }

        // 자동선택 기프티콘 중 대기중인 것들도 판매중으로 복구
        const autoSelectReservedIds: string[] = [];
        autoSelectGifticons.forEach((gifticon) => {
          autoSelectReservedIds.push(gifticon.id);
        });

        if (autoSelectReservedIds.length > 0) {
          await supabase
            .from('used_gifticons')
            .update({
              status: '판매중',
              reserved_by: null,
              reserved_at: null
            })
            .eq('available_at', storeBrand)
            .eq('status', '대기중')
            .in('id', autoSelectReservedIds);
        }
      } catch (error) {
        console.error("자동선택 기프티콘 상태 복구 오류:", error);
      }
    }

    // 상태 초기화 및 추천 기프티콘으로 전환
    setIsAutoSelectMode(false);
    setAutoSelectGifticons([]);
    setSelectedGifticons(new Map());
    
    // 추천 기프티콘 다시 로드
    // fetchGifticons는 이미 useEffect로 관리되고 있으므로 storeBrand나 isLoggedIn이 변경되면 자동으로 재로드됨
    // 하지만 여기서는 강제로 재로드하기 위해 간단히 처리
  };

  // 자동선택 실행 (확인 버튼으로 기프티콘 선택)
  const runAutoSelect = () => {
    if (!inputBudget || inputBudget <= 0 || !canUseGifticon || autoSelectGifticons.length === 0) {
      toast.error("금액을 입력해주세요.");
      return;
    }

    // 할인효율 기준으로 정렬된 기프티콘 목록 (이미 정렬되어 있음)
    const sortedGifticons = [...autoSelectGifticons].sort(sortByDiscountEfficiency);

    // 그리디 방식으로 예산 내에서 선택
    // 중요: 총 기프티콘 금액권(original_price 합계)이 입력 금액을 넘지 않아야 함
    const selectedGifticonsMap = new Map<string, SelectedGifticon>();
    let remainingOriginalPriceBudget = inputBudget; // 총 기프티콘 금액권 예산
    let totalSalePrice = 0; // 총 구매 포인트

    for (const gifticon of sortedGifticons) {
      // original_price가 남은 예산을 넘지 않으면 선택 가능
      if (gifticon.original_price <= remainingOriginalPriceBudget) {
        // 구매 포인트도 확인 (포인트가 부족하면 선택 불가)
        if (totalSalePrice + gifticon.sale_price <= userPoints) {
          const key = gifticon.id;
          if (!selectedGifticonsMap.has(key)) {
            selectedGifticonsMap.set(key, {
              id: gifticon.id,
              sale_price: gifticon.sale_price,
              reservedId: gifticon.id
            });
            remainingOriginalPriceBudget -= gifticon.original_price;
            totalSalePrice += gifticon.sale_price;
          }
        }
      }
    }

    setSelectedGifticons(selectedGifticonsMap);
    toast.success("기프티콘이 자동으로 선택되었습니다.");
  };

  // 비슷한 가격대 기프티콘 추가 로드 (할인율 순)
  const loadSimilarPriceGifticons = async (selectedGifticon: UsedGifticon) => {
    if (!isLoggedIn || !storeBrand) return;

    // 이미 이 기프티콘에 대한 추가 로드가 진행 중이면 중복 방지
    if (loadingGifticonIds.current.has(selectedGifticon.id)) {
      console.log(`[기프티콘 추가 로드] 이미 진행 중입니다: id=${selectedGifticon.id}`);
      return;
    }

    try {
      loadingGifticonIds.current.add(selectedGifticon.id);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        loadingGifticonIds.current.delete(selectedGifticon.id);
        return;
      }

      // 선택한 기프티콘의 original_price 기준으로 천원대 계산
      const selectedPriceRange = getPriceRange(selectedGifticon.original_price);
      
      console.log(`[기프티콘 추가 로드] 선택한 기프티콘: original_price=${selectedGifticon.original_price}, sale_price=${selectedGifticon.sale_price}, 천원대=${selectedPriceRange}`);
      
      // 현재 이미 불러온 기프티콘의 ID 목록 (중복 방지용)
      // 상태가 업데이트되기 전이므로 최신 상태를 확인하기 위해 getState 패턴 사용
      const existingGifticonIds = new Set<string>();
      gifticons.forEach(g => existingGifticonIds.add(g.id));
      
      // 같은 천원대의 새로운 기프티콘 조회 (original_price 기준)
      const priceMin = selectedPriceRange;
      const priceMax = selectedPriceRange + 999;

      console.log(`[기프티콘 추가 로드] 조회 범위: ${priceMin}원 ~ ${priceMax}원`);

      const { data: similarData, error: fetchError } = await supabase
        .from('used_gifticons')
        .select('*')
        .eq('status', '판매중')
        .eq('available_at', storeBrand)
        .gte('original_price', priceMin)
        .lte('original_price', priceMax);

      if (fetchError) {
        console.error("[기프티콘 추가 로드] 조회 오류:", fetchError);
        throw fetchError;
      }

      if (!similarData || similarData.length === 0) {
        console.log(`[기프티콘 추가 로드] 같은 천원대(${selectedPriceRange}원)의 판매중인 기프티콘이 없습니다.`);
        loadingGifticonIds.current.delete(selectedGifticon.id);
        return;
      }

      console.log(`[기프티콘 추가 로드] 조회된 기프티콘 수: ${similarData.length}`);

      // 이미 불러온 기프티콘 제외 (ID 기준)
      const newData = similarData.filter(item => !existingGifticonIds.has(item.id));

      console.log(`[기프티콘 추가 로드] 새로운 기프티콘 수: ${newData.length}`);

      if (newData.length === 0) {
        console.log(`[기프티콘 추가 로드] 같은 천원대(${selectedPriceRange}원)의 새로운 기프티콘이 없습니다.`);
        loadingGifticonIds.current.delete(selectedGifticon.id);
        return;
      }

      // 할인효율 기준으로 정렬
      newData.sort(sortByDiscountEfficiency);

      // 같은 천원대 내에서 할인효율이 높은 순으로 하나 선택
      const selectedGifticonToAdd = newData[0];

      console.log(`[기프티콘 추가 로드] 선택된 기프티콘: id=${selectedGifticonToAdd.id}, original_price=${selectedGifticonToAdd.original_price}, sale_price=${selectedGifticonToAdd.sale_price}, 할인율=${getDiscountRate(selectedGifticonToAdd.original_price, selectedGifticonToAdd.sale_price)}%`);

      // 선택한 기프티콘을 대기중으로 변경
      const { error: reserveError } = await supabase
        .from('used_gifticons')
        .update({
          status: '대기중',
          reserved_by: session.user.id,
          reserved_at: new Date().toISOString()
        })
        .eq('id', selectedGifticonToAdd.id);

      if (reserveError) {
        console.error("[기프티콘 추가 로드] 예약 오류:", reserveError);
        loadingGifticonIds.current.delete(selectedGifticon.id);
        return;
      }

      // 관계 맵에 추가 (추가된 기프티콘 ID -> 원본 기프티콘 ID)
      setAddedGifticonRelations(prev => {
        const newMap = new Map(prev);
        newMap.set(selectedGifticonToAdd.id, selectedGifticon.id);
        return newMap;
      });

      // 불러온 순서 추가 (원본 기프티콘의 순서 다음으로 설정)
      loadOrderCounter.current++;
      const parentOrder = gifticonLoadOrder.get(selectedGifticon.id) ?? 0;
      // 원본 기프티콘 바로 다음 순서로 설정 (같은 가격대 내에서 원본 바로 아래 위치)
      const newOrder = parentOrder + 0.1; // 원본 바로 다음으로 배치하기 위해 소수점 사용

      setGifticonLoadOrder(prev => {
        const newMap = new Map(prev);
        newMap.set(selectedGifticonToAdd.id, newOrder);
        return newMap;
      });

      // 기존 기프티콘 목록에 추가 (중복 체크)
      setGifticons(prev => {
        // 이미 존재하는 기프티콘인지 확인
        const alreadyExists = prev.some(g => g.id === selectedGifticonToAdd.id);
        if (alreadyExists) {
          console.log(`[기프티콘 추가 로드] 이미 존재하는 기프티콘입니다: id=${selectedGifticonToAdd.id}`);
          return prev; // 이미 있으면 추가하지 않음
        }

        const combined = [...prev, selectedGifticonToAdd];

        // 정렬: 1. 가격대별, 2. 같은 가격대일 경우 불러온 순서대로
        combined.sort((a, b) => {
          const priceRangeA = getPriceRange(a.original_price);
          const priceRangeB = getPriceRange(b.original_price);
          if (priceRangeA !== priceRangeB) {
            return priceRangeA - priceRangeB; // 가격대별 정렬
          }
          // 같은 가격대일 경우 불러온 순서대로
          const orderA = gifticonLoadOrder.get(a.id) ?? (a.id === selectedGifticonToAdd.id ? newOrder : 0);
          const orderB = gifticonLoadOrder.get(b.id) ?? (b.id === selectedGifticonToAdd.id ? newOrder : 0);
          return orderA - orderB;
        });
        
        return combined;
      });

      console.log(`[기프티콘 추가 로드] 성공: ${selectedGifticonToAdd.original_price}원 기프티콘 추가됨`);
      loadingGifticonIds.current.delete(selectedGifticon.id);
    } catch (error: any) {
      console.error("[기프티콘 추가 로드] 전체 오류:", error);
      loadingGifticonIds.current.delete(selectedGifticon.id);
    }
  };

  // 기프티콘 선택/해제 토글
  const handleToggle = async (gifticon: UsedGifticon) => {
    const isSelected = selectedGifticons.has(gifticon.id);

    if (isSelected) {
      // 선택 해제
      const currentSelected = selectedGifticons.get(gifticon.id);
      if (!currentSelected) return;

      // 이미 결제 완료된 기프티콘인지 확인
      if (completedPurchases.has(currentSelected.reservedId)) {
        toast.error("이미 결제 완료된 기프티콘은 환불할 수 없습니다.");
        return;
      }

      // 데모 모드일 때는 간단한 처리
      if (!isLoggedIn) {
        // 추가로 불러온 기프티콘 찾기
        const addedGifticonIds: string[] = [];
        addedGifticonRelations.forEach((parentId, addedId) => {
          if (parentId === gifticon.id) {
            addedGifticonIds.push(addedId);
          }
        });

        // 화면에서 제거할 기프티콘 찾기 (선택되지 않은 추가 기프티콘들)
        const gifticonsToRemove: string[] = [];
        for (const addedId of addedGifticonIds) {
          const isAddedGifticonSelected = Array.from(selectedGifticons.values())
            .some(selected => selected.reservedId === addedId);

          if (!isAddedGifticonSelected) {
            gifticonsToRemove.push(addedId);
          }
        }

        // 화면에서 제거 (선택되지 않은 추가 기프티콘들만)
        // 초기 로딩된 기프티콘은 항상 화면에 남아있어야 함
        // 추가로 불러온 기프티콘 중 선택되지 않은 것만 제거
        setGifticons(prev => {
          const remaining = prev.filter(g => {
            // 초기 로딩된 기프티콘은 항상 유지
            if (initialGifticonIds.has(g.id)) return true;
            // 제거 대상 추가 기프티콘만 제거
            if (gifticonsToRemove.includes(g.id)) return false;
            // 나머지는 모두 유지
            return true;
          });

          // 정렬: 1. 가격대별, 2. 같은 가격대일 경우 불러온 순서대로
          remaining.sort((a, b) => {
            const priceRangeA = getPriceRange(a.original_price);
            const priceRangeB = getPriceRange(b.original_price);
            if (priceRangeA !== priceRangeB) {
              return priceRangeA - priceRangeB; // 가격대별 정렬
            }
            // 같은 가격대일 경우 불러온 순서대로
            const orderA = gifticonLoadOrder.get(a.id) ?? 0;
            const orderB = gifticonLoadOrder.get(b.id) ?? 0;
            return orderA - orderB;
          });

          return remaining;
        });

        // 관계 맵에서 제거
        setAddedGifticonRelations(prev => {
          const newMap = new Map(prev);
          gifticonsToRemove.forEach(id => newMap.delete(id));
          return newMap;
        });

        // 선택 상태에서 제거
        const newMap = new Map(selectedGifticons);
        newMap.delete(gifticon.id);
        setSelectedGifticons(newMap);
        toast.success("선택이 취소되었습니다.");
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      try {
        // 이 기프티콘이 추가로 불러온 기프티콘인지 확인
        const parentId = addedGifticonRelations.get(gifticon.id);
        const isAddedGifticon = parentId !== undefined;

        let gifticonsToRemove: string[] = [];
        let gifticonIdsToRelease: string[] = [];

        if (isAddedGifticon) {
          // 추가로 불러온 기프티콘을 선택 해제하는 경우
          // 원본 기프티콘이 선택되어 있는지 확인 (선택 해제 직전 상태 확인)
          const parentGifticon = gifticons.find(g => g.id === parentId);
          if (!parentGifticon) {
            // 원본 기프티콘을 찾을 수 없으면 제거
            gifticonsToRemove.push(gifticon.id);
            gifticonIdsToRelease.push(currentSelected.reservedId);
          } else {
            // 원본 기프티콘이 선택되어 있는지 확인 (이번에 선택 해제하는 기프티콘 제외)
            const parentReservedId = parentGifticon.id;
            const isParentSelected = Array.from(selectedGifticons.values())
              .some(selected => selected.reservedId === parentReservedId);

            if (!isParentSelected) {
              // 원본 기프티콘이 선택되지 않았으면 추가로 불러온 기프티콘을 화면에서 제거하고 판매중으로 복구
              gifticonsToRemove.push(gifticon.id);
              gifticonIdsToRelease.push(currentSelected.reservedId);
            }
            // 원본 기프티콘이 선택되어 있으면 추가로 불러온 기프티콘은 대기중 상태 유지 (화면에도 유지)
          }
        } else {
          // 원본 기프티콘을 선택 해제하는 경우
          // 추가로 불러온 기프티콘 찾기 (이 기프티콘을 원본으로 하는 추가 기프티콘들)
          const addedGifticonIds: string[] = [];
          addedGifticonRelations.forEach((pId, addedId) => {
            if (pId === gifticon.id) {
              addedGifticonIds.push(addedId);
            }
          });

          // 화면에서 제거할 기프티콘 찾기 (선택되지 않은 추가 기프티콘들만)
          for (const addedId of addedGifticonIds) {
            // 추가로 불러온 기프티콘이 선택되어 있는지 확인
            const isAddedGifticonSelected = Array.from(selectedGifticons.values())
              .some(selected => selected.reservedId === addedId);

            if (!isAddedGifticonSelected) {
              // 선택되지 않은 추가 기프티콘은 화면에서 제거하고 판매중으로 복구
              gifticonsToRemove.push(addedId);
              gifticonIdsToRelease.push(addedId);
            }
            // 선택된 추가 기프티콘은 화면에 남아있으므로 대기중 상태 유지 (DB 업데이트 불필요)
          }
        }

        // 화면에서 제거될 추가 기프티콘만 판매중으로 복구
        // 원본 기프티콘은 화면에 남아있으므로 대기중 상태 유지
        if (gifticonIdsToRelease.length > 0) {
          const { error } = await supabase
            .from('used_gifticons')
            .update({
              status: '판매중',
              reserved_by: null,
              reserved_at: null
            })
            .in('id', gifticonIdsToRelease);

          if (error) throw error;
        }

        // 화면에서 제거 (선택되지 않은 추가 기프티콘들만)
        // 초기 로딩된 기프티콘은 항상 화면에 남아있어야 함
        // 추가로 불러온 기프티콘 중 선택되지 않은 것만 제거
        setGifticons(prev => {
          const remaining = prev.filter(g => {
            // 초기 로딩된 기프티콘은 항상 유지
            if (initialGifticonIds.has(g.id)) return true;
            // 제거 대상 추가 기프티콘만 제거
            if (gifticonsToRemove.includes(g.id)) return false;
            // 나머지는 모두 유지 (DB는 이미 대기중 상태)
            return true;
          });

          // 정렬: 1. 가격대별, 2. 같은 가격대일 경우 불러온 순서대로
          remaining.sort((a, b) => {
            const priceRangeA = getPriceRange(a.original_price);
            const priceRangeB = getPriceRange(b.original_price);
            if (priceRangeA !== priceRangeB) {
              return priceRangeA - priceRangeB; // 가격대별 정렬
            }
            // 같은 가격대일 경우 불러온 순서대로
            const orderA = gifticonLoadOrder.get(a.id) ?? 0;
            const orderB = gifticonLoadOrder.get(b.id) ?? 0;
            return orderA - orderB;
          });

          return remaining;
        });

        // 관계 맵에서 제거 (제거된 추가 기프티콘들의 관계)
        // 추가로 불러온 기프티콘을 선택 해제한 경우도 관계 맵에서 제거
        if (isAddedGifticon && gifticonsToRemove.includes(gifticon.id)) {
          setAddedGifticonRelations(prev => {
            const newMap = new Map(prev);
            newMap.delete(gifticon.id);
            return newMap;
          });
        } else {
          setAddedGifticonRelations(prev => {
            const newMap = new Map(prev);
            gifticonsToRemove.forEach(id => newMap.delete(id));
            return newMap;
          });
        }

        // 선택 상태에서 제거
        const newMap = new Map(selectedGifticons);
        newMap.delete(gifticon.id);
        setSelectedGifticons(newMap);

        toast.success("선택이 취소되었습니다.");
      } catch (error: any) {
        console.error("기프티콘 선택 해제 오류:", error);
        toast.error("선택 해제 중 오류가 발생했습니다.");
      }
    } else {
      // 선택
      // 포인트 한도 체크
      const totalCost = Array.from(selectedGifticons.values())
        .reduce((sum, item) => sum + item.sale_price, 0);
      const additionalCost = gifticon.sale_price;

      if (totalCost + additionalCost > userPoints) {
        toast.error(`포인트가 부족합니다. 보유 포인트: ${userPoints.toLocaleString()}원`);
        return;
      }

      // 데모 모드일 때는 간단한 처리
      if (!isLoggedIn) {
        setSelectedGifticons(new Map(selectedGifticons).set(gifticon.id, {
          id: gifticon.id,
          sale_price: gifticon.sale_price,
          reservedId: gifticon.id
        }));

        toast.success(`${gifticon.sale_price.toLocaleString()}원 기프티콘 선택`);
        
        // 비슷한 가격대 기프티콘 추가 로드 (데모 모드에서는 동작 안 함)
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast.error("로그인이 필요합니다.");
        return;
      }

      try {
        // 이미 대기중인 기프티콘이 있으면 그것 사용
        let reservedId = gifticon.id;

        // 현재 기프티콘이 이미 대기중인지 확인
        // 이미 화면에 표시된 기프티콘은 이미 대기중 상태이므로 그대로 사용
        if (gifticon.id) {
          reservedId = gifticon.id;
        } else {
          // 판매중인 기프티콘 중에서 하나 선택하여 대기중으로 변경
          const { data: availableItems, error: fetchError } = await supabase
            .from('used_gifticons')
            .select('id')
            .eq('status', '판매중')
            .eq('available_at', storeBrand)
            .eq('sale_price', gifticon.sale_price)
            .limit(1);

          if (!fetchError && availableItems && availableItems.length > 0) {
            reservedId = availableItems[0].id;
          } else {
            // 판매중인 기프티콘이 없으면 에러
            throw new Error("선택 가능한 기프티콘이 없습니다.");
          }
        }

        // 대기중으로 변경
        const { error: reserveError } = await supabase
          .from('used_gifticons')
          .update({
            status: '대기중',
            reserved_by: session.user.id,
            reserved_at: new Date().toISOString()
          })
          .eq('id', reservedId);

        if (reserveError) throw reserveError;

        // 선택 상태 업데이트
        setSelectedGifticons(new Map(selectedGifticons).set(gifticon.id, {
          id: gifticon.id,
          sale_price: gifticon.sale_price,
          reservedId: reservedId
        }));

        toast.success(`${gifticon.sale_price.toLocaleString()}원 기프티콘 선택`);

        // 비슷한 가격대 기프티콘 추가 로드
        await loadSimilarPriceGifticons(gifticon);
      } catch (error: any) {
        console.error("기프티콘 선택 오류:", error);
        toast.error(error.message || "기프티콘 선택 중 오류가 발생했습니다.");
      }
    }
  };


  // 총 선택한 포인트 계산 (결제 완료된 기프티콘 제외)
  const totalCost = Array.from(selectedGifticons.values())
    .reduce((sum, item) => {
      // 이미 결제 완료된 기프티콘은 제외
      if (completedPurchases.has(item.reservedId)) {
        return sum;
      }
      return sum + item.sale_price;
    }, 0);

  // 총 기프티콘 금액권 계산 (original_price 합계)
  const totalOriginalPrice = Array.from(selectedGifticons.values())
    .reduce((sum, item) => {
      const gifticon = gifticons.find(g => g.sale_price === item.sale_price);
      if (gifticon) {
        return sum + gifticon.original_price;
      }
      return sum;
    }, 0);

  // 총 할인 금액 계산
  const totalDiscount = Array.from(selectedGifticons.values())
    .reduce((sum, item) => {
      const gifticon = gifticons.find(g => g.sale_price === item.sale_price);
      if (gifticon) {
        const discountPerItem = gifticon.original_price - gifticon.sale_price;
        return sum + discountPerItem;
      }
      return sum;
    }, 0);

  const handlePayment = async () => {
    // 선택한 기프티콘이 없으면 바로 Step 2로 이동
    if (selectedGifticons.size === 0) {
      setStep(2);
      return;
    }

    if (totalCost > userPoints) {
      toast.error("포인트가 부족합니다.");
      return;
    }

    // 데모 모드일 때는 간단한 처리
    if (!isLoggedIn) {
      // 데모 모드에서 더미 바코드 맵 생성 (각 기프티콘마다 고유한 바코드)
      const demoBarcodeMap = new Map<string, string>();
      for (const selected of selectedGifticons.values()) {
        const gifticon = gifticons.find(g => g.sale_price === selected.sale_price);
        if (gifticon) {
          // 기본 바코드 사용
          const baseBarcode = gifticon.barcode;
          demoBarcodeMap.set(selected.reservedId, baseBarcode);
        }
      }
      setActualGifticonBarcodes(demoBarcodeMap);
      toast.success("결제가 완료되었습니다! (데모 모드)");
      // 데모 모드에서는 선택 상태를 유지하여 Step 2에서 바코드를 표시할 수 있도록 함
      setStep(2);
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
      const purchasedGifticonsData: Array<{ gifticon: UsedGifticon; reservedId: string }> = [];
      
      for (const selected of selectedGifticons.values()) {
        allReservedIds.push(selected.reservedId);
        const gifticon = gifticons.find(g => g.sale_price === selected.sale_price);
        if (gifticon) {
          purchasedGifticonsData.push({ gifticon, reservedId: selected.reservedId });
        }
      }

      // 이미 결제 완료된 기프티콘 제외하고 새로 결제할 항목만 필터링
      const newReservedIds = allReservedIds.filter(id => !completedPurchases.has(id));

      // 새로 결제할 항목이 없으면 Step 2로 이동만
      if (newReservedIds.length === 0) {
        setIsLoading(false);
        setStep(2);
        return;
      }

      // used_gifticons에서 상세 정보 조회 (새로 결제할 항목만)
      const { data: usedGifticonsData, error: fetchError } = await supabase
        .from('used_gifticons')
        .select('*')
        .in('id', newReservedIds);

      if (fetchError) throw fetchError;

      // 타입 안전성을 위한 타입 단언 (name 필드가 추가됨)
      type UsedGifticonWithName = UsedGifticon & { name?: string };
      const typedGifticonsData = usedGifticonsData as UsedGifticonWithName[];

      // 판매완료로 상태 변경 (새로 결제할 항목만)
      console.log("판매완료 변경 시도:", newReservedIds);
      const { error: updateError } = await supabase
        .from('used_gifticons')
        .update({ status: '판매완료' })
        .in('id', newReservedIds);

      if (updateError) {
        console.error("판매완료 변경 오류:", updateError);
        throw updateError;
      }
      console.log("판매완료 변경 성공");

      // gifticons 테이블에 구매한 기프티콘 추가
      if (typedGifticonsData && typedGifticonsData.length > 0) {
        const gifticonsToInsert = typedGifticonsData.map((item) => ({
          user_id: session.user.id,
          brand: item.available_at, // available_at을 brand로 사용
          name: item.name || `${item.available_at} 기프티콘`, // used_gifticons의 name 사용 (없으면 fallback)
          image: '🎫', // 기본 이미지
          original_price: item.original_price,
          expiry_date: item.expiry_date,
          status: '사용가능', // 초기 상태는 사용가능 (step 2 진입 시 사용완료로 변경)
          is_selling: false,
        }));

        const { error: insertError } = await supabase
          .from('gifticons')
          .insert(gifticonsToInsert);

        if (insertError) throw insertError;

        // 방금 구매한 기프티콘 개수 저장 (step 2에서 사용완료 처리 시 사용)
        setRecentlyPurchasedCount(typedGifticonsData.length);
      }

      // 포인트 차감
      const { error: pointsError } = await supabase
        .from('profiles')
        .update({ points: userPoints - totalCost })
        .eq('id', session.user.id);

      if (pointsError) throw pointsError;

      setUserPoints(userPoints - totalCost);
      toast.success("결제가 완료되었습니다!");
      
      // 결제 완료된 기프티콘 ID 저장 (기존 + 새로 결제한 항목)
      setCompletedPurchases(prev => new Set([...prev, ...newReservedIds]));
      
      // 선택 상태는 유지 (뒤로가기 방지용)
      setStep(2);
    } catch (error: any) {
      console.error("결제 오류:", error);
      toast.error(error.message || "결제 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 결제 완료 처리 (상태 초기화 및 메인으로 이동)
  const handlePaymentComplete = () => {
    setSelectedGifticons(new Map());
    setCompletedPurchases(new Set());
    navigate('/main');
  };

  const handleConfirmStep1 = () => {
    // 결제 처리
    handlePayment();
  };

  // Step 2에서 결제하기 버튼 클릭 시 네이버페이 앱 실행
  const handlePayWithNaverPay = () => {
    // 안드로이드 전용 - 네이버페이 앱 패키지명
    if (window.location) {
      window.location.href = "intent://launch#Intent;package=com.samsung.android.spay;end;";
    }
  };

  // Step 2에서 뒤로가기 클릭 시 처리
  const handleBackFromStep2 = () => {
    setStep(1);
  };

  // 2단계에서 보여줄 총 카드 수 (기프티콘 + 멤버십)
  const totalCards = selectedGifticons.size + 1;

  const BarcodeDisplay = ({ number }: { number: string }) => {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
      if (svgRef.current && number) {
        try {
          // 숫자만 추출 (문자열이 있을 수 있음)
          const barcodeNumber = number.replace(/\D/g, '');
          
          if (barcodeNumber.length === 0) {
            return;
          }

          // EAN-13 형식인지 확인 (13자리)
          if (barcodeNumber.length === 13) {
            try {
              JsBarcode(svgRef.current, barcodeNumber, {
                format: "EAN13",
                width: 2,
                height: 80,
                displayValue: false,
                background: "transparent",
                lineColor: "#000000",
                margin: 0,
              });
            } catch (ean13Error) {
              // EAN-13 체크섬 오류 시 CODE128로 대체
              console.warn("EAN13 체크섬 오류, CODE128로 변경:", ean13Error);
              JsBarcode(svgRef.current, barcodeNumber, {
                format: "CODE128",
                width: 2,
                height: 80,
                displayValue: false,
                background: "transparent",
                lineColor: "#000000",
                margin: 0,
              });
            }
          } else if (barcodeNumber.length === 8) {
            // EAN-8 형식 (8자리)
            try {
              JsBarcode(svgRef.current, barcodeNumber, {
                format: "EAN8",
                width: 2,
                height: 80,
                displayValue: false,
                background: "transparent",
                lineColor: "#000000",
                margin: 0,
              });
            } catch (ean8Error) {
              // EAN-8 체크섬 오류 시 CODE128로 대체
              console.warn("EAN8 체크섬 오류, CODE128로 변경:", ean8Error);
              JsBarcode(svgRef.current, barcodeNumber, {
                format: "CODE128",
                width: 2,
                height: 80,
                displayValue: false,
                background: "transparent",
                lineColor: "#000000",
                margin: 0,
              });
            }
          } else {
            // CODE128 형식 (다양한 길이 지원)
            JsBarcode(svgRef.current, barcodeNumber, {
              format: "CODE128",
              width: 2,
              height: 80,
              displayValue: false,
              background: "transparent",
              lineColor: "#000000",
              margin: 0,
            });
          }
        } catch (error) {
          console.error("바코드 생성 오류:", error);
        }
      }
    }, [number]);

    return (
      <div className="space-y-1">
        <div className="flex items-center justify-center bg-white p-3 rounded-lg">
          <svg
            ref={svgRef}
            className="max-w-full h-20"
            style={{ maxHeight: '80px' }}
          />
        </div>
        <p className="text-center font-mono text-xs tracking-widest">{number}</p>
      </div>
    );
  };

  // 선택한 기프티콘 목록 생성
  const purchasedGifticonsList: Array<{ id: string; gifticon: UsedGifticon }> = [];
  for (const selected of selectedGifticons.values()) {
    const gifticon = gifticons.find(g => g.sale_price === selected.sale_price);
    if (gifticon) {
      purchasedGifticonsList.push({ id: selected.reservedId || gifticon.id, gifticon });
    }
  }

  // Step 2 진입 시 예약된 기프티콘의 실제 바코드 조회
  useEffect(() => {
    const fetchActualBarcodes = async () => {
      if (step !== 2 || selectedGifticons.size === 0) return;

      // 모든 예약된 기프티콘 ID 수집
      const allReservedIds: string[] = [];
      for (const selected of selectedGifticons.values()) {
        allReservedIds.push(selected.reservedId);
      }

      if (allReservedIds.length === 0) return;

      // 데모 모드에서는 실제 바코드 조회 불필요 (이미 gifticon.barcode에 있음)
      if (!isLoggedIn) {
        return;
      }

      try {
        // 각 예약된 기프티콘의 실제 바코드 조회
        const { data: gifticonsData, error } = await supabase
          .from('used_gifticons')
          .select('id, barcode')
          .in('id', allReservedIds);

        if (error) throw error;

        if (gifticonsData) {
          const barcodeMap = new Map<string, string>();
          gifticonsData.forEach((item) => {
            barcodeMap.set(item.id, item.barcode);
          });
          setActualGifticonBarcodes(barcodeMap);
        }
      } catch (error: any) {
        console.error("기프티콘 바코드 조회 오류:", error);
      }
    };

    fetchActualBarcodes();
  }, [step, selectedGifticons, isLoggedIn]);

  // Step 2 진입 시 (바코드 표시 시) 자동으로 사용완료 처리
  useEffect(() => {
    const markGifticonsAsUsed = async () => {
      if (step !== 2 || recentlyPurchasedCount === 0) return;
      if (!isLoggedIn) return; // 데모 모드에서는 사용완료 처리 불필요

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      try {
        // 가장 최근에 구매한 기프티콘들을 조회 (방금 추가된 것들)
        const { data: recentGifticons, error: fetchError } = await supabase
          .from('gifticons')
          .select('id')
          .eq('user_id', session.user.id)
          .eq('status', '사용가능')
          .order('created_at', { ascending: false })
          .limit(recentlyPurchasedCount);

        if (fetchError) throw fetchError;

        // 방금 구매한 기프티콘들을 사용완료로 변경
        if (recentGifticons && recentGifticons.length > 0) {
          const gifticonIds = recentGifticons.map(g => g.id);
          const { error: updateError } = await supabase
            .from('gifticons')
            .update({ status: '사용완료' })
            .in('id', gifticonIds)
            .eq('user_id', session.user.id)
            .eq('status', '사용가능');

          if (updateError) throw updateError;

          // 처리 완료 후 카운트 초기화
          setRecentlyPurchasedCount(0);
        }
      } catch (error: any) {
        console.error("기프티콘 사용완료 처리 오류:", error);
        // 오류가 발생해도 사용자에게는 표시하지 않음 (이미 바코드는 보여주고 있으므로)
      }
    };

    // step 2 진입 후 약간의 딜레이를 두고 실행 (상태 업데이트 완료 후)
    const timer = setTimeout(() => {
      markGifticonsAsUsed();
    }, 500);

    return () => clearTimeout(timer);
  }, [step, recentlyPurchasedCount, isLoggedIn]);

  // 초기 로딩 중일 때 전체 로딩 화면 표시
  if (isInitialLoading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-muted-foreground">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-background ${step === 2 ? 'h-screen overflow-hidden' : 'min-h-screen pb-6'}`}>
      {step === 1 && (
        <header className="sticky top-0 z-50 bg-card border-b border-border">
          <div className="max-w-md mx-auto py-4 relative">
            <Link to="/main" className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold w-full text-center">
              {actualStoreName || "매장"}
            </h1>
          </div>
        </header>
      )}
      
      <main className={`max-w-md mx-auto ${step === 2 ? 'h-full flex flex-col pl-14 pr-4 overflow-hidden' : 'px-4 py-6 space-y-4'}`}>
        {step === 1 ? (
          <>
            {/* Payment Method Selection */}
            <div className="space-y-3">
              <h2 className="text-lg font-bold mb-4">결제방식 추천</h2>
              {isLoadingPaymentMethods ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground">결제 방식 정보를 불러오는 중...</p>
                </div>
              ) : paymentMethods.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground">사용 가능한 결제 방식이 없습니다.</p>
                </div>
              ) : (
                paymentMethods.map((method) => {
                const isSelected = selectedPaymentOptions.has(method.id);
                const isEnabled = method.enabled || false;
                const isGifticon = method.type === 'gifticon';
                const isMembership = method.type === 'membership';
                const isCombined = method.type === 'combined';
                
                // 할인율/적립률 표시 계산 (description 우선 사용)
                let displayDiscount = method.description || "";
                if (!displayDiscount) {
                  if (isGifticon) {
                    displayDiscount = method.gifticonDiscount ? `${method.gifticonDiscount}% 할인` : gifticonMethodDiscount;
                  } else if (isMembership && method.method_type) {
                    if (method.method_type === '적립' && method.rate) {
                      displayDiscount = `${method.rate}% 적립`;
                    } else if (method.method_type === '스탬프') {
                      displayDiscount = "스탬프 적립";
                    } else if (method.method_type === '결제' && method.rate) {
                      displayDiscount = `${method.rate}% 할인`;
                    } else {
                      displayDiscount = "적용";
                    }
                  } else if (isCombined) {
                    displayDiscount = method.description || "적용";
                  } else {
                    displayDiscount = "적용";
                  }
                }
                
                return (
                  <Card
                    key={method.id}
                    className={`p-4 transition-all border-2 ${
                      !isEnabled
                        ? "bg-muted/30 border-muted opacity-60 cursor-not-allowed"
                        : isSelected
                        ? "border-primary bg-primary/5 cursor-pointer"
                        : "border-border/50 hover:border-border cursor-pointer"
                    }`}
                    onClick={() => {
                      if (isEnabled) {
                        const newSet = new Set(selectedPaymentOptions);
                        if (isSelected) {
                          newSet.delete(method.id);
                        } else {
                          newSet.add(method.id);
                        }
                        setSelectedPaymentOptions(newSet);
                      }
                    }}
                  >
                    <div className="relative">
                      {!isEnabled && (
                        <div className="absolute inset-0 flex items-center justify-center z-10">
                          <div className="bg-muted/90 px-4 py-2 rounded-lg border-2 border-muted-foreground/50">
                            <span className="text-sm font-semibold text-muted-foreground">
                              추후 서비스 예정
                            </span>
                          </div>
                        </div>
                      )}
                      <div className={`flex items-start justify-between ${!isEnabled ? 'opacity-50' : ''}`}>
                        <div className="flex items-center gap-3 flex-1">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              if (!isEnabled) return;
                              const newSet = new Set(selectedPaymentOptions);
                              if (checked) {
                                newSet.add(method.id);
                              } else {
                                newSet.delete(method.id);
                              }
                              setSelectedPaymentOptions(newSet);
                            }}
                            disabled={!isEnabled}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <h3 className={`font-semibold text-sm ${!isEnabled ? 'text-muted-foreground' : ''}`}>
                              {method.name}
                            </h3>
                            {displayDiscount && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {displayDiscount}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
                })
              )}
            </div>

            {/* Gifticon Section */}
            {canUseGifticon && (
              <>
                {/* 가격 입력창 */}
                <div className="space-y-2 mb-4">
                  <label className="text-sm font-medium">결제할 금액 입력 (선택사항)</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="금액을 입력하세요 (원)"
                      value={inputBudget ?? ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "") {
                          setInputBudget(null);
                        } else {
                          const numValue = parseInt(value, 10);
                          if (!isNaN(numValue) && numValue > 0) {
                            setInputBudget(numValue);
                          }
                        }
                      }}
                      className="flex-1"
                      min="0"
                      disabled={isAutoSelectMode}
                    />
                    {isAutoSelectMode ? (
                      <Button
                        onClick={cancelAutoSelect}
                        variant="outline"
                        className="shrink-0"
                      >
                        취소
                      </Button>
                    ) : (
                      <Button
                        onClick={executeAutoSelect}
                        disabled={!inputBudget || inputBudget <= 0}
                        className="shrink-0"
                      >
                        확인
                      </Button>
                    )}
                  </div>
                </div>

                <Card className="p-5 rounded-2xl border-border/50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Gift className="w-5 h-5 text-primary" />
                      </div>
                      <h2 className={`${isAutoSelectMode ? "text-base" : "text-lg"} font-bold`}>
                        {isAutoSelectMode ? "기프티콘 자동선택" : "추천 기프티콘"}
                      </h2>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      보유 포인트: {userPoints.toLocaleString()}원
                    </div>
                  </div>
                
                {isAutoSelectMode ? (
                  // 자동선택 모드
                  <>
                    {isLoading ? (
                      <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
                    ) : autoSelectGifticons.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        사용 가능한 기프티콘이 없습니다.
                      </div>
                    ) : (
                      <>
                        <div className="space-y-3">
                          {autoSelectGifticons.map((gifticon) => {
                            const isSelected = selectedGifticons.has(gifticon.id);
                            const discountAmount = gifticon.original_price - gifticon.sale_price;
                            const discountPercent = Math.round((discountAmount / gifticon.original_price) * 100);
                            
                            return (
                              <div
                                key={gifticon.id}
                                className={`p-4 rounded-xl transition-all cursor-pointer ${
                                  isSelected ? "bg-primary/10 border-2 border-primary" : "bg-muted/50 border border-transparent hover:border-border"
                                }`}
                                onClick={() => handleToggle(gifticon)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <p className="font-semibold">{gifticon.name || "기프티콘"}</p>
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
                                  <div className="flex items-center">
                                    <Checkbox
                                      checked={isSelected}
                                      disabled={isLoading || (!isSelected && totalCost + gifticon.sale_price > userPoints)}
                                      className="w-5 h-5"
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {inputBudget && inputBudget > 0 && (
                          <div className="mt-4">
                            <Button
                              onClick={runAutoSelect}
                              className="w-full"
                              disabled={isLoading || autoSelectGifticons.length === 0}
                            >
                              자동 선택
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </>
                ) : (
                  // 추천 기프티콘 모드
                  <>
                    {isLoading ? (
                      <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
                    ) : gifticons.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        등록된 기프티콘이 없습니다.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {gifticons.map((gifticon) => {
                          const isSelected = selectedGifticons.has(gifticon.id);
                          const discountAmount = gifticon.original_price - gifticon.sale_price;
                          const discountPercent = Math.round((discountAmount / gifticon.original_price) * 100);
                          
                          return (
                            <div
                              key={gifticon.id}
                              className={`p-4 rounded-xl transition-all cursor-pointer ${
                                isSelected ? "bg-primary/10 border-2 border-primary" : "bg-muted/50 border border-transparent hover:border-border"
                              }`}
                              onClick={() => handleToggle(gifticon)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <p className="font-semibold">{gifticon.name || "기프티콘"}</p>
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
                                <div className="flex items-center">
                                  <Checkbox
                                    checked={isSelected}
                                    disabled={isLoading || (!isSelected && totalCost + gifticon.sale_price > userPoints)}
                                    className="w-5 h-5"
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}

                {selectedGifticons.size > 0 && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">총 구매 포인트</span>
                      <span className="font-bold text-lg text-primary">
                        {totalCost.toLocaleString()}원
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-muted-foreground">총 기프티콘 금액권</span>
                      <span className="font-semibold">
                        {totalOriginalPrice.toLocaleString()}원
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-muted-foreground">총 할인 금액</span>
                      <span className="font-semibold text-primary">
                        {totalDiscount.toLocaleString()}원
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
              </>
            )}

            {/* Confirm Button */}
            <Button
              onClick={handleConfirmStep1}
              className="w-full h-14 text-lg font-semibold rounded-xl"
              disabled={isLoading}
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
                onClick={handleBackFromStep2}
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
                  // 실제 바코드가 있으면 사용, 없으면 기본 바코드 사용
                  // 데모 모드에서도 각 기프티콘마다 고유한 바코드 생성
                  let actualBarcode = actualGifticonBarcodes.get(item.id);
                  if (!actualBarcode) {
                    // 데모 모드에서 바코드 맵에 값이 없을 경우, 인덱스 기반으로 고유한 바코드 생성
                    if (!isLoggedIn) {
                      const baseBarcode = gifticon.barcode;
                      const baseNumber = parseInt(baseBarcode.replace(/\D/g, '')) || 1234567890123;
                      const uniqueNumber = baseNumber + index;
                      actualBarcode = String(uniqueNumber).padStart(13, '0').slice(0, 13);
                    } else {
                      actualBarcode = gifticon.barcode;
                    }
                  }
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
                          <BarcodeDisplay number={actualBarcode} />
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <Gift className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">기프티콘</p>
                              <p className="font-bold text-sm">{gifticon.name || "기프티콘"}</p>
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
                  <Card className="p-4 rounded-2xl border-border/50 relative">
                    {/* 추후 서비스 예정 오버레이 */}
                    <div className="absolute inset-0 flex items-center justify-center z-10 bg-background/80 rounded-2xl">
                      <div className="bg-muted/90 px-4 py-2 rounded-lg border-2 border-muted-foreground/50">
                        <span className="text-sm font-semibold text-muted-foreground">
                          추후 서비스 예정
                        </span>
                      </div>
                    </div>
                    <div className="space-y-3 opacity-50">
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

            <div className="absolute bottom-4 left-4 right-4 space-y-3">
              <div className="relative">
                {/* 추후 서비스 예정 오버레이 - 왼쪽에 배치 */}
                <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                  <div className="bg-muted/90 px-2 py-1 rounded-md border border-muted-foreground/50">
                    <span className="text-xs font-semibold text-muted-foreground">
                      추후 서비스 예정
                    </span>
                  </div>
                </div>
                <Button
                  onClick={handlePayWithNaverPay}
                  className="w-full h-14 text-lg font-semibold rounded-xl opacity-50"
                  disabled={true}
                >
                  {isLoading ? "처리 중..." : "결제앱 실행"}
                </Button>
              </div>
              <Button
                onClick={handlePaymentComplete}
                className="w-full h-14 text-lg font-semibold rounded-xl"
              >
                결제 완료
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Payment;
