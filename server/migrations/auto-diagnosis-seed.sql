-- Auto Diagnosis Patterns Seed — 40+ patterns across all categories

INSERT INTO auto_diagnosis_patterns (symptom_category, symptom_description, possible_causes, diagnostic_questions, obd_codes) VALUES

-- ENGINE (7)
('engine', 'Check engine light is on', '[
  {"cause":"Oxygen sensor failure","likelihood":"high","diyDifficulty":"medium","safetyRisk":"low","estimatedCost":"$150-300"},
  {"cause":"Catalytic converter failing","likelihood":"medium","diyDifficulty":"hard","safetyRisk":"low","estimatedCost":"$500-2000"},
  {"cause":"Mass airflow sensor dirty/failed","likelihood":"medium","diyDifficulty":"easy","safetyRisk":"low","estimatedCost":"$100-400"},
  {"cause":"Spark plugs worn","likelihood":"medium","diyDifficulty":"easy","safetyRisk":"low","estimatedCost":"$50-150"},
  {"cause":"Loose or damaged gas cap","likelihood":"high","diyDifficulty":"easy","safetyRisk":"low","estimatedCost":"$5-20"}
]', '["Is the light steady or flashing?","Any change in gas mileage?","Do you smell anything unusual?","When did it first come on?"]',
'["P0420","P0171","P0300","P0135","P0440","P0455"]'),

('engine', 'Rough idle or engine vibration', '[
  {"cause":"Dirty or clogged fuel injectors","likelihood":"high","diyDifficulty":"medium","safetyRisk":"low","estimatedCost":"$50-100 cleaner, $200-600 replacement"},
  {"cause":"Worn spark plugs or ignition coils","likelihood":"high","diyDifficulty":"easy","safetyRisk":"low","estimatedCost":"$50-300"},
  {"cause":"Vacuum leak","likelihood":"medium","diyDifficulty":"medium","safetyRisk":"low","estimatedCost":"$100-300"},
  {"cause":"Dirty throttle body","likelihood":"medium","diyDifficulty":"easy","safetyRisk":"low","estimatedCost":"$10-30 DIY"}
]', '["Does it happen only at idle or also when driving?","Any check engine light?","When were spark plugs last changed?"]',
'["P0300","P0301","P0171","P0174"]'),

('engine', 'Engine stalling or dying', '[
  {"cause":"Failing fuel pump","likelihood":"medium","diyDifficulty":"hard","safetyRisk":"medium","estimatedCost":"$400-800"},
  {"cause":"Bad idle air control valve","likelihood":"high","diyDifficulty":"medium","safetyRisk":"low","estimatedCost":"$100-300"},
  {"cause":"Clogged fuel filter","likelihood":"medium","diyDifficulty":"easy","safetyRisk":"low","estimatedCost":"$20-60"},
  {"cause":"Failing crankshaft position sensor","likelihood":"medium","diyDifficulty":"medium","safetyRisk":"low","estimatedCost":"$100-250"}
]', '["Does it stall at idle, while driving, or both?","Does it restart easily?","Any sputtering before it dies?"]',
'["P0171","P0507","P0335","P0230"]'),

('engine', 'Engine overheating', '[
  {"cause":"Low coolant / leak","likelihood":"high","diyDifficulty":"easy","safetyRisk":"high","estimatedCost":"$20-50 coolant"},
  {"cause":"Failed thermostat","likelihood":"high","diyDifficulty":"medium","safetyRisk":"medium","estimatedCost":"$50-200"},
  {"cause":"Water pump failure","likelihood":"medium","diyDifficulty":"hard","safetyRisk":"high","estimatedCost":"$300-700"},
  {"cause":"Radiator clogged or leaking","likelihood":"medium","diyDifficulty":"hard","safetyRisk":"medium","estimatedCost":"$300-900"}
]', '["Is there visible steam or coolant on the ground?","How quickly does the temp rise?","Is the heater blowing cold air?","Any sweet smell?"]',
'["P0217","P0128"]'),

