-- Migration: Refine exact GPS coordinates for Chandapura, Bangalore Schools
update public.listings
set latitude = 12.7938, longitude = 77.7018
where slug = 'edify-school-chandapura';

update public.listings
set latitude = 12.8052, longitude = 77.6974
where slug = 'de-sales-academy-chandapura';

update public.listings
set latitude = 12.7985, longitude = 77.7032
where slug = 'lorven-public-school-chandapura';

update public.listings
set latitude = 12.7845, longitude = 77.7082
where slug = 'swamy-vivekananda-school-chandapura';

update public.listings
set latitude = 12.8082, longitude = 77.6948
where slug = 'narayana-e-techno-school-chandapura';

update public.listings
set latitude = 12.8005, longitude = 77.7015
where slug = 'sri-chaitanya-techno-school-chandapura';

update public.listings
set latitude = 12.8120, longitude = 77.6930
where slug = 'sorsfort-international-school';

update public.listings
set latitude = 12.7960, longitude = 77.7005
where slug = 'st-philomena-school-chandapura';

update public.listings
set latitude = 12.8080, longitude = 77.7120
where slug = 'krupanidhi-residential-school';

update public.listings
set latitude = 12.8165, longitude = 77.6872
where slug = 'btl-high-school-chandapura';

