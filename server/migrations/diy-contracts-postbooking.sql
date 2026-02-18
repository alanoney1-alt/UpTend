-- DIY Tips + B2B Contracts + Post-Booking Intelligence + Neighborhood Insights
-- Run against Supabase

-- DIY Tips
CREATE TABLE IF NOT EXISTS diy_tips (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  steps JSONB NOT NULL DEFAULT '[]',
  tools_needed JSONB NOT NULL DEFAULT '[]',
  estimated_time INTEGER NOT NULL, -- minutes
  estimated_savings REAL NOT NULL DEFAULT 0,
  safety_warnings JSONB NOT NULL DEFAULT '[]',
  when_to_call_pro TEXT,
  video_url TEXT,
  image_url TEXT,
  seasonal_relevance JSONB NOT NULL DEFAULT '[]', -- array of month numbers 1-12
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- B2B Service Agreements
CREATE TABLE IF NOT EXISTS b2b_service_agreements (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  business_account_id VARCHAR NOT NULL,
  agreement_type TEXT NOT NULL CHECK (agreement_type IN ('master_service', 'statement_of_work', 'sla', 'amendment')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'active', 'expired', 'terminated')),
  title TEXT NOT NULL,
  terms JSONB NOT NULL DEFAULT '{}',
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  auto_renew BOOLEAN DEFAULT false,
  signed_by_client TIMESTAMP,
  signed_by_uptend TIMESTAMP,
  document_url TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- B2B Document Tracking
CREATE TABLE IF NOT EXISTS b2b_document_tracking (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  business_account_id VARCHAR NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('agreement', 'invoice', 'compliance_report', 'audit_log', 'insurance_cert', 'w9')),
  document_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'approved', 'rejected', 'expired')),
  due_date TIMESTAMP,
  submitted_at TIMESTAMP,
  reviewed_by VARCHAR,
  notes TEXT,
  file_url TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Post-Booking Questions
CREATE TABLE IF NOT EXISTS post_booking_questions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id VARCHAR NOT NULL,
  job_id VARCHAR NOT NULL,
  service_type TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT,
  data_point_extracted JSONB,
  asked_at TIMESTAMP DEFAULT NOW() NOT NULL,
  answered_at TIMESTAMP
);

