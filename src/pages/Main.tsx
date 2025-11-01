import { MapPin, ArrowUpDown, Search, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import StoreCard from "@/components/StoreCard";
import BottomNav from "@/components/BottomNav";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Main = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<"distance" | "discount">("distance");
  const [currentLocation, setCurrentLocation] = useState("위치 가져오는 중...");
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  interface StoreData {
    id: string;
    name: string;
    distance: string;
    distanceNum: number;
    image: string;
    maxDiscount: string | null; // 할인율이 없으면 null
    discountNum: number; // 정렬용 할인율 (0-100)
    maxDiscountPercent: number | null; // 최대 할인율 (%)
    lat?: number;
    lon?: number;
    address?: string;
  }

  const [stores, setStores] = useState<StoreData[]>([]);
  const [isLoadingStores, setIsLoadingStores] = useState(true);
  const [currentCoords, setCurrentCoords] = useState<{latitude: number, longitude: number} | null>(null);

  // 더미 기프티콘 데이터 (브랜드별)
  const dummyGifticonsByBrand: Record<string, Array<{ original_price: number; sale_price: number }>> = {
    starbucks: [
      { original_price: 4500, sale_price: 3600 }, // 20% 할인
      { original_price: 5000, sale_price: 4250 }, // 15% 할인
    ],
    baskin: [
      { original_price: 3500, sale_price: 2800 }, // 20% 할인
      { original_price: 4000, sale_price: 3400 }, // 15% 할인
    ],
    mega: [
      { original_price: 3000, sale_price: 2400 }, // 20% 할인
      { original_price: 3500, sale_price: 2975 }, // 15% 할인
    ],
    pascucci: [
      { original_price: 5000, sale_price: 4000 }, // 20% 할인
      { original_price: 5500, sale_price: 4675 }, // 15% 할인
    ],
    twosome: [
      { original_price: 4000, sale_price: 3200 }, // 20% 할인
      { original_price: 4500, sale_price: 3825 }, // 15% 할인
    ],
  };

  // 더미 데이터에서 할인율 계산 함수
  const calculateDummyDiscount = (store: StoreData): { maxDiscount: string | null; discountNum: number; maxDiscountPercent: number | null } => {
    // 파스쿠찌가 아닌 경우 할인율 표시하지 않음
    if (store.image !== 'pascucci') {
      return {
        maxDiscount: null,
        discountNum: 0,
        maxDiscountPercent: null,
      };
    }

    // 파스쿠찌만 할인율 계산
    // 지역화폐 할인율 (더미 데이터용)
    const localCurrencyDiscount = 13; // 파스쿠찌 삼성점은 13% 지역화폐 할인

    // 기프티콘 할인율 계산
    let maxGifticonDiscount = 0;
    const gifticons = dummyGifticonsByBrand[store.image] || [];
    if (gifticons.length > 0) {
      const discounts = gifticons.map(g => {
        const discountAmount = g.original_price - g.sale_price;
        return Math.round((discountAmount / g.original_price) * 100);
      });
      maxGifticonDiscount = Math.max(...discounts);
    }

    // 최대 할인율 계산
    const maxDiscountPercent = Math.max(localCurrencyDiscount, maxGifticonDiscount);

    return {
      maxDiscount: maxDiscountPercent > 0 ? `최대 ${maxDiscountPercent}% 할인` : null,
      discountNum: maxDiscountPercent,
      maxDiscountPercent: maxDiscountPercent > 0 ? maxDiscountPercent : null,
    };
  };

  // 더미 데이터
  const dummyStoresRaw: Omit<StoreData, 'maxDiscount' | 'discountNum' | 'maxDiscountPercent'>[] = [
    {
      id: "dummy-1",
      name: "스타벅스 강남역점",
      distance: "350m",
      distanceNum: 350,
      image: "starbucks",
      address: "서울 강남구 강남대로 지하 396"
    },
    {
      id: "dummy-2",
      name: "베스킨라빈스 역삼점",
      distance: "520m",
      distanceNum: 520,
      image: "baskin",
      address: "서울 강남구 역삼동 735-3"
    },
    {
      id: "dummy-3",
      name: "메가커피 테헤란로점",
      distance: "280m",
      distanceNum: 280,
      image: "mega",
      address: "서울 강남구 테헤란로 123"
    },
    {
      id: "dummy-4",
      name: "파스쿠찌 삼성점",
      distance: "450m",
      distanceNum: 450,
      image: "pascucci",
      address: "서울 강남구 삼성동 156-1"
    },
    {
      id: "dummy-5",
      name: "투썸플레이스 논현점",
      distance: "610m",
      distanceNum: 610,
      image: "twosome",
      address: "서울 강남구 논현동 120-5"
    },
    {
      id: "dummy-6",
      name: "스타벅스 선릉역점",
      distance: "730m",
      distanceNum: 730,
      image: "starbucks",
      address: "서울 강남구 선릉로 428"
    },
  ];

  // 더미 데이터에 할인 정보 추가
  const dummyStores: StoreData[] = dummyStoresRaw.map(store => {
    const discountInfo = calculateDummyDiscount(store as StoreData);
    return {
      ...store,
      ...discountInfo,
    };
  });

  const getAddressFromCoords = async (latitude: number, longitude: number) => {
    try {
      console.log("🏠 [주소 변환] 시작:", { latitude, longitude });
      
      // Kakao Maps SDK 로드 보장
      const { loadKakaoMaps } = await import("@/lib/kakao");
      await loadKakaoMaps();
      
      const kakao = (window as any).kakao;
      if (!kakao?.maps?.services) {
        console.error("❌ [주소 변환] Kakao Maps services를 찾을 수 없습니다");
        return "위치를 확인할 수 없음";
      }

      // Geocoder 서비스 사용 (JavaScript 키로 가능)
      const geocoder = new kakao.maps.services.Geocoder();
      
      return new Promise<string>((resolve) => {
        const coord = new kakao.maps.LatLng(latitude, longitude);
        const callback = (result: any, status: any) => {
          if (status === kakao.maps.services.Status.OK) {
            console.log("✅ [주소 변환] Kakao Geocoder 응답:", result);
            
            if (result.length > 0) {
              // 지번 주소 우선, 없으면 도로명 주소 사용
              const address = result[0].address || result[0].road_address;
              
              if (address) {
                console.log("주소 데이터:", address);
                
                // 시/군 단위 추출 (예: 제주시, 서울특별시 -> 서울시)
                let cityName = "";
                
                // region_2depth_name에 시/군/구 정보가 있음 (예: 제주시, 강남구)
                if (address.region_2depth_name) {
                  cityName = address.region_2depth_name;
                  
                  // 서울특별시, 부산광역시 같은 경우 region_1depth_name 사용
                  if (address.region_1depth_name && 
                      (address.region_1depth_name.includes('특별시') || 
                       address.region_1depth_name.includes('광역시'))) {
                    // 서울특별시 -> 서울시, 부산광역시 -> 부산시
                    cityName = address.region_1depth_name
                      .replace(/특별시$/, '시')
                      .replace(/광역시$/, '시');
                  }
                } else if (address.region_1depth_name) {
                  // region_2depth_name이 없는 경우 (특별자치도 등)
                  cityName = address.region_1depth_name
                    .replace(/특별자치도$/, '')
                    .replace(/도$/, '')
                    .replace(/특별시$/, '시')
                    .replace(/광역시$/, '시');
                }
                
                // 동/읍/면 단위 추출 (예: 연동)
                let districtName = "";
                if (address.region_3depth_name) {
                  districtName = address.region_3depth_name;
                } else if (address.region_3depth_h_name) {
                  // 행정동이 있는 경우
                  districtName = address.region_3depth_h_name;
                }
                
                // 결과 조합: "제주시 연동" 형식 (시/동 또는 읍/면까지)
                if (cityName && districtName) {
                  const formattedAddress = `${cityName} ${districtName}`;
                  console.log("✅ [주소 변환] 최종 주소:", formattedAddress);
                  resolve(formattedAddress);
                  return;
                } else if (cityName) {
                  console.log("✅ [주소 변환] 최종 주소:", cityName);
                  resolve(cityName);
                  return;
                }
              }
            }
          } else {
            console.error("❌ [주소 변환] Geocoder 상태:", status);
          }
          
          resolve("위치를 확인할 수 없음");
        };
        
        geocoder.coord2Address(coord.getLng(), coord.getLat(), callback);
      });
    } catch (error) {
      console.error("❌ [주소 변환] 실패:", error);
      return "위치를 확인할 수 없음";
    }
  };

  useEffect(() => {
    // 이전 로그인 상태를 추적하기 위한 ref 사용
    const prevSessionRef = { current: null as any };
    
    const checkAuthAndInitLocation = async () => {
      console.log("🔐 [인증 확인] 시작");
      
      // 매직링크로 리다이렉트된 경우 처리 (PKCE flow)
      // 매직링크가 /main?token_hash=...로 리다이렉트되는 경우를 처리
      const urlParams = new URLSearchParams(window.location.search);
      const tokenHash = urlParams.get('token_hash');
      const typeFromQuery = urlParams.get('type');
      
      if (tokenHash) {
        console.log("🔗 [매직링크 처리] token_hash 발견:", tokenHash.substring(0, 20) + "...");
        try {
          const {
            data: { session, user },
            error,
          } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: (typeFromQuery || 'email') as 'email' | 'magiclink',
          });

          if (error) {
            console.error("❌ [매직링크 인증 오류]:", error);
            toast({
              title: "인증 실패",
              description: error.message || "인증 링크가 유효하지 않습니다.",
              variant: "destructive",
            });
            // URL 정리 후 로그인 페이지로 이동
            window.history.replaceState({}, document.title, "/main");
            navigate("/");
            return;
          } 
          
          if (session && user) {
            console.log("✅ [매직링크 인증 성공]");
            toast({
              title: "로그인 성공",
              description: "환영합니다!",
            });
            // URL 정리 (query string 제거)
            window.history.replaceState({}, document.title, "/main");
            // 인증 완료 후 계속 진행 (return 없이 계속 실행)
            setIsLoggedIn(true);
            // 여기서 return 하지 않고 계속 진행하여 위치 초기화 수행
          } else {
            console.error("❌ [매직링크] 세션 생성 실패");
            throw new Error("세션을 생성할 수 없습니다.");
          }
        } catch (error: any) {
          console.error("❌ [매직링크 처리 오류]:", error);
          toast({
            title: "인증 실패",
            description: error.message || "인증 링크 처리 중 오류가 발생했습니다.",
            variant: "destructive",
          });
          // URL 정리
          window.history.replaceState({}, document.title, "/main");
          navigate("/");
          return;
        }
      }
      
      // 로그인 상태 확인 (매직링크 처리 후에도 실행됨)
      const { data: { session } } = await supabase.auth.getSession();
      const loggedIn = !!session;
      setIsLoggedIn(loggedIn);
      console.log(`🔐 [인증 상태] ${loggedIn ? '로그인됨' : '로그인 안됨'}`);
      
      // 초기 세션 상태를 ref에 저장 (onAuthStateChange에서 사용)
      prevSessionRef.current = session;
      
      if (!loggedIn) {
        // 로그인하지 않은 경우 더미 데이터 사용
        console.log("📦 [더미 데이터] 사용");
        setCurrentLocation("강남구 역삼동");
        setStores(dummyStores);
        // localStorage에 더미 데이터 저장 (Payment 페이지에서 사용)
        try {
          localStorage.setItem('nearbyStores', JSON.stringify(dummyStores));
        } catch (e) {
          console.error("localStorage 저장 오류:", e);
        }
        setIsLoadingLocation(false);
        setIsLoadingStores(false);
        return;
      }

      // 로그인한 경우 실제 위치 가져오기
      console.log("📍 [위치 초기화] 시작");
      
      // Kakao SDK 로드 보장
      try {
        const { loadKakaoMaps } = await import("@/lib/kakao");
        await loadKakaoMaps();
        console.log("✅ [Kakao SDK] 로드 완료");
      } catch (error: any) {
        console.error("❌ [위치 초기화] Kakao SDK 로드 실패:", error);
        setIsLoadingLocation(false);
        const defaultLocation = "강남구 역삼동";
        setCurrentLocation(defaultLocation);
        localStorage.setItem("selectedLocation", defaultLocation);
        toast({
          title: "위치 기반 검색 불가",
          description: error.message || "카카오 SDK 설정 오류입니다. 배포 환경에 VITE_KAKAO_APP_KEY 환경 변수를 설정해주세요.",
          variant: "destructive",
        });
        // SDK 없이도 기본 위치로 설정
        setIsLoadingStores(false);
        setStores([]);
        return;
      }

      // Main 페이지 진입 시 항상 현재 위치를 새로 가져오기
      setIsLoadingLocation(true);

      // 위치 권한 확인 및 현재 위치 가져오기
      if (navigator.geolocation) {
        console.log("🌍 [위치 정보] 브라우저 위치 정보 요청 시작");
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            console.log("✅ [위치 정보] 좌표 획득 성공:", { latitude, longitude });
            
            // 좌표를 주소로 변환
            console.log("🏠 [주소 변환] 시작");
            const address = await getAddressFromCoords(latitude, longitude);
            console.log("✅ [주소 변환] 완료:", address);
            
            // 저장 및 표시
            localStorage.setItem("selectedLocation", address);
            localStorage.setItem("currentCoordinates", JSON.stringify({ latitude, longitude }));
            setCurrentLocation(address);
            setCurrentCoords({ latitude, longitude });
            setIsLoadingLocation(false);
            
            // 매장 정보 가져오기
            console.log("🏪 [매장 검색] fetchNearbyStores 호출 시작");
            await fetchNearbyStores(latitude, longitude);
          },
          (error) => {
            console.error("❌ [위치 정보] 획득 실패:", error);
            console.log("에러 코드:", error.code);
            console.log("에러 메시지:", error.message);
            
            // 기본값 설정
            const defaultLocation = "강남구 역삼동";
            setCurrentLocation(defaultLocation);
            localStorage.setItem("selectedLocation", defaultLocation);
            setIsLoadingLocation(false);
            
            // 에러 메시지 표시 (권한 거부시)
            if (error.code === error.PERMISSION_DENIED) {
              console.warn("⚠️ [위치 권한] 사용자가 위치 권한을 거부했습니다");
              toast({
                title: "위치 권한 필요",
                description: "위치 권한을 허용하면 자동으로 현재 위치가 설정됩니다.",
              });
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0 // 항상 새로운 위치 가져오기
          }
        );
      } else {
        // Geolocation 미지원
        const defaultLocation = "강남구 역삼동";
        setCurrentLocation(defaultLocation);
        localStorage.setItem("selectedLocation", defaultLocation);
        setIsLoadingLocation(false);
      }
    };

    checkAuthAndInitLocation();

    // 세션 만료 감지 및 처리
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔐 [인증 상태 변경]", event, session ? "세션 있음" : "세션 없음");
      
      const wasLoggedIn = !!prevSessionRef.current;
      const isNowLoggedIn = !!session;
      
      // INITIAL_SESSION 이벤트 처리: 세션이 없고 이전에 로그인 상태였다면 로그아웃으로 간주
      if (event === "INITIAL_SESSION" && !session && wasLoggedIn) {
        console.log("⚠️ [세션 만료] INITIAL_SESSION 세션 없음 - 로그인 상태였으나 세션이 없음");
        setIsLoggedIn(false);
        
        toast({
          title: "로그인 만료",
          description: "세션이 만료되었습니다. 다시 로그인해주세요.",
          variant: "destructive",
        });
        
        // 로그인 페이지로 리다이렉트
        navigate("/");
        prevSessionRef.current = null;
        return;
      }
      
      if (event === "SIGNED_OUT" || (!session && wasLoggedIn)) {
        // 세션이 만료되거나 로그아웃된 경우
        console.log("⚠️ [세션 만료] 로그인이 만료되었습니다");
        setIsLoggedIn(false);
        
        // 로그인 상태였다가 만료된 경우에만 알림 표시 후 로그인 페이지로 이동
        if (wasLoggedIn) {
          toast({
            title: "로그인 만료",
            description: "세션이 만료되었습니다. 다시 로그인해주세요.",
            variant: "destructive",
          });
          
          // 로그인 페이지로 리다이렉트
          navigate("/");
        }
      } else if (event === "SIGNED_IN" || (session && isNowLoggedIn)) {
        // 로그인되거나 토큰이 갱신된 경우
        console.log("✅ [세션 유지/갱신] 로그인 상태 유지");
        setIsLoggedIn(true);
        
        // 처음 로그인한 경우에만 위치 정보 다시 가져오기 (TOKEN_REFRESHED는 제외)
        if (event === "SIGNED_IN" && session && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              const address = await getAddressFromCoords(latitude, longitude);
              localStorage.setItem("selectedLocation", address);
              localStorage.setItem("currentCoordinates", JSON.stringify({ latitude, longitude }));
              setCurrentLocation(address);
              setCurrentCoords({ latitude, longitude });
              await fetchNearbyStores(latitude, longitude);
            },
            (error) => {
              const defaultLocation = "강남구 역삼동";
              setCurrentLocation(defaultLocation);
              localStorage.setItem("selectedLocation", defaultLocation);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
          );
        }
      }
      
      // 현재 세션 상태 저장
      prevSessionRef.current = session;
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [toast, navigate]);

  const handleRefreshLocation = async () => {
    if (!isLoggedIn) {
      toast({
        title: "로그인 필요",
        description: "위치 기반 매장 검색을 이용하려면 로그인이 필요합니다.",
      });
      return;
    }
    
    setIsLoadingLocation(true);
    setCurrentLocation("위치 확인 중...");
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const address = await getAddressFromCoords(latitude, longitude);
          
          localStorage.setItem("selectedLocation", address);
          localStorage.setItem("currentCoordinates", JSON.stringify({ latitude, longitude }));
          setCurrentLocation(address);
          setCurrentCoords({ latitude, longitude });
          setIsLoadingLocation(false);
          
          await fetchNearbyStores(latitude, longitude);
          
          toast({
            title: "위치 업데이트 완료",
            description: "현재 위치가 업데이트되었습니다.",
          });
        },
        (error) => {
          console.error("위치 가져오기 실패:", error);
          const defaultLocation = "강남구 역삼동";
          setCurrentLocation(defaultLocation);
          localStorage.setItem("selectedLocation", defaultLocation);
          setIsLoadingLocation(false);
          
          toast({
            title: "위치 업데이트 실패",
            description: "위치를 가져올 수 없습니다.",
            variant: "destructive",
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        }
      );
    }
  };


  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // 지구 반경 (km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance;
  };

  const fetchNearbyStores = async (latitude: number, longitude: number) => {
    try {
      setIsLoadingStores(true);
      console.log("🏪 [매장 검색] 시작:", { latitude, longitude });

      // Kakao SDK 로드 보장
      try {
        const { loadKakaoMaps } = await import("@/lib/kakao");
        await loadKakaoMaps();
      } catch (error: any) {
        console.error("❌ [매장 검색] Kakao SDK 로드 실패:", error);
        throw new Error(error.message || "Kakao SDK를 로드할 수 없습니다. VITE_KAKAO_APP_KEY 환경 변수를 확인해주세요.");
      }
      
      const kakao = (window as any).kakao;
      if (!kakao?.maps) {
        console.error("❌ [매장 검색] Kakao SDK를 찾을 수 없습니다");
        throw new Error("Kakao SDK가 로드되지 않았습니다");
      }
      
      // services 라이브러리 확인
      if (!kakao.maps.services) {
        console.error("❌ [매장 검색] Kakao Maps services를 찾을 수 없습니다");
        throw new Error("Kakao Maps services 라이브러리가 로드되지 않았습니다");
      }
      
      console.log("✅ [매장 검색] Kakao SDK 확인 완료");

      const radius = 10000; // 10km (미터 단위)
      console.log("📏 [매장 검색] 검색 반경:", radius, "미터");

      // 검색할 브랜드 목록
      const brands = [
        { keyword: "스타벅스", image: "starbucks" },
        { keyword: "베스킨라빈스", image: "baskin" },
        { keyword: "메가커피", image: "mega" },
        { keyword: "파스쿠찌", image: "pascucci" },
        { keyword: "투썸플레이스", image: "twosome" },
      ];
      console.log("🔍 [매장 검색] 검색할 브랜드:", brands.map(b => b.keyword));

      // Places 서비스 객체 생성 (SDK 로드 이후 안전)
      console.log("🗺️ [매장 검색] Places 서비스 객체 생성");
      const ps = new kakao.maps.services.Places();
      console.log("✅ [매장 검색] Places 서비스 준비 완료");

      // 모든 브랜드를 병렬로 검색
      console.log("🔄 [매장 검색] 병렬 검색 시작");
      const searchPromises = brands.map((brand) => {
        return new Promise<any[]>((resolve, reject) => {
          console.log(`🔍 [${brand.keyword}] 검색 시작`);
          const options = {
            location: new kakao.maps.LatLng(latitude, longitude),
            radius: radius,
            size: 15,
          };
          console.log(`⚙️ [${brand.keyword}] 검색 옵션:`, options);

          ps.keywordSearch(
            brand.keyword,
            (data: any[], status: any) => {
              console.log(`📊 [${brand.keyword}] 응답 상태:`, status);
              if (status === kakao.maps.services.Status.OK) {
                console.log(`✅ [${brand.keyword}] 검색 성공 - 결과 ${data.length}개:`, data);
                
                const stores = data.map((place: any) => {
                  // 거리 계산
                  const distanceNum = calculateDistance(
                    latitude,
                    longitude,
                    parseFloat(place.y),
                    parseFloat(place.x)
                  ) * 1000; // km를 m로 변환
                  
                  return {
                    id: place.id,
                    name: place.place_name,
                    distance: distanceNum < 1000 ? `${Math.round(distanceNum)}m` : `${(distanceNum / 1000).toFixed(1)}km`,
                    distanceNum: Math.round(distanceNum),
                    image: brand.image,
                    maxDiscount: null, // 실제 데이터 조회 후 업데이트됨
                    discountNum: 0, // 실제 데이터 조회 후 업데이트됨
                    maxDiscountPercent: null, // 실제 데이터 조회 후 업데이트됨
                    lat: parseFloat(place.y),
                    lon: parseFloat(place.x),
                    address: place.road_address_name || place.address_name,
                  };
                });
                
                console.log(`📍 [${brand.keyword}] 처리된 매장 데이터:`, stores);
                resolve(stores);
              } else if (status === kakao.maps.services.Status.ZERO_RESULT) {
                console.log(`⚠️ [${brand.keyword}] 검색 결과 없음`);
                resolve([]);
              } else {
                console.error(`❌ [${brand.keyword}] 검색 실패 - 상태:`, status);
                resolve([]);
              }
            },
            options
          );
        });
      });
      console.log("⏳ [매장 검색] 모든 브랜드 검색 대기 중...");

      const results = await Promise.all(searchPromises);
      console.log("✅ [매장 검색] 모든 브랜드 검색 완료");
      console.log("📊 [매장 검색] 브랜드별 결과:", results.map((r, i) => `${brands[i].keyword}: ${r.length}개`));
      
      let allStores = results.flat();
      console.log("🏪 [매장 검색] 총 매장 수:", allStores.length);
      console.log("📋 [매장 검색] 최종 매장 목록:", allStores);
      
      // 각 매장의 할인 정보 조회
      console.log("🔄 [할인 정보 조회] 시작");
      const storesWithDiscount = await Promise.all(allStores.map(async (store) => {
        try {
          // 파스쿠찌와 투썸플레이스만 할인율 조회
          if (store.image !== 'pascucci' && store.image !== 'twosome') {
            return {
              ...store,
              maxDiscount: null,
              discountNum: 0,
              maxDiscountPercent: null,
            };
          }

          // 파스쿠찌와 투썸플레이스 할인 정보 조회
          // 1. 프랜차이즈 정보 조회
          const brandNameMap: Record<string, string> = {
            starbucks: "스타벅스",
            baskin: "베스킨라빈스",
            mega: "메가커피",
            pascucci: "파스쿠찌",
            twosome: "투썸플레이스",
            compose: "컴포즈커피",
            ediya: "이디야",
            paik: "빽다방",
          };
          const brandName = brandNameMap[store.image] || store.image;

          // 프랜차이즈 정보 조회
          let franchiseData: any = null;
          try {
            const { data: franchise, error: franchiseError } = await supabase
              .from('franchises' as any)
              .select('id')
              .eq('name', brandName)
              .single();
            
            if (!franchiseError && franchise) {
              franchiseData = franchise;
            }
          } catch (e) {
            console.log(`⚠️ [할인 정보] ${store.name}: 프랜차이즈 정보 조회 실패`);
          }

          // 2. 프랜차이즈별 결제 방식 적립/할인 정보 조회
          let franchiseDiscountRate = 0;
          if (franchiseData) {
            try {
              const { data: paymentMethods, error: paymentMethodsError } = await supabase
                .from('franchise_payment_methods' as any)
                .select('method_name, method_type, rate')
                .eq('franchise_id', franchiseData.id);

              if (!paymentMethodsError && paymentMethods && paymentMethods.length > 0) {
                // 파스쿠찌: 해피포인트 적립 (5%)
                if (store.image === 'pascucci') {
                  const happyPoint = paymentMethods.find((pm: any) => 
                    pm.method_name === '해피포인트' && (pm.method_type === '적립' || pm.method_type === 'accumulation')
                  );
                  if (happyPoint && (happyPoint as any).rate) {
                    franchiseDiscountRate = (happyPoint as any).rate;
                  }
                }
                // 투썸플레이스: 투썸하트는 스탬프 타입이므로 할인율에 포함하지 않음 (할인율 없음)
                // 투썸플레이스는 지역화폐 할인율과 기프티콘 할인율만 고려
              }
            } catch (e) {
              console.log(`⚠️ [할인 정보] ${store.name}: 프랜차이즈 결제 방식 정보 조회 실패`);
            }
          }

          // 3. 매장 정보 조회 (kakao_place_id로, 실패 시 무시)
          let localCurrencyDiscount = 0;
          let maxGifticonDiscount = 0;
          
          try {
            // storeId가 숫자인지 확인 (카카오 플레이스 ID)
            const isNumeric = /^\d+$/.test(store.id);
            let storeData: any = null;
            let storeError: any = null;

            if (isNumeric && franchiseData) {
              // kakao_place_id로 조회 시도
              const { data, error } = await supabase
                .from('stores' as any)
                .select('local_currency_discount_rate, gifticon_available')
                .eq('kakao_place_id', store.id)
                .single();
              
              storeData = data;
              storeError = error;
            }

            // kakao_place_id 조회 실패 시 franchise_id로 조회 시도
            if (storeError && franchiseData) {
              const { data, error } = await supabase
                .from('stores' as any)
                .select('local_currency_discount_rate, gifticon_available')
                .eq('franchise_id', franchiseData.id)
                .limit(1)
                .single();
              
              if (!error && data) {
                storeData = data;
              }
            }

            if (storeData) {
              // 지역화폐 할인율
              localCurrencyDiscount = (storeData as any).local_currency_discount_rate || 0;

              // 기프티콘 할인율 조회
              if ((storeData as any).gifticon_available) {
                try {
                  const { data: gifticonsData, error: gifticonsError } = await supabase
                    .from('used_gifticons' as any)
                    .select('original_price, sale_price')
                    .eq('available_at', brandName)
                    .eq('status', '판매중')
                    .limit(10);

                  if (!gifticonsError && gifticonsData && gifticonsData.length > 0) {
                    const discounts = gifticonsData.map((g: any) => {
                      const discountAmount = g.original_price - g.sale_price;
                      return Math.round((discountAmount / g.original_price) * 100);
                    });
                    maxGifticonDiscount = Math.max(...discounts);
                  }
                } catch (e) {
                  console.log(`⚠️ [할인 정보] ${store.name}: 기프티콘 정보 조회 실패`);
                }
              }
            }
          } catch (e) {
            console.log(`⚠️ [할인 정보] ${store.name}: 매장 정보 조회 실패`);
          }

          // 4. 최대 할인율 계산 (프랜차이즈 적립/할인, 지역화폐 할인율, 기프티콘 할인율 중 최대값)
          const maxDiscountPercent = Math.max(franchiseDiscountRate, localCurrencyDiscount, maxGifticonDiscount);
          
          if (maxDiscountPercent > 0) {
            const discountDetails = [];
            if (franchiseDiscountRate > 0) {
              discountDetails.push(`프랜차이즈: ${franchiseDiscountRate}%`);
            }
            if (localCurrencyDiscount > 0) {
              discountDetails.push(`지역화폐: ${localCurrencyDiscount}%`);
            }
            if (maxGifticonDiscount > 0) {
              discountDetails.push(`기프티콘: ${maxGifticonDiscount}%`);
            }
            console.log(`✅ [할인 정보] ${store.name} (${store.id}): 최대 ${maxDiscountPercent}% 할인 (${discountDetails.join(', ')})`);
          }

          return {
            ...store,
            maxDiscount: maxDiscountPercent > 0 ? `최대 ${maxDiscountPercent}% 할인` : null,
            discountNum: maxDiscountPercent,
            maxDiscountPercent: maxDiscountPercent > 0 ? maxDiscountPercent : null,
          };
        } catch (error) {
          console.error(`❌ [할인 정보] ${store.name} 조회 오류:`, error);
          return {
            ...store,
            maxDiscount: null,
            discountNum: 0,
            maxDiscountPercent: null,
          };
        }
      }));

      allStores = storesWithDiscount;
      console.log("✅ [할인 정보 조회] 완료");
      
      // localStorage에 매장 정보 저장 (Payment 페이지에서 사용)
      try {
        localStorage.setItem('nearbyStores', JSON.stringify(allStores));
      } catch (e) {
        console.error("localStorage 저장 오류:", e);
      }
      
      setStores(allStores);
      setIsLoadingStores(false);
      console.log("✅ [매장 검색] 완료 - 상태 업데이트 완료");
    } catch (error) {
      console.error("❌ [매장 검색] 실패:", error);
      console.error("에러 스택:", (error as Error).stack);
      setIsLoadingStores(false);
      toast({
        title: "매장 정보 로딩 실패",
        description: "매장 정보를 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const sortedStores = [...stores].sort((a, b) => {
    if (sortBy === "distance") {
      return a.distanceNum - b.distanceNum;
    } else {
      return b.discountNum - a.discountNum;
    }
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border/50 backdrop-blur-sm bg-opacity-95">
        <div className="max-w-md mx-auto px-4 py-4">
          <Button 
            variant="outline" 
            className="w-full justify-between h-12 rounded-xl border-border/50 hover:border-primary/50 transition-colors"
            disabled={isLoadingLocation || !isLoggedIn}
            onClick={() => {
              if (isLoggedIn) {
                navigate('/location');
              } else {
                toast({
                  title: "로그인 필요",
                  description: "위치 설정을 이용하려면 로그인이 필요합니다.",
                });
              }
            }}
          >
            <div className="flex items-center">
              {isLoadingLocation ? (
                <Loader2 className="w-5 h-5 mr-2 text-primary animate-spin" />
              ) : (
                <MapPin className="w-5 h-5 mr-2 text-primary" />
              )}
              <span className="font-medium">
                {isLoadingLocation ? "위치 확인 중..." : `현재 위치: ${currentLocation}`}
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRefreshLocation();
              }}
              disabled={isLoadingLocation}
              className="p-1.5 hover:bg-accent rounded-md transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingLocation ? 'animate-spin' : ''}`} />
            </button>
          </Button>
        </div>
      </header>

      {/* Store Grid */}
      <main className="max-w-md mx-auto px-4 py-6">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="매장 검색..."
            className="w-full h-12 pl-10 pr-4 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
          />
        </div>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">결제 가능 매장</h2>
            <p className="text-muted-foreground">
              {sortBy === "distance" ? "거리 순으로 정렬됩니다" : "최대 할인율 순으로 정렬됩니다"}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortBy(sortBy === "distance" ? "discount" : "distance")}
            className="flex items-center gap-2"
          >
            <ArrowUpDown className="w-4 h-4" />
            {sortBy === "distance" ? "거리순" : "할인순"}
          </Button>
        </div>

        {isLoadingStores ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground">매장 정보를 불러오는 중...</p>
          </div>
        ) : sortedStores.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 animate-fade-in">
            {sortedStores.map((store) => (
              <StoreCard 
                key={store.id} 
                {...store} 
                isLoggedIn={isLoggedIn}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">주변에 매장이 없습니다</p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Main;
