-- merchant_shop_pages 表
CREATE TABLE IF NOT EXISTS public.merchant_shop_pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_account TEXT NOT NULL UNIQUE,
  brand_name TEXT NOT NULL,
  vat_number TEXT,
  product_image_path TEXT,
  product_name TEXT NOT NULL,
  product_price NUMERIC(10, 0) NOT NULL,
  product_description TEXT,
  refund_policy TEXT NOT NULL,
  service_phone TEXT NOT NULL,
  service_email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.merchant_shop_pages ENABLE ROW LEVEL SECURITY;

-- 公開可讀（審查用）
CREATE POLICY "Public can read shop pages"
  ON public.merchant_shop_pages FOR SELECT USING (true);

-- Service role 可以管理（進件 API 用）
CREATE POLICY "Service role can manage shop pages"
  ON public.merchant_shop_pages FOR ALL USING (true) WITH CHECK (true);

-- shop-images bucket（公開，圖片直接讀）
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('shop-images', 'shop-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT DO NOTHING;

CREATE POLICY "Public read shop images"
  ON storage.objects FOR SELECT USING (bucket_id = 'shop-images');

CREATE POLICY "Anon upload shop images"
  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'shop-images');