('engine', 'Oil leak visible', '[
  {"cause":"Valve cover gasket worn","likelihood":"high","diyDifficulty":"medium","safetyRisk":"low","estimatedCost":"$100-350"},
  {"cause":"Oil pan gasket leaking","likelihood":"medium","diyDifficulty":"medium","safetyRisk":"low","estimatedCost":"$150-500"},
  {"cause":"Rear main seal","likelihood":"low","diyDifficulty":"hard","safetyRisk":"low","estimatedCost":"$500-1000"},
  {"cause":"Oil drain plug loose or stripped","likelihood":"medium","diyDifficulty":"easy","safetyRisk":"low","estimatedCost":"$5-20"}
]', '["Where do you see the oil — front, back, or underneath?","How much oil are you losing?","Any burning oil smell?"]',
'[]'),

('engine', 'Knocking or pinging noise from engine', '[
  {"cause":"Low octane fuel / carbon buildup","likelihood":"high","diyDifficulty":"easy","safetyRisk":"low","estimatedCost":"$10-30 fuel additive"},
  {"cause":"Rod bearing wear","likelihood":"low","diyDifficulty":"hard","safetyRisk":"high","estimatedCost":"$2000-4000+"},
  {"cause":"Worn timing chain/belt","likelihood":"medium","diyDifficulty":"hard","safetyRisk":"medium","estimatedCost":"$500-1500"},
  {"cause":"Bad knock sensor","likelihood":"medium","diyDifficulty":"medium","safetyRisk":"low","estimatedCost":"$150-400"}
]', '["Does it happen when accelerating or at idle?","What octane fuel do you use?","Is it getting louder over time?"]',
'["P0325","P0330"]'),

('engine', 'Car won''t start', '[
  {"cause":"Dead battery","likelihood":"high","diyDifficulty":"easy","safetyRisk":"low","estimatedCost":"$100-250"},
  {"cause":"Bad starter motor","likelihood":"medium","diyDifficulty":"medium","safetyRisk":"low","estimatedCost":"$200-600"},
  {"cause":"Faulty ignition switch","likelihood":"low","diyDifficulty":"hard","safetyRisk":"low","estimatedCost":"$150-400"},
  {"cause":"Fuel pump failure","likelihood":"medium","diyDifficulty":"hard","safetyRisk":"low","estimatedCost":"$400-800"},
  {"cause":"Corroded battery terminals","likelihood":"high","diyDifficulty":"easy","safetyRisk":"low","estimatedCost":"$5-15 cleaning"}
]', '["Do you hear clicking when you turn the key?","Do the dashboard lights come on?","Did it crank at all?","Any fuel smell?"]',
'["P0230","P0335"]'),

-- BRAKES (6)
('brakes', 'Squealing noise when braking', '[
  {"cause":"Brake pads worn thin (wear indicator)","likelihood":"high","diyDifficulty":"medium","safetyRisk":"high","estimatedCost":"$100-300 per axle"},
  {"cause":"Glazed brake pads","likelihood":"medium","diyDifficulty":"medium","safetyRisk":"medium","estimatedCost":"$100-250"},
  {"cause":"Dust or debris on pads","likelihood":"medium","diyDifficulty":"easy","safetyRisk":"low","estimatedCost":"$0 DIY"}
]', '["Does it squeal only when braking or all the time?","How long since brake pads were replaced?","Is it worse in the morning?"]',
'[]'),

('brakes', 'Grinding noise when braking', '[
  {"cause":"Brake pads completely worn — metal on rotor","likelihood":"high","diyDifficulty":"medium","safetyRisk":"critical","estimatedCost":"$250-600 pads+rotors per axle"},
  {"cause":"Rotor surface damage","likelihood":"medium","diyDifficulty":"medium","safetyRisk":"high","estimatedCost":"$200-400"},
  {"cause":"Loose caliper or bracket","likelihood":"low","diyDifficulty":"hard","safetyRisk":"critical","estimatedCost":"$100-300"}
]', '["How long has it been grinding?","Can you feel it in the brake pedal?","Do you see metal shavings on the wheel?"]',
'[]'),

