import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

const Login = () => {
  const handleKakaoLogin = () => {
    // 카카오 로그인 로직은 나중에 구현
    console.log("카카오 로그인");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/20 via-secondary/10 to-background px-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-12">
          <div className="w-24 h-24 bg-gradient-to-br from-primary to-secondary rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-lg">
            <MessageCircle className="w-12 h-12 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            기프티콘 페이
          </h1>
          <p className="text-muted-foreground text-lg">
            결제하고 기프티콘 받자!
          </p>
        </div>

        <div className="bg-card rounded-3xl p-8 shadow-xl border border-border/50">
          <Button 
            onClick={handleKakaoLogin}
            className="w-full h-14 text-lg font-semibold bg-[#FEE500] hover:bg-[#FEE500]/90 text-[#000000] rounded-xl"
          >
            <MessageCircle className="mr-2 h-5 w-5" />
            카카오톡으로 시작하기
          </Button>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              로그인하면 서비스 이용약관 및<br />개인정보 처리방침에 동의하게 됩니다
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            매장에서 결제하면 자동으로 기프티콘을 추천받고<br />
            구매할 수 있는 혁신적인 결제 플랫폼
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
