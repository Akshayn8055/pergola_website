DELETE FROM public.quotes
WHERE quote_number IN ('00580','00581','00582','00583','00584','00585','00586','00587','00588','00589','00590')
  AND COALESCE(customer_email, '') IN (
    'lux@example.com',
    'test@example.com',
    'hakan@example.com',
    'alteco@example.com',
    'test2@example.com',
    'skymax@example.com',
    'ariton@example.com',
    'gasman@example.com',
    'video@example.com'
  );