('brakes', 'Soft or spongy brake pedal', '[
  {"cause":"Air in brake lines","likelihood":"high","diyDifficulty":"medium","safetyRisk":"critical","estimatedCost":"$50-100 brake bleed"},
  {"cause":"Low brake fluid","likelihood":"high","diyDifficulty":"easy","safetyRisk":"critical","estimatedCost":"$10-20"},
  {"cause":"Brake fluid leak","likelihood":"medium","diyDifficulty":"hard","safetyRisk":"critical","estimatedCost":"$150-500"},
  {"cause":"Failing master cylinder","likelihood":"low","diyDifficulty":"hard","safetyRisk":"critical","estimatedCost":"$300-600"}
]', '["Does the pedal go to the floor?","Do you see any fluid under the car near the wheels?","Does pumping improve it?"]',
'[]'),

('brakes', 'Car pulls to one side when braking', '[
  {"cause":"Uneven brake pad wear","likelihood":"high","diyDifficulty":"medium","safetyRisk":"medium","estimatedCost":"$100-300"},
  {"cause":"Stuck caliper","likelihood":"medium","diyDifficulty":"hard","safetyRisk":"medium","estimatedCost":"$150-400"},
  {"cause":"Brake hose collapsed","likelihood":"low","diyDifficulty":"hard","safetyRisk":"high","estimatedCost":"$100-200"}
]', '["Which side does it pull toward?","Does it pull only when braking or all the time?","Any unusual heat from one wheel?"]',
'[]'),

('brakes', 'Vibration or pulsing when braking', '[
  {"cause":"Warped brake rotors","likelihood":"high","diyDifficulty":"medium","safetyRisk":"medium","estimatedCost":"$200-500 per axle"},
  {"cause":"Wheel bearing wear","likelihood":"low","diyDifficulty":"hard","safetyRisk":"medium","estimatedCost":"$200-500"},
  {"cause":"Stuck caliper piston","likelihood":"medium","diyDifficulty":"hard","safetyRisk":"medium","estimatedCost":"$150-400"}
]', '["Do you feel it in the steering wheel or brake pedal?","At what speed does it start?","Worse when braking from highway speeds?"]',
'[]'),

('brakes', 'ABS warning light on', '[
  {"cause":"ABS wheel speed sensor failure","likelihood":"high","diyDifficulty":"medium","safetyRisk":"medium","estimatedCost":"$100-300"},
  {"cause":"ABS module failure","likelihood":"low","diyDifficulty":"hard","safetyRisk":"medium","estimatedCost":"$500-1500"},
  {"cause":"Low brake fluid triggering ABS","likelihood":"medium","diyDifficulty":"easy","safetyRisk":"high","estimatedCost":"$10-20"}
]', '["Is the regular brake light also on?","Did it come on after driving through water?","Any recent brake work?"]',
'["C0035","C0040","C0045","C0050"]'),

-- ELECTRICAL (4)
('electrical', 'Dead battery / car won''t start (no crank)', '[
  {"cause":"Battery end of life (3-5 years)","likelihood":"high","diyDifficulty":"easy","safetyRisk":"low","estimatedCost":"$100-250"},
  {"cause":"Parasitic drain","likelihood":"medium","diyDifficulty":"medium","safetyRisk":"low","estimatedCost":"$50-200 diagnosis"},
  {"cause":"Corroded terminals","likelihood":"high","diyDifficulty":"easy","safetyRisk":"low","estimatedCost":"$5-15"}
]', '["How old is the battery?","Did you leave lights or accessories on?","Does the car click or is it completely dead?"]',
'[]'),

('electrical', 'Alternator failing / battery light on', '[
  {"cause":"Worn alternator","likelihood":"high","diyDifficulty":"medium","safetyRisk":"low","estimatedCost":"$300-700"},
  {"cause":"Loose or worn serpentine belt","likelihood":"medium","diyDifficulty":"easy","safetyRisk":"low","estimatedCost":"$25-75"},
  {"cause":"Bad voltage regulator","likelihood":"medium","diyDifficulty":"hard","safetyRisk":"low","estimatedCost":"$200-500"}
]', '["Is the battery light on the dash?","Are headlights dimming?","Any burning rubber smell?","How old is the alternator?"]',
'[]'),

('electrical', 'Headlights or interior lights dimming', '[
  {"cause":"Weak battery","likelihood":"high","diyDifficulty":"easy","safetyRisk":"low","estimatedCost":"$100-250"},
  {"cause":"Alternator not charging fully","likelihood":"medium","diyDifficulty":"medium","safetyRisk":"low","estimatedCost":"$300-700"},
  {"cause":"Corroded ground connection","likelihood":"medium","diyDifficulty":"easy","safetyRisk":"low","estimatedCost":"$0-20"}
]', '["Do they dim at idle and brighten when revving?","All lights or just some?","Any other electrical issues?"]',
'[]'),

('electrical', 'Fuses blowing repeatedly', '[
  {"cause":"Short circuit in wiring","likelihood":"high","diyDifficulty":"hard","safetyRisk":"medium","estimatedCost":"$100-500"},
  {"cause":"Aftermarket accessory overloading circuit","likelihood":"medium","diyDifficulty":"easy","safetyRisk":"medium","estimatedCost":"$0-50"},
  {"cause":"Damaged wire insulation (rodent damage)","likelihood":"medium","diyDifficulty":"hard","safetyRisk":"medium","estimatedCost":"$100-400"}
]', '["Which fuse keeps blowing?","Did you install any aftermarket accessories?","Do you see any chewed wires?"]',
'[]'),

-- TIRES (4)
('tires', 'Uneven tire wear', '[
  {"cause":"Wheels out of alignment","likelihood":"high","diyDifficulty":"impossible","safetyRisk":"medium","estimatedCost":"$75-150 alignment"},
  {"cause":"Worn suspension components","likelihood":"medium","diyDifficulty":"hard","safetyRisk":"medium","estimatedCost":"$200-800"},
  {"cause":"Tires not rotated regularly","likelihood":"high","diyDifficulty":"easy","safetyRisk":"low","estimatedCost":"$25-50 rotation"}
]', '["Where is the wear — inside edge, outside edge, or center?","When was last alignment?","When were tires last rotated?"]',
'[]'),

('tires', 'Vibration at highway speed', '[
  {"cause":"Tires out of balance","likelihood":"high","diyDifficulty":"impossible","safetyRisk":"low","estimatedCost":"$40-80 balance"},
  {"cause":"Tire has a bulge or flat spot","likelihood":"medium","diyDifficulty":"easy","safetyRisk":"high","estimatedCost":"$100-300 new tire"},
  {"cause":"Bent wheel/rim","likelihood":"low","diyDifficulty":"impossible","safetyRisk":"medium","estimatedCost":"$150-500"}
]', '["At what speed does vibration start?","Do you feel it in the steering wheel or seat?","Did you recently hit a pothole?"]',
'[]'),

('tires', 'Slow tire leak / low pressure', '[
  {"cause":"Nail or screw puncture","likelihood":"high","diyDifficulty":"easy","safetyRisk":"low","estimatedCost":"$15-30 patch"},
  {"cause":"Corroded wheel rim seal","likelihood":"medium","diyDifficulty":"impossible","safetyRisk":"low","estimatedCost":"$25-75"},
  {"cause":"Valve stem deteriorated","likelihood":"medium","diyDifficulty":"easy","safetyRisk":"low","estimatedCost":"$10-25"}
]', '["How fast is it losing air?","Can you see any object in the tire?","Does it lose air faster in cold weather?"]',
'[]'),

