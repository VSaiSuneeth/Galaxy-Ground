CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ===== startups =====
CREATE TABLE public.startups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  website TEXT,
  logo_url TEXT,
  hq TEXT,
  founded TEXT,
  rss_feeds TEXT[] DEFAULT '{}',
  twitter_handle TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_startups_category ON public.startups(category);
CREATE INDEX idx_startups_name_trgm ON public.startups USING gin (name gin_trgm_ops);

ALTER TABLE public.startups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Startups viewable by everyone"
  ON public.startups FOR SELECT USING (true);

CREATE POLICY "Admins manage startups"
  ON public.startups FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER startups_updated_at
  BEFORE UPDATE ON public.startups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== startup_posts =====
CREATE TABLE public.startup_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id UUID NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  summary TEXT,
  source_url TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'website',
  image_url TEXT,
  hashtags TEXT[] DEFAULT '{}',
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  views_count INTEGER NOT NULL DEFAULT 0,
  likes_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (startup_id, source_url)
);

CREATE INDEX idx_startup_posts_startup ON public.startup_posts(startup_id, published_at DESC);
CREATE INDEX idx_startup_posts_published ON public.startup_posts(published_at DESC);
CREATE INDEX idx_startup_posts_hashtags ON public.startup_posts USING gin (hashtags);

ALTER TABLE public.startup_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Startup posts viewable by everyone"
  ON public.startup_posts FOR SELECT USING (true);

CREATE POLICY "Admins manage startup posts"
  ON public.startup_posts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ===== Seed 25 startups =====
INSERT INTO public.startups (slug, name, category, description, website, hq, founded) VALUES
  ('agnikul-cosmos', 'Agnikul Cosmos', 'Launch Vehicles', 'Building Agnibaan, a customizable small-satellite launch vehicle with 3D-printed engines.', 'https://agnikul.in', 'Chennai, India', '2017'),
  ('skyroot-aerospace', 'Skyroot Aerospace', 'Launch Vehicles', 'Indian private aerospace manufacturer behind the Vikram series of launch vehicles.', 'https://skyroot.in', 'Hyderabad, India', '2018'),
  ('abyom', 'Abyom', 'Launch Vehicles', 'Developing reusable launch vehicles and propulsion systems.', 'https://abyom.com', 'India', '2021'),
  ('eon-space-labs', 'EON Space Labs', 'Launch Vehicles', 'Working on next-generation launch vehicle technologies.', NULL, 'India', '2022'),
  ('dhruva-space', 'Dhruva Space', 'Satellite Manufacturers', 'Full-stack space engineering solutions provider building satellites and ground stations.', 'https://dhruvaspace.com', 'Hyderabad, India', '2012'),
  ('pixxel', 'Pixxel', 'Satellite Manufacturers', 'Building a constellation of hyperspectral Earth-imaging satellites.', 'https://pixxel.space', 'Bengaluru, India', '2019'),
  ('satellize', 'Satellize', 'Satellite Manufacturers', 'Designs and manufactures small satellites and subsystems.', 'https://satellize.com', 'India', '2017'),
  ('galaxeye', 'GalaxEye', 'Satellite Manufacturers', 'Developing the world''s first multi-sensor SAR + optical imaging satellite.', 'https://galaxeye.space', 'Bengaluru, India', '2020'),
  ('kaleideo', 'KaleidEO', 'Satellite Manufacturers', 'Earth observation satellite constellation for high-res imagery.', 'https://kaleideo.com', 'India', '2023'),
  ('manastu-space', 'Manastu Space', 'Satellite Manufacturers', 'Green propulsion systems for satellites and collision avoidance tech.', 'https://manastuspace.com', 'Mumbai, India', '2017'),
  ('aadyah-aerospace', 'Aadyah Aerospace', 'Satellite Manufacturers', 'Aerospace and defence systems including satellite components.', 'https://aadyah.com', 'Bengaluru, India', '2016'),
  ('satsure', 'SatSure', 'Space Data & Analytics', 'Decision-intelligence company using satellite data for agriculture, infrastructure & climate.', 'https://satsure.co', 'Bengaluru, India', '2017'),
  ('skyserve', 'SkyServe', 'Space Data & Analytics', 'Edge-computing platform for satellites enabling onboard analytics.', 'https://skyserve.ai', 'Hyderabad, India', '2020'),
  ('blue-sky-analytics', 'Blue Sky Analytics', 'Space Data & Analytics', 'Climate and environmental data products from satellite imagery.', 'https://blueskyhq.io', 'Gurugram, India', '2018'),
  ('vasundhara-geo-technologies', 'Vasundhara Geo Technologies', 'Space Data & Analytics', 'Geospatial intelligence and remote-sensing solutions.', NULL, 'India', '2019'),
  ('greensat', 'GreenSat', 'Space Data & Analytics', 'Satellite-derived sustainability and ESG analytics.', NULL, 'India', '2021'),
  ('kawa-space', 'Kawa Space', 'Space Data & Analytics', 'Earth observation operations and applications platform.', 'https://kawa.space', 'Mumbai, India', '2019'),
  ('digantara', 'Digantara', 'Specialized Tech & Services', 'Space situational awareness and orbital traffic management.', 'https://digantara.co.in', 'Bengaluru, India', '2018'),
  ('inspecity', 'InspeCity', 'Specialized Tech & Services', 'On-orbit servicing, life-extension and debris-removal missions.', 'https://inspecity.com', 'Mumbai, India', '2022'),
  ('astrogate-labs', 'Astrogate Labs', 'Specialized Tech & Services', 'Optical / laser communication terminals for satellites.', 'https://astrogatelabs.com', 'Bengaluru, India', '2017'),
  ('bellatrix-aerospace', 'Bellatrix Aerospace', 'Specialized Tech & Services', 'In-space propulsion systems including electric & green chemical thrusters.', 'https://bellatrix.aero', 'Bengaluru, India', '2015'),
  ('piersight', 'PierSight', 'Specialized Tech & Services', 'All-weather ocean surveillance constellation using SAR + AIS.', 'https://piersight.space', 'Ahmedabad, India', '2023'),
  ('omnipresent-robot-technologies', 'Omnipresent Robot Technologies', 'Specialized Tech & Services', 'Drones, robotics and aerospace software solutions.', 'https://omnipresenttech.com', 'Noida, India', '2012'),
  ('kepler-aerospace', 'Kepler Aerospace', 'Specialized Tech & Services', 'Aerospace research and advanced propulsion technologies.', NULL, 'India', '2020'),
  ('newspace-research', 'NewSpace Research & Tech', 'Specialized Tech & Services', 'Autonomous swarming systems and high-altitude platforms.', 'https://newspaceresearch.com', 'Bengaluru, India', '2017');