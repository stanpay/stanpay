import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Upload, FileSpreadsheet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { isOperator } from "@/lib/admin";

interface GifticonData {
  available_at: string;
  expiry_date: string;
  barcode: string;
  original_price: number;
  sale_price: number;
}

const RegisterGifticon = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [formData, setFormData] = useState({
    available_at: "",
    expiry_date: "",
    barcode: "",
    original_price: "",
    sale_price: "",
  });
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<GifticonData[]>([]);
  const [uploadMode, setUploadMode] = useState<"single" | "csv">("single");

  useEffect(() => {
    const checkOperator = async () => {
      const operator = await isOperator();
      if (!operator) {
        toast({
          title: "접근 권한 없음",
          description: "운영자만 접근할 수 있습니다.",
          variant: "destructive",
        });
        navigate("/main");
      } else {
        setIsChecking(false);
      }
    };
    checkOperator();
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // CSV 파일 파싱
  const parseCSV = (csvText: string): GifticonData[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];

    // 첫 번째 줄이 헤더인지 확인
    const firstLine = lines[0].toLowerCase();
    const hasHeader = firstLine.includes('available_at') || 
                     firstLine.includes('사용가능처') ||
                     firstLine.includes('expiry_date') ||
                     firstLine.includes('사용기한');

    const dataLines = hasHeader ? lines.slice(1) : lines;
    const data: GifticonData[] = [];

    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i].trim();
      if (!line) continue;

      // CSV 파싱 (쉼표 구분, 따옴표 처리)
      const values: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      // 헤더가 있는 경우 필드명 매핑, 없는 경우 순서대로
      let available_at = '';
      let expiry_date = '';
      let barcode = '';
      let original_price = '';
      let sale_price = '';

      if (hasHeader && lines.length > 1) {
        const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''));
        const headerMap: Record<string, number> = {};
        headers.forEach((h, idx) => {
          headerMap[h] = idx;
        });

        available_at = values[headerMap['available_at'] || headerMap['사용가능처'] || 0] || '';
        expiry_date = values[headerMap['expiry_date'] || headerMap['expiry_date'] || headerMap['사용기한'] || 1] || '';
        barcode = values[headerMap['barcode'] || headerMap['바코드'] || headerMap['barcode숫자'] || 2] || '';
        original_price = values[headerMap['original_price'] || headerMap['원본가격'] || 3] || '';
        sale_price = values[headerMap['sale_price'] || headerMap['판매가격'] || headerMap['할인된 판매가격'] || 4] || '';
      } else {
        // 순서: 사용가능처, 사용기한, 바코드, 원본가격, 판매가격
        available_at = values[0] || '';
        expiry_date = values[1] || '';
        barcode = values[2] || '';
        original_price = values[3] || '';
        sale_price = values[4] || '';
      }

      // 데이터 검증
      if (!available_at || !expiry_date || !barcode || !original_price || !sale_price) {
        continue; // 필수 필드가 없으면 건너뛰기
      }

      const origPrice = Number(original_price.replace(/,/g, ''));
      const salePrice = Number(sale_price.replace(/,/g, ''));

      if (isNaN(origPrice) || isNaN(salePrice) || origPrice <= 0 || salePrice <= 0) {
        continue; // 유효하지 않은 숫자는 건너뛰기
      }

      data.push({
        available_at: available_at.trim(),
        expiry_date: expiry_date.trim(),
        barcode: barcode.trim(),
        original_price: origPrice,
        sale_price: salePrice,
      });
    }

    return data;
  };

  // CSV 파일 업로드 핸들러
  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: "파일 형식 오류",
        description: "CSV 파일만 업로드 가능합니다.",
        variant: "destructive",
      });
      return;
    }

    setCsvFile(file);
    const reader = new FileReader();

    reader.onload = (event) => {
      const csvText = event.target?.result as string;
      const parsed = parseCSV(csvText);
      
      if (parsed.length === 0) {
        toast({
          title: "CSV 파싱 오류",
          description: "CSV 파일에서 유효한 데이터를 찾을 수 없습니다.",
          variant: "destructive",
        });
        setCsvPreview([]);
        return;
      }

      setCsvPreview(parsed);
      toast({
        title: "CSV 파일 로드 완료",
        description: `${parsed.length}개의 기프티콘 데이터를 찾았습니다.`,
      });
    };

    reader.onerror = () => {
      toast({
        title: "파일 읽기 오류",
        description: "CSV 파일을 읽는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    };

    reader.readAsText(file, 'UTF-8');
  };

  // 단일 기프티콘 등록
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        throw new Error("로그인이 필요합니다.");
      }

      // 운영자 확인
      const operator = await isOperator();
      if (!operator) {
        throw new Error("운영자만 기프티콘을 등록할 수 있습니다.");
      }

      // 필드 검증
      if (!formData.available_at.trim()) {
        throw new Error("사용가능처를 입력해주세요.");
      }
      if (!formData.expiry_date) {
        throw new Error("사용기한을 입력해주세요.");
      }
      if (!formData.barcode.trim()) {
        throw new Error("바코드숫자를 입력해주세요.");
      }
      if (!formData.original_price || Number(formData.original_price) <= 0) {
        throw new Error("원본가격을 올바르게 입력해주세요.");
      }
      if (!formData.sale_price || Number(formData.sale_price) <= 0) {
        throw new Error("할인된 판매가격을 올바르게 입력해주세요.");
      }

      const originalPrice = Number(formData.original_price);
      const salePrice = Number(formData.sale_price);

      if (salePrice >= originalPrice) {
        throw new Error("할인된 판매가격은 원본가격보다 낮아야 합니다.");
      }

      // 기프티콘 등록
      const { error } = await supabase
        .from("used_gifticons")
        .insert({
          seller_id: session.user.id,
          available_at: formData.available_at.trim(),
          expiry_date: formData.expiry_date,
          barcode: formData.barcode.trim(),
          original_price: originalPrice,
          sale_price: salePrice,
          status: "판매중",
        });

      if (error) {
        throw error;
      }

      toast({
        title: "등록 완료",
        description: "기프티콘이 성공적으로 등록되었습니다.",
      });

      // 폼 초기화
      setFormData({
        available_at: "",
        expiry_date: "",
        barcode: "",
        original_price: "",
        sale_price: "",
      });
    } catch (error: any) {
      console.error("기프티콘 등록 오류:", error);
      toast({
        title: "등록 실패",
        description: error.message || "기프티콘 등록 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // CSV 일괄 등록
  const handleCsvSubmit = async () => {
    if (csvPreview.length === 0) {
      toast({
        title: "등록할 데이터 없음",
        description: "CSV 파일에서 유효한 데이터를 찾을 수 없습니다.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        throw new Error("로그인이 필요합니다.");
      }

      // 운영자 확인
      const operator = await isOperator();
      if (!operator) {
        throw new Error("운영자만 기프티콘을 등록할 수 있습니다.");
      }

      // 데이터 검증 및 변환
      const gifticonsToInsert = csvPreview
        .filter((item) => {
          if (item.sale_price >= item.original_price) {
            return false; // 할인 가격이 원본 가격보다 크거나 같으면 제외
          }
          return true;
        })
        .map((item) => ({
          seller_id: session.user.id,
          available_at: item.available_at,
          expiry_date: item.expiry_date,
          barcode: item.barcode,
          original_price: item.original_price,
          sale_price: item.sale_price,
          status: "판매중" as const,
        }));

      if (gifticonsToInsert.length === 0) {
        throw new Error("등록할 수 있는 유효한 기프티콘이 없습니다.");
      }

      // 일괄 등록
      const { error } = await supabase
        .from("used_gifticons")
        .insert(gifticonsToInsert);

      if (error) {
        throw error;
      }

      toast({
        title: "일괄 등록 완료",
        description: `${gifticonsToInsert.length}개의 기프티콘이 성공적으로 등록되었습니다.`,
      });

      // 초기화
      setCsvFile(null);
      setCsvPreview([]);
      setUploadMode("single");
    } catch (error: any) {
      console.error("CSV 일괄 등록 오류:", error);
      toast({
        title: "등록 실패",
        description: error.message || "CSV 일괄 등록 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-6">
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => navigate("/main")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">기프티콘 등록</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-4">
        {/* 모드 선택 */}
        <Card className="p-4 rounded-2xl border-border/50">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={uploadMode === "single" ? "default" : "outline"}
              className="flex-1"
              onClick={() => {
                setUploadMode("single");
                setCsvFile(null);
                setCsvPreview([]);
              }}
            >
              개별 등록
            </Button>
            <Button
              type="button"
              variant={uploadMode === "csv" ? "default" : "outline"}
              className="flex-1"
              onClick={() => {
                setUploadMode("csv");
                setFormData({
                  available_at: "",
                  expiry_date: "",
                  barcode: "",
                  original_price: "",
                  sale_price: "",
                });
              }}
            >
              CSV 일괄 등록
            </Button>
          </div>
        </Card>

        {uploadMode === "single" ? (
          /* 단일 등록 폼 */
          <Card className="p-6 rounded-2xl border-border/50">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="available_at">사용가능처 *</Label>
                <Input
                  id="available_at"
                  name="available_at"
                  type="text"
                  placeholder="예: 스타벅스, 베스킨라빈스"
                  value={formData.available_at}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiry_date">사용기한 *</Label>
                <Input
                  id="expiry_date"
                  name="expiry_date"
                  type="date"
                  value={formData.expiry_date}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="barcode">바코드숫자 *</Label>
                <Input
                  id="barcode"
                  name="barcode"
                  type="text"
                  placeholder="바코드 숫자 입력"
                  value={formData.barcode}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="original_price">원본가격 *</Label>
                <Input
                  id="original_price"
                  name="original_price"
                  type="number"
                  placeholder="예: 5000"
                  value={formData.original_price}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  min="1"
                  step="1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sale_price">할인된 판매가격 *</Label>
                <Input
                  id="sale_price"
                  name="sale_price"
                  type="number"
                  placeholder="예: 4000"
                  value={formData.sale_price}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  min="1"
                  step="1"
                />
                <p className="text-xs text-muted-foreground">
                  원본가격보다 낮은 가격으로 입력해주세요.
                </p>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-lg font-semibold rounded-xl"
                disabled={isLoading}
              >
                {isLoading ? "등록 중..." : "기프티콘 등록"}
              </Button>
            </form>
          </Card>
        ) : (
          /* CSV 일괄 등록 */
          <Card className="p-6 rounded-2xl border-border/50">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="csv_file">CSV 파일 업로드 *</Label>
                <div className="border-2 border-dashed border-border rounded-xl p-6 text-center">
                  <label htmlFor="csv_file" className="cursor-pointer">
                    <div className="flex flex-col items-center gap-3">
                      <FileSpreadsheet className="w-12 h-12 text-muted-foreground" />
                      <div>
                        <p className="font-medium">CSV 파일을 선택하세요</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {csvFile ? csvFile.name : "클릭하여 파일 선택"}
                        </p>
                      </div>
                    </div>
                  </label>
                  <input
                    id="csv_file"
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleCsvUpload}
                    disabled={isLoading}
                  />
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>CSV 형식: 사용가능처, 사용기한, 바코드, 원본가격, 판매가격</p>
                  <p>헤더 포함 또는 헤더 없이 순서대로 입력 가능합니다.</p>
                  <p>예시: 스타벅스,2024-12-31,1234567890123,5000,4000</p>
                </div>
              </div>

              {csvPreview.length > 0 && (
                <div className="space-y-2">
                  <Label>미리보기 ({csvPreview.length}개)</Label>
                  <div className="max-h-60 overflow-y-auto border border-border rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          <th className="p-2 text-left">사용가능처</th>
                          <th className="p-2 text-left">사용기한</th>
                          <th className="p-2 text-left">바코드</th>
                          <th className="p-2 text-right">원본가격</th>
                          <th className="p-2 text-right">판매가격</th>
                        </tr>
                      </thead>
                      <tbody>
                        {csvPreview.map((item, index) => (
                          <tr key={index} className="border-t border-border">
                            <td className="p-2">{item.available_at}</td>
                            <td className="p-2">{item.expiry_date}</td>
                            <td className="p-2 font-mono text-xs">{item.barcode}</td>
                            <td className="p-2 text-right">{item.original_price.toLocaleString()}원</td>
                            <td className="p-2 text-right">{item.sale_price.toLocaleString()}원</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <Button
                type="button"
                className="w-full h-12 text-lg font-semibold rounded-xl"
                onClick={handleCsvSubmit}
                disabled={isLoading || csvPreview.length === 0}
              >
                {isLoading ? "등록 중..." : `${csvPreview.length}개 기프티콘 일괄 등록`}
              </Button>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
};

export default RegisterGifticon;