('tires', 'TPMS warning light on', '[
  {"cause":"Tire pressure low","likelihood":"high","diyDifficulty":"easy","safetyRisk":"medium","estimatedCost":"$0 (air fill)"},
  {"cause":"TPMS sensor battery dead","likelihood":"medium","diyDifficulty":"impossible","safetyRisk":"low","estimatedCost":"$50-150 per sensor"},
  {"cause":"Spare tire low (some vehicles monitor spare)","likelihood":"low","diyDifficulty":"easy","safetyRisk":"low","estimatedCost":"$0"}
]', '["Did you check all tire pressures including spare?","Is it cold outside (temp drop causes this)?","Were any tires recently serviced?"]',
'[]'),

-- TRANSMISSION (5)
('transmission', 'Transmission slipping', '[
  {"cause":"Low transmission fluid","likelihood":"high","diyDifficulty":"easy","safetyRisk":"medium","estimatedCost":"$20-50 fluid top-off"},
  {"cause":"Worn clutch packs (automatic)","likelihood":"medium","diyDifficulty":"hard","safetyRisk":"medium","estimatedCost":"$1500-3500"},
  {"cause":"Failing solenoids","likelihood":"medium","diyDifficulty":"hard","safetyRisk":"medium","estimatedCost":"$300-800"}
]', '["Does it slip in specific gears?","Any burning smell?","When was transmission fluid last changed?"]',
'["P0700","P0730","P0740"]'),

('transmission', 'Hard or rough shifting', '[
  {"cause":"Dirty or old transmission fluid","likelihood":"high","diyDifficulty":"easy","safetyRisk":"low","estimatedCost":"$100-250 fluid change"},
  {"cause":"Worn shift solenoids","likelihood":"medium","diyDifficulty":"hard","safetyRisk":"low","estimatedCost":"$300-800"},
  {"cause":"Transmission mount worn","likelihood":"medium","diyDifficulty":"medium","safetyRisk":"low","estimatedCost":"$150-400"}
]', '["Does it jerk between specific gears?","Is it worse when cold?","How many miles on the fluid?"]',
'["P0700","P0750","P0755"]'),

('transmission', 'Transmission fluid leak', '[
  {"cause":"Leaking pan gasket","likelihood":"high","diyDifficulty":"medium","safetyRisk":"medium","estimatedCost":"$100-250"},
  {"cause":"Worn output shaft seal","likelihood":"medium","diyDifficulty":"hard","safetyRisk":"medium","estimatedCost":"$200-500"},
  {"cause":"Cracked cooler line","likelihood":"medium","diyDifficulty":"medium","safetyRisk":"medium","estimatedCost":"$100-300"}
]', '["What color is the fluid (red/pink = trans, brown = old trans)?","Where do you see the leak?","How much fluid is leaking?"]',
'[]'),

('transmission', 'Won''t engage / no movement in gear', '[
  {"cause":"Very low transmission fluid","likelihood":"high","diyDifficulty":"easy","safetyRisk":"critical","estimatedCost":"$20-50"},
  {"cause":"Broken linkage or cable","likelihood":"medium","diyDifficulty":"hard","safetyRisk":"medium","estimatedCost":"$200-500"},
  {"cause":"Failed torque converter","likelihood":"low","diyDifficulty":"hard","safetyRisk":"medium","estimatedCost":"$1000-2500"}
]', '["Does it engage in any gear?","Do you hear the engine rev but car doesn''t move?","Any warning lights?"]',
'["P0700","P0740"]'),

('transmission', 'Grinding noise when shifting (manual)', '[
  {"cause":"Worn synchronizers","likelihood":"high","diyDifficulty":"hard","safetyRisk":"low","estimatedCost":"$800-2000"},
  {"cause":"Low or contaminated gear oil","likelihood":"medium","diyDifficulty":"easy","safetyRisk":"low","estimatedCost":"$50-100"},
  {"cause":"Worn clutch not fully disengaging","likelihood":"medium","diyDifficulty":"hard","safetyRisk":"low","estimatedCost":"$500-1200"}
]', '["Which gears grind?","Does double-clutching help?","When was clutch last replaced?"]',
'[]'),

