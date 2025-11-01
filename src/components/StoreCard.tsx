import { Card } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface StoreCardProps {
  id: string;
  name: string;
  distance: string;
  image: string;
  maxDiscount: string | null; // 할인율이 없으면 null
  address?: string;
  isLoggedIn?: boolean;
  onLoginRequired?: () => void;
  local_currency_available?: boolean; // 지역화폐 사용가능 여부
  local_currency_discount_rate?: number | null; // 지역화폐 할인율
  parking_available?: boolean; // 주차가능 여부
  free_parking?: boolean; // 무료주차 여부
  parking_size?: string | null; // 주차장 규모 ('넓음', '보통', '좁음')
}

const brandLogos: Record<string, string> = {
  starbucks: "https://i.namu.wiki/i/j2uG0oGT3wrVr2SoqmAPs-tTDbpRMy13rbAkuB60OpbSH5X2L0TNa5D456eeYqlDE832etwUebQ6R_q56VoyZPSxDlTl6Fs9nqcSSWKzjpbCVAFDDwS-XMwic7e9xGPkU6BjFGV-bACJVMJJGfdtpA.svg",
  baskin: "https://i.namu.wiki/i/Hul5w8GKariLeNjwOLD1ynOaxHclsA3ShBupmWUHVp-qEv7jLEqXV9ubh3OARuZ7E6KeyrB8RXT6THbwhhXnVSLxAWNdoi4MQ7GoEVHUMrMD6wrQis7otb4j2qCF_VmHQbHnmiAmSTJkm3J4vSlCpQ.svg",
  mega: "https://i.namu.wiki/i/How4F3VhKeoQ_71vK2j-B-9frLmAcaTQ0h9Qk34yiwS8SYqVa0sTZ2J8k5j8Fk2MneMUhNCQ-WNGMy_Bgf5hDso5IcLSvo1OEXNR9g50sKuNmgO5dcMW1ZdOnG27guwYRkpSm9O_t6BopT8tSJrMCA.svg",
  pascucci: "https://www.pascucci.co.kr/lib/images/common/foot_logo2.png",
  twosome: "https://www.twosome.co.kr/resources/images/content/bi_img_logo_.svg",
};

const StoreCard = ({ 
  id, 
  name, 
  distance, 
  image, 
  maxDiscount, 
  address, 
  isLoggedIn = true, 
  onLoginRequired,
  local_currency_available = false,
  local_currency_discount_rate = null,
  parking_available = false,
  free_parking = false,
  parking_size = null,
}: StoreCardProps) => {
  const navigate = useNavigate();
  const logoSrc = brandLogos[image] || brandLogos.starbucks;
  
  // 매장명 길이에 따라 폰트 크기 자동 조절
  const getFontSizeClass = () => {
    if (name.length <= 8) return "text-base";
    if (name.length <= 12) return "text-sm";
    if (name.length <= 16) return "text-xs";
    return "text-[0.65rem]";
  };

  const handleClick = () => {
    // 로그인 여부와 관계없이 결제 페이지로 이동 (더미 데이터 표시)
    navigate(`/payment/${id}`);
  };

  // 지역화폐 칩 표시 여부
  const showLocalCurrencyChip = local_currency_available && local_currency_discount_rate !== null && local_currency_discount_rate > 0;
  
  // 주차 칩 표시 여부
  const showParkingChip = parking_available;
  
  // 주차 칩 텍스트 생성
  const getParkingText = () => {
    if (!parking_available) return "";
    if (free_parking) {
      return parking_size ? `무료 주차 가능: ${parking_size}` : "무료 주차 가능";
    }
    return parking_size ? `주차 가능: ${parking_size}` : "주차 가능";
  };
  
  return (
    <div onClick={handleClick}>
      <Card className="overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-card border-border/50">
        <div className="flex flex-col">
          <div className="flex-1 bg-primary/10 flex items-center justify-center p-4 relative">
            <img 
              src={logoSrc} 
              alt={name}
              className="w-20 h-20 object-contain"
            />
            {maxDiscount && (
              <div className="absolute top-2 right-2 bg-destructive text-destructive-foreground px-2 py-1 rounded-lg text-xs font-bold">
                {maxDiscount}
              </div>
            )}
          </div>
          <div className="p-3 bg-card">
            <h3 className={`font-bold mb-1 whitespace-nowrap ${getFontSizeClass()}`}>{name}</h3>
            <div className="flex items-center text-xs text-muted-foreground mb-2">
              <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
              <span className="break-words">{distance}</span>
            </div>
            {(showLocalCurrencyChip || showParkingChip) && (
              <div className="flex flex-nowrap gap-1 overflow-x-auto">
                {showLocalCurrencyChip && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary border border-primary/20 whitespace-nowrap shrink-0">
                    지역화폐 {local_currency_discount_rate}%할인
                  </span>
                )}
                {showParkingChip && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-secondary text-secondary-foreground border border-border whitespace-nowrap shrink-0">
                    {getParkingText()}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default StoreCard;