-- Pro Job Prompts
CREATE TABLE IF NOT EXISTS pro_job_prompts (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  pro_id VARCHAR NOT NULL,
  job_id VARCHAR NOT NULL,
  prompt_type TEXT NOT NULL CHECK (prompt_type IN ('photo_request', 'condition_check', 'appliance_spot', 'hoa_observation', 'safety_flag', 'upsell_opportunity')),
  prompt TEXT NOT NULL,
  response TEXT,
  photos JSONB DEFAULT '[]',
  george_processed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Neighborhood Insights
CREATE TABLE IF NOT EXISTS neighborhood_insights (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  zip TEXT NOT NULL,
  neighborhood_name TEXT,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('avg_price', 'popular_service', 'pro_density', 'booking_trend', 'satisfaction', 'seasonal_demand')),
  service_type TEXT,
  value JSONB NOT NULL DEFAULT '{}',
  period TEXT,
  generated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_diy_tips_service ON diy_tips(service_type);
CREATE INDEX IF NOT EXISTS idx_diy_tips_difficulty ON diy_tips(difficulty);
CREATE INDEX IF NOT EXISTS idx_b2b_agreements_business ON b2b_service_agreements(business_account_id);
CREATE INDEX IF NOT EXISTS idx_b2b_documents_business ON b2b_document_tracking(business_account_id);
CREATE INDEX IF NOT EXISTS idx_post_booking_customer ON post_booking_questions(customer_id);
CREATE INDEX IF NOT EXISTS idx_post_booking_job ON post_booking_questions(job_id);
CREATE INDEX IF NOT EXISTS idx_pro_prompts_pro ON pro_job_prompts(pro_id);
CREATE INDEX IF NOT EXISTS idx_pro_prompts_job ON pro_job_prompts(job_id);
CREATE INDEX IF NOT EXISTS idx_neighborhood_zip ON neighborhood_insights(zip);

-- Seed DIY Tips
INSERT INTO diy_tips (service_type, difficulty, title, summary, steps, tools_needed, estimated_time, estimated_savings, safety_warnings, when_to_call_pro, seasonal_relevance) VALUES
('hvac', 'easy', 'Change Your HVAC Filter', 'Swap out your HVAC air filter to improve air quality and efficiency.', '["Turn off HVAC system","Locate the filter slot (usually near return air duct)","Note the filter size printed on the old filter","Slide out the old filter","Insert new filter with arrow pointing toward the duct","Turn system back on"]', '["New HVAC filter (correct size)"]', 5, 50, '["Turn off the system before changing the filter"]', 'If your system is making unusual noises, has weak airflow after a fresh filter, or hasn''t been serviced in over a year — book an HVAC tune-up.', '[1,2,3,4,5,6,7,8,9,10,11,12]'),

('plumbing', 'easy', 'Unclog a Slow Drain', 'Clear a slow-draining sink or tub without chemicals.', '["Remove the drain cover or stopper","Pull out visible hair/debris with needle-nose pliers","Pour 1/2 cup baking soda down the drain","Follow with 1/2 cup white vinegar","Wait 15 minutes","Flush with boiling water"]', '["Needle-nose pliers","Baking soda","White vinegar","Kettle or pot for boiling water"]', 15, 150, '["Be careful with boiling water — pour slowly to avoid splashing"]', 'If the drain is still slow after two attempts, or multiple drains are clogged at once, you likely have a deeper blockage that needs professional snaking.', '[1,2,3,4,5,6,7,8,9,10,11,12]'),

('painting', 'medium', 'Touch Up Exterior Paint', 'Fix peeling or chipped exterior paint spots before they spread.', '["Scrape off loose/peeling paint with a paint scraper","Sand the area smooth with 120-grit sandpaper","Wipe clean with a damp cloth","Apply primer to bare wood/surface","Apply matching exterior paint with a brush","Apply second coat after 2 hours"]', '["Paint scraper","120-grit sandpaper","Exterior primer","Matching exterior paint","2-inch brush","Drop cloth"]', 120, 200, '["Use a sturdy ladder on level ground","Don''t paint in direct sunlight or above 90°F","Wear eye protection when scraping"]', 'If more than 30% of a wall is peeling, the wood underneath may be rotting, or you see bubbling — that''s a full repaint job for a pro.', '[3,4,5,6,9,10]'),

('gutter_cleaning', 'medium', 'Clean Gutters (1-Story Home)', 'Remove leaves and debris from gutters to prevent water damage.', '["Set up ladder on firm, level ground","Wear work gloves","Scoop out debris starting from the downspout","Place debris in a bucket or tarp below","Flush gutters with a garden hose","Check downspouts for clogs"]', '["Sturdy ladder","Work gloves","Garden hose","Gutter scoop or small trowel","Bucket"]', 60, 150, '["NEVER clean gutters on a 2-story home without professional equipment","Always have someone spot your ladder","Don''t lean the ladder against the gutters","Avoid working in wet or windy conditions"]', 'For 2-story homes, steep roofs, or if you see sagging/damaged gutters — always hire a pro. Falls from ladders are one of the most common home injuries.', '[3,4,10,11]'),

('pressure_washing', 'medium', 'Pressure Wash Your Driveway', 'Remove dirt, mold, and stains from your driveway.', '["Clear the driveway of furniture, cars, and loose items","Sweep off loose debris","Connect pressure washer and set to 3000 PSI for concrete","Apply detergent using low-pressure tip","Let sit 5-10 minutes","Switch to 25-degree tip and wash in overlapping strokes","Work from high to low so dirty water flows away"]', '["Pressure washer (rent for ~$75/day if you don''t own one)","Garden hose","Concrete detergent","Safety goggles","Closed-toe shoes"]', 60, 149, '["Never point the wand at people, pets, or windows","Wear closed-toe shoes and eye protection","Start with wider spray tip and work closer"]', 'If your driveway has deep oil stains, significant cracking, or you need your whole house exterior done — a pro has commercial equipment that''s 3x more powerful.', '[3,4,5,9,10]'),

('landscaping', 'easy', 'Basic Landscaping Trim', 'Trim overgrown bushes and edge your lawn for a clean look.', '["Identify which bushes/hedges need trimming","Use hedge shears for small jobs or electric trimmer for larger","Cut from bottom up, shaping as you go","Rake up clippings","Edge along walkways and driveways with an edger or flat shovel"]', '["Hedge shears or electric trimmer","Rake","Lawn edger or flat shovel","Yard waste bags"]', 30, 89, '["Wear gloves and eye protection","Check for wasp nests before cutting","Don''t trim more than 1/3 of the bush at once"]', 'If bushes are severely overgrown (touching the house), trees need trimming near power lines, or you need full landscape redesign — book a pro.', '[3,4,5,6,7,8,9,10]'),

('plumbing', 'easy', 'Fix a Running Toilet', 'Stop a constantly running toilet by adjusting or replacing the flapper.', '["Remove tank lid and set aside carefully","Check if the flapper is sealing properly","If worn, turn off water supply valve behind toilet","Flush to drain the tank","Unhook old flapper and replace with new one","Turn water back on and test"]', '["Replacement flapper ($5-8 at hardware store)","Towel"]', 15, 120, '["Water on bathroom floor is a slip hazard — lay down a towel"]', 'If replacing the flapper doesn''t fix it, the fill valve or flush valve may need replacing — that''s a quick pro job.', '[1,2,3,4,5,6,7,8,9,10,11,12]'),

('electrical', 'easy', 'Replace a Light Switch', 'Swap out a broken or outdated single-pole light switch.', '["Turn off the breaker for that circuit","Verify power is off with a voltage tester","Remove switch plate and unscrew old switch","Note wire connections (take a photo)","Connect wires to new switch matching the old configuration","Screw switch in, replace plate, turn breaker back on"]', '["New single-pole light switch","Flathead and Phillips screwdriver","Voltage tester","Wire nuts (usually included)"]', 15, 75, '["ALWAYS turn off the breaker first","Use a voltage tester to confirm power is off — never assume","Don''t touch bare wires"]', 'For 3-way switches, dimmer installations, any sparking, or if you''re not 100% confident — hire a licensed electrician. Electrical work can be deadly.', '[1,2,3,4,5,6,7,8,9,10,11,12]'),

('appliance_repair', 'easy', 'Clean Your Dryer Vent', 'Improve dryer efficiency and reduce fire risk by cleaning the lint vent.', '["Unplug the dryer","Pull dryer away from wall","Disconnect the vent hose from the back","Use a vent brush kit to clean inside the hose","Also brush out the vent opening on the wall","Reconnect, push dryer back, plug in"]', '["Dryer vent brush kit ($15-20)","Vacuum with hose attachment"]', 30, 100, '["Dryer lint is highly flammable — clean up thoroughly","Unplug before working behind the dryer"]', 'If your dryer vent runs more than 15 feet or has multiple bends, or you notice a burning smell — get a professional vent cleaning.', '[1,2,3,4,5,6,7,8,9,10,11,12]'),

('plumbing', 'medium', 'Replace a Shower Head', 'Upgrade your shower head for better pressure or water savings.', '["Turn off water (optional for just the head)","Unscrew old shower head counter-clockwise","Clean the threads on the pipe","Wrap pipe threads with 3-4 layers of Teflon tape clockwise","Hand-tighten new shower head","Give 1/4 turn with pliers, then test"]', '["New shower head","Teflon tape","Adjustable pliers","Rag (to protect finish)"]', 10, 65, '["Wrap the plier jaws with a rag to avoid scratching the finish"]', 'If the pipe in the wall is leaking or corroded, or you want to move the shower head location — call a plumber.', '[1,2,3,4,5,6,7,8,9,10,11,12]'),

('hvac', 'easy', 'Program Your Thermostat', 'Set up a schedule to save on heating/cooling costs.', '["Check your thermostat model and find the manual online","Set weekday schedule: higher when away, comfortable when home","Set weekend schedule","Enable auto-changeover if you have heat and AC","Set fan to AUTO not ON"]', '["Thermostat manual (usually available as PDF online)"]', 15, 180, '[]', 'If your thermostat is outdated (non-programmable), consider upgrading to a smart thermostat — we can install one for you.', '[1,2,3,4,5,6,7,8,9,10,11,12]'),

('cleaning', 'easy', 'Deep Clean Your Garbage Disposal', 'Eliminate odors and buildup from your kitchen disposal.', '["Turn off disposal and NEVER put hands inside","Drop in a few ice cubes and a cup of rock salt","Run the disposal for 30 seconds","Cut a lemon in half and grind both halves","Flush with cold water for 30 seconds"]', '["Ice cubes","Rock salt","Lemon","Cold water"]', 10, 0, '["NEVER put your hand in the disposal","Always turn it off before doing anything"]', 'If the disposal is jammed, leaking, or making grinding metal sounds — book a plumber rather than risking injury.', '[1,2,3,4,5,6,7,8,9,10,11,12]'),

('pest_control', 'easy', 'Seal Entry Points for Bugs', 'Prevent bugs and small pests by sealing gaps around your home.', '["Walk the exterior and note gaps around pipes, vents, doors, windows","Buy exterior-grade caulk and a caulk gun","Clean the area around each gap","Apply caulk in a steady bead","Smooth with a wet finger","Add door sweeps to any exterior doors with visible gaps"]', '["Exterior caulk and caulk gun","Door sweeps","Flashlight"]', 45, 200, '["Work in ventilated areas when using caulk"]', 'For active infestations (termites, roaches, rodents), visible damage, or if you see mud tubes — you need a licensed pest control pro immediately.', '[3,4,9,10]'),

('junk_removal', 'easy', 'Organize Your Garage (Pre-Cleanout)', 'Sort and organize before calling for junk removal to save money.', '["Empty everything onto the driveway","Sort into Keep, Donate, Sell, and Trash piles","Measure your Trash pile to estimate volume","Take photos for a junk removal quote","Re-organize Keep items with shelving or bins"]', '["Storage bins","Labels","Shelving unit (optional)","Trash bags"]', 120, 50, '["Lift with your legs, not your back","Wear gloves for dusty/dirty items"]', 'Once you''ve sorted, book UpTend junk removal for the Trash pile — we''ll handle the heavy lifting and proper disposal.', '[1,2,3,4,5,6,7,8,9,10,11,12]'),

('roofing', 'easy', 'Inspect Your Roof from the Ground', 'Spot potential issues without climbing on your roof.', '["Walk around your home and look at the roof from all angles","Use binoculars for a closer look","Check for missing, curling, or cracked shingles","Look for dark streaks (algae) or moss growth","Check gutters for excessive granules (sign of aging shingles)","Note any sagging areas"]', '["Binoculars","Notepad or phone for photos"]', 20, 0, '["Never climb on your roof without proper safety equipment"]', 'If you spot any damage, missing shingles, sagging, or your roof is 15+ years old — book a professional roof inspection. Early catches save thousands.', '[1,2,3,4,5,6,7,8,9,10,11,12]'),

('plumbing', 'easy', 'Check for Water Leaks', 'Find hidden leaks that waste water and cause damage.', '["Check your water meter reading","Don''t use any water for 2 hours","Check the meter again — if it changed, you have a leak","Check under all sinks for dripping","Look for water stains on ceilings","Check toilet for leaks: add food coloring to tank, wait 15 min, check bowl"]', '["Food coloring","Flashlight","Notepad"]', 30, 0, '[]', 'If you confirm a leak but can''t find it, or you see water stains spreading — call a plumber immediately. Hidden leaks cause mold and structural damage.', '[1,2,3,4,5,6,7,8,9,10,11,12]'),

('landscaping', 'medium', 'Install Mulch in Garden Beds', 'Refresh garden beds with new mulch for weed control and moisture retention.', '["Calculate area: length × width of each bed","Buy 1 cubic yard per 100 sq ft at 3 inches deep","Pull existing weeds","Edge the bed borders","Spread mulch evenly 2-3 inches deep","Keep mulch 3 inches away from tree trunks and house siding"]', '["Mulch (calculate cubic yards needed)","Wheelbarrow","Rake","Garden edger","Gloves"]', 90, 150, '["Lift bags with your legs","Stay hydrated if working in heat"]', 'For large properties (1/4 acre+), beds near the foundation, or if you need old mulch removed first — let a pro handle it efficiently.', '[3,4,5,9,10]'),

('hvac', 'medium', 'Clean Your AC Condenser Unit', 'Improve AC efficiency by cleaning the outdoor unit.', '["Turn off the AC at the thermostat AND the breaker","Remove debris from around the unit (2 ft clearance)","Use a garden hose to spray the fins from inside out","Use a fin comb to straighten bent fins","Remove the top grille and clear any debris inside","Replace grille, restore power, test"]', '["Garden hose","Fin comb ($10)","Work gloves"]', 45, 100, '["ALWAYS turn off power at the breaker before cleaning","Don''t use a pressure washer — it bends the fins"]', 'If the unit is making strange noises, not cooling well after cleaning, or the fins are severely damaged — book an HVAC technician.', '[3,4,5,6,9,10]'),

('plumbing', 'easy', 'Insulate Exposed Pipes', 'Prevent frozen pipes in winter and reduce energy waste.', '["Identify exposed pipes in basement, crawlspace, garage, and exterior walls","Measure pipe diameter and total length","Buy foam pipe insulation (match diameter)","Cut insulation to length","Snap it around pipes and seal seams with tape","Pay extra attention to pipes near exterior walls"]', '["Foam pipe insulation","Utility knife","Duct tape or insulation tape"]', 30, 75, '["Wear gloves when working in crawlspaces"]', 'If pipes have already frozen or burst, or you can''t access pipes in walls — call a plumber immediately.', '[10,11,12,1,2]'),

('cleaning', 'easy', 'Clean Your Dishwasher', 'Remove buildup and odors for better cleaning performance.', '["Remove the bottom rack","Clean the drain area of any food debris","Place a cup of white vinegar on the top rack","Run a hot water cycle empty","Sprinkle baking soda on the bottom","Run a short hot cycle","Wipe door edges and gasket with vinegar solution"]', '["White vinegar","Baking soda","Soft cloth"]', 15, 0, '[]', 'If your dishwasher isn''t draining, has a foul smell that won''t go away, or leaves dishes dirty — it may need a professional repair or replacement.', '[1,2,3,4,5,6,7,8,9,10,11,12]'),

('window_cleaning', 'easy', 'Clean Interior Windows', 'Get streak-free windows without hiring a pro.', '["Mix equal parts white vinegar and water in a spray bottle","Spray the window generously","Wipe with a microfiber cloth or newspaper in Z-pattern","Dry edges with a clean cloth","Clean the window tracks with an old toothbrush"]', '["Spray bottle","White vinegar","Microfiber cloths","Old toothbrush"]', 45, 100, '["Don''t clean windows in direct sunlight — they dry too fast and streak"]', 'For exterior windows above the first floor, hard water stains, or full-house window cleaning — hire a pro with proper equipment.', '[3,4,5,9,10]'),

('handyman', 'easy', 'Fix a Squeaky Door', 'Silence annoying door squeaks in seconds.', '["Open and close the door to identify the squeaky hinge","Apply a few drops of WD-40 or silicone lubricant to the hinge pin","Work the door back and forth to distribute","Wipe off excess with a rag","If still squeaky, remove the hinge pin, clean it, lubricate, and replace"]', '["WD-40 or silicone lubricant","Rag","Nail and hammer (to tap out hinge pin if needed)"]', 5, 50, '[]', 'If doors are sticking, not closing properly, or frames are warped — that might indicate foundation settling. Book a handyman to assess.', '[1,2,3,4,5,6,7,8,9,10,11,12]');