-- COOLING (4)
('cooling', 'Engine overheating frequently', '[
  {"cause":"Thermostat stuck closed","likelihood":"high","diyDifficulty":"medium","safetyRisk":"high","estimatedCost":"$50-200"},
  {"cause":"Radiator fan not working","likelihood":"medium","diyDifficulty":"medium","safetyRisk":"high","estimatedCost":"$200-500"},
  {"cause":"Head gasket leak","likelihood":"low","diyDifficulty":"hard","safetyRisk":"high","estimatedCost":"$1000-2500"},
  {"cause":"Water pump failing","likelihood":"medium","diyDifficulty":"hard","safetyRisk":"high","estimatedCost":"$300-700"}
]', '["Does it overheat at idle or highway?","Any white smoke from exhaust?","Losing coolant?","Oil look milky?"]',
'["P0217","P0128","P0116"]'),

('cooling', 'Coolant leak on ground', '[
  {"cause":"Cracked or loose radiator hose","likelihood":"high","diyDifficulty":"easy","safetyRisk":"medium","estimatedCost":"$20-80"},
  {"cause":"Radiator crack or corrosion","likelihood":"medium","diyDifficulty":"hard","safetyRisk":"medium","estimatedCost":"$300-900"},
  {"cause":"Water pump seal leaking","likelihood":"medium","diyDifficulty":"hard","safetyRisk":"medium","estimatedCost":"$300-700"},
  {"cause":"Heater core leaking","likelihood":"low","diyDifficulty":"hard","safetyRisk":"low","estimatedCost":"$500-1200"}
]', '["What color is the fluid (green, orange, pink)?","Where is the puddle — front, center, passenger side?","Any sweet smell inside the car?"]',
'[]'),

('cooling', 'Heater not blowing hot air', '[
  {"cause":"Low coolant level","likelihood":"high","diyDifficulty":"easy","safetyRisk":"low","estimatedCost":"$20-50"},
  {"cause":"Thermostat stuck open","likelihood":"high","diyDifficulty":"medium","safetyRisk":"low","estimatedCost":"$50-200"},
  {"cause":"Clogged heater core","likelihood":"medium","diyDifficulty":"hard","safetyRisk":"low","estimatedCost":"$150-400 flush, $500-1200 replace"},
  {"cause":"Blend door actuator failure","likelihood":"medium","diyDifficulty":"medium","safetyRisk":"low","estimatedCost":"$100-350"}
]', '["Does the temp gauge show normal?","Does it blow warm briefly then cold?","Any sweet smell from vents?"]',
'[]'),

('cooling', 'Thermostat stuck (runs cold or overheats)', '[
  {"cause":"Thermostat stuck open (runs cold, poor heat)","likelihood":"high","diyDifficulty":"medium","safetyRisk":"low","estimatedCost":"$50-200"},
  {"cause":"Thermostat stuck closed (overheats)","likelihood":"high","diyDifficulty":"medium","safetyRisk":"high","estimatedCost":"$50-200"}
]', '["Does the car take forever to warm up or overheat quickly?","What does the temp gauge read?"]',
'["P0128","P0125"]'),

-- SUSPENSION (4)
('suspension', 'Clunking noise over bumps', '[
  {"cause":"Worn sway bar links","likelihood":"high","diyDifficulty":"medium","safetyRisk":"low","estimatedCost":"$50-150"},
  {"cause":"Worn ball joints","likelihood":"medium","diyDifficulty":"hard","safetyRisk":"high","estimatedCost":"$200-500"},
  {"cause":"Worn strut mounts","likelihood":"medium","diyDifficulty":"hard","safetyRisk":"medium","estimatedCost":"$200-500"},
  {"cause":"Loose/worn control arm bushings","likelihood":"medium","diyDifficulty":"hard","safetyRisk":"medium","estimatedCost":"$200-500"}
]', '["Front or rear?","Only over bumps or also turning?","Any looseness in the steering?"]',
'[]'),

