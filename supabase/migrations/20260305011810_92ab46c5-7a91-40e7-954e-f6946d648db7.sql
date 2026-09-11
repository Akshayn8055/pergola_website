
CREATE TABLE public.quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_number TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  sales_rep TEXT DEFAULT 'Admin',
  order_description TEXT DEFAULT 'Pergola',
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Quote',
  is_hot BOOLEAN NOT NULL DEFAULT false,
  is_viewed BOOLEAN NOT NULL DEFAULT false,
  is_sent BOOLEAN NOT NULL DEFAULT false,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  is_draft BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to quotes" ON public.quotes
  FOR ALL USING (true) WITH CHECK (true);

-- Insert some sample data
INSERT INTO public.quotes (quote_number, customer_name, customer_email, sales_rep, order_description, price, status, is_hot, is_viewed) VALUES
('00590', 'Lux pergola', 'lux@example.com', 'Admin', 'Pergola', 13896.00, 'Quote', false, true),
('00589', 'Lux pergola', 'lux@example.com', 'Admin', 'Pergola', 2940.00, 'Quote', false, true),
('00588', 'Testing', 'test@example.com', 'Admin', 'Pergola', 2940.00, 'Quote', false, true),
('00587', 'Hakanturinay', 'hakan@example.com', 'Admin', 'Pergola', 7560.00, 'Quote', true, true),
('00586', 'Lux pergola', 'lux@example.com', 'Admin', 'Pergola', 9126.00, 'Quote confirmed', false, true),
('00585', 'Alteco', 'alteco@example.com', 'Admin', 'Garden room', 32314.20, 'Quote', false, true),
('00584', 'Test', 'test2@example.com', 'Admin', 'Pergola', 8769.60, 'Quote confirmed', true, true),
('00583', 'Skymax Living', 'skymax@example.com', 'Admin', 'Garden room', 47102.00, 'Quote', true, false),
('00582', 'Ariton construct bv', 'ariton@example.com', 'Admin', 'Veranda', 1200.00, 'Quote', false, true),
('00581', 'Gas man', 'gasman@example.com', 'Admin', 'Garden room', 25929.00, 'Quote', false, true),
('00580', 'Videglobe', 'video@example.com', 'Admin', 'Veranda', 3720.00, 'Quote', false, true);
