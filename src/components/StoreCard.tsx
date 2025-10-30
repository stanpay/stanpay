import { Card } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { Link } from "react-router-dom";

interface StoreCardProps {
  id: string;
  name: string;
  distance: string;
  image: string;
  maxDiscount: string;
  address?: string;
}

const brandLogos: Record<string, string> = {
  starbucks: "https://i.namu.wiki/i/j2uG0oGT3wrVr2SoqmAPs-tTDbpRMy13rbAkuB60OpbSH5X2L0TNa5D456eeYqlDE832etwUebQ6R_q56VoyZPSxDlTl6Fs9nqcSSWKzjpbCVAFDDwS-XMwic7e9xGPkU6BjFGV-bACJVMJJGfdtpA.svg",
  baskin: "https://i.namu.wiki/i/Hul5w8GKariLeNjwOLD1ynOaxHclsA3ShBupmWUHVp-qEv7jLEqXV9ubh3OARuZ7E6KeyrB8RXT6THbwhhXnVSLxAWNdoi4MQ7GoEVHUMrMD6wrQis7otb4j2qCF_VmHQbHnmiAmSTJkm3J4vSlCpQ.svg",
  mega: "https://i.namu.wiki/i/How4F3VhKeoQ_71vK2j-B-9frLmAcaTQ0h9Qk34yiwS8SYqVa0sTZ2J8k5j8Fk2MneMUhNCQ-WNGMy_Bgf5hDso5IcLSvo1OEXNR9g50sKuNmgO5dcMW1ZdOnG27guwYRkpSm9O_t6BopT8tSJrMCA.svg",
  pascucci: "https://i.namu.wiki/i/mElShYb8V7AOkXkBsnZl2_4Laf2Z7j00o6O8cXJDdrF8Td8vUOGGJw4v4EwbF-S5tLG-P_TJg1RZLxv_zjpOlQ.webp",
  twosome: "https://i.namu.wiki/i/7WMmrZsQyrJt0WADKOLxM0PkYLFw9mDhrpU_Qf0pRlvyUyygbwc_uXHbmyHuqOp8LQ-mCvmjhSqU2_lKWHwPfw.svg",
};

const StoreCard = ({ id, name, distance, image, maxDiscount, address }: StoreCardProps) => {
  const logoSrc = brandLogos[image] || brandLogos.starbucks;
  
  return (
    <Link to={`/payment/${id}`}>
      <Card className="aspect-square overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-card border-border/50">
        <div className="h-full flex flex-col">
          <div className="flex-1 bg-primary/10 flex items-center justify-center p-4 relative">
            <img 
              src={logoSrc} 
              alt={name}
              className="w-20 h-20 object-contain"
            />
            <div className="absolute top-2 right-2 bg-destructive text-destructive-foreground px-2 py-1 rounded-lg text-xs font-bold">
              최대 {maxDiscount}
            </div>
          </div>
          <div className="p-3 bg-card">
            <h3 className="font-bold text-base mb-0.5 truncate" title={name}>{name}</h3>
            {address && (
              <p className="text-xs text-muted-foreground mb-1 truncate" title={address}>
                {address}
              </p>
            )}
            <div className="flex items-center text-xs text-muted-foreground">
              <MapPin className="w-3 h-3 mr-1" />
              <span>{distance}</span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default StoreCard;