('suspension', 'Bouncy or floaty ride', '[
  {"cause":"Worn shocks or struts","likelihood":"high","diyDifficulty":"hard","safetyRisk":"medium","estimatedCost":"$400-1000 per axle"},
  {"cause":"Weak or broken springs","likelihood":"low","diyDifficulty":"hard","safetyRisk":"high","estimatedCost":"$300-700"}
]', '["Does the car bounce more than 2 times after a bump?","Does the nose dive when braking?","How many miles on shocks/struts?"]',
'[]'),

('suspension', 'Uneven tire wear from suspension', '[
  {"cause":"Worn tie rod ends","likelihood":"high","diyDifficulty":"medium","safetyRisk":"high","estimatedCost":"$100-300"},
  {"cause":"Bent control arm","likelihood":"low","diyDifficulty":"hard","safetyRisk":"high","estimatedCost":"$200-600"},
  {"cause":"Alignment needed","likelihood":"high","diyDifficulty":"impossible","safetyRisk":"medium","estimatedCost":"$75-150"}
]', '["Which edge of the tire is worn?","Did you recently hit a curb or pothole?","Does the car pull?"]',
'[]'),

('suspension', 'Steering wanders or feels loose', '[
  {"cause":"Worn tie rods","likelihood":"high","diyDifficulty":"medium","safetyRisk":"high","estimatedCost":"$100-300"},
  {"cause":"Worn steering rack bushings","likelihood":"medium","diyDifficulty":"hard","safetyRisk":"high","estimatedCost":"$300-800"},
  {"cause":"Low power steering fluid","likelihood":"medium","diyDifficulty":"easy","safetyRisk":"medium","estimatedCost":"$10-20"}
]', '["Does it wander at highway speed?","Any play in the steering wheel?","Hear any whining when turning?"]',
'[]'),

-- EXHAUST (3)
('exhaust', 'Loud exhaust noise or rumbling', '[
  {"cause":"Exhaust leak at gasket or joint","likelihood":"high","diyDifficulty":"medium","safetyRisk":"medium","estimatedCost":"$100-300"},
  {"cause":"Muffler rusted through","likelihood":"high","diyDifficulty":"medium","safetyRisk":"low","estimatedCost":"$100-400"},
  {"cause":"Broken exhaust hanger","likelihood":"medium","diyDifficulty":"easy","safetyRisk":"low","estimatedCost":"$10-30"}
]', '["Where does the noise come from — front, middle, or rear?","Did it start suddenly or get louder over time?","Any smell of exhaust inside the car?"]',
'[]'),

('exhaust', 'Sulfur / rotten egg smell', '[
  {"cause":"Catalytic converter failing","likelihood":"high","diyDifficulty":"hard","safetyRisk":"low","estimatedCost":"$500-2000"},
  {"cause":"Engine running too rich","likelihood":"medium","diyDifficulty":"medium","safetyRisk":"low","estimatedCost":"$100-400"},
  {"cause":"Old fuel or fuel additive","likelihood":"low","diyDifficulty":"easy","safetyRisk":"low","estimatedCost":"$0"}
]', '["Is the check engine light on?","When did the smell start?","Any decrease in fuel economy?"]',
'["P0420","P0430"]'),

('exhaust', 'Visible smoke from exhaust', '[
  {"cause":"White smoke — coolant leak into combustion (head gasket)","likelihood":"medium","diyDifficulty":"hard","safetyRisk":"high","estimatedCost":"$1000-2500"},
  {"cause":"Blue smoke — oil burning (worn rings or valve seals)","likelihood":"medium","diyDifficulty":"hard","safetyRisk":"medium","estimatedCost":"$500-3000"},
  {"cause":"Black smoke — running rich (excess fuel)","likelihood":"medium","diyDifficulty":"medium","safetyRisk":"low","estimatedCost":"$100-500"}
]', '["What color is the smoke — white, blue, or black?","Does it happen on startup, acceleration, or constantly?","Are you losing coolant or oil?"]',
'["P0420","P0171","P0172"]');
