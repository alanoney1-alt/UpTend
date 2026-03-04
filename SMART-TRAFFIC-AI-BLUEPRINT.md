# SMART TRAFFIC AI — COMPREHENSIVE TECHNICAL BLUEPRINT

**Prepared for: Alan Oney, UpTend (SDVOSB)**
**Target Market Entry: Lake Nona, FL**
**Date: March 2026**
**Classification: Internal — Confidential**

---

## TABLE OF CONTENTS

1. [How Traffic Signals Actually Work](#1-how-traffic-signals-actually-work)
2. [The AI/ML Architecture](#2-the-aiml-architecture)
3. [Hardware Requirements Per Intersection](#3-hardware-requirements-per-intersection)
4. [Software Platform Architecture](#4-software-platform-architecture)
5. [The Surtrac Deep Dive](#5-the-surtrac-deep-dive)
6. [NoTraffic Deep Dive](#6-notraffic-deep-dive)
7. [Other Competitors](#7-other-competitors)
8. [Lake Nona Specific Opportunity](#8-lake-nona-specific-opportunity)
9. [Regulatory and Procurement](#9-regulatory-and-procurement)
10. [Cost Model](#10-cost-model-detailed)
11. [Go-to-Market Strategy](#11-go-to-market-strategy)
12. [Team Requirements](#12-team-requirements)
13. [IP and Defensibility](#13-ip-and-defensibility)
14. [How This Ties to UpTend](#14-how-this-ties-to-uptend)

---

## 1. HOW TRAFFIC SIGNALS ACTUALLY WORK

### 1.1 Signal Controller Hardware — The Brain in the Cabinet

Every signalized intersection has a metal cabinet on the corner. Inside that cabinet is a **signal controller** — essentially a ruggedized embedded computer that decides when each light turns green, yellow, or red. Understanding this hardware is non-negotiable if you want to build a traffic AI company.

#### Major Controller Platforms

**Econolite Cobalt (ATC) — Market Leader**
- The Cobalt is Econolite's flagship Advanced Transportation Controller (ATC)
- Runs EOS (Econolite Operating System), a Linux-based platform
- ARM Cortex-A9 processor, 1GB RAM, 4GB flash storage
- Supports NTCIP 1202 v3, NTCIP 1203, and AB 3418 protocols
- Has Ethernet, USB, serial ports for external communication
- Can run third-party applications via its open Linux architecture
- **This is critical**: The open architecture means we can potentially run our optimization software directly on the controller or communicate with it via standardized protocols
- Price: ~$4,000–$6,000 per unit (controller only, not cabinet)

**Econolite ASC/3 (Legacy but Ubiquitous)**
- Runs on the 2070 hardware platform (see below)
- Proprietary firmware, less open than Cobalt
- Still deployed at tens of thousands of intersections nationwide
- NTCIP compliant but with less flexibility for third-party integration
- Price: ~$3,000–$5,000

**McCain 2070 Controller**
- Based on the Caltrans/NEMA Type 2070 open-architecture standard
- ATC/NEMA dual-mode capability
- Linux-based, supports custom application development
- Common in California, Texas, and southeastern states
- Ethernet connectivity for central system communication
- Price: ~$3,500–$5,500

**Siemens M60 / M50**
- M60: NEMA TS2 Type 2 controller, widely deployed
- M50: Older model, still common in legacy installations
- NTCIP compliant
- Siemens' TACTICS software for configuration
- Less open than Econolite Cobalt for third-party apps
- Price: ~$3,500–$5,000

**Intelight (now Q-Free) MaxTime**
- ATC-compliant controller
- Runs MaxTime IC software
- Open architecture, Linux-based
- Good NTCIP support
- Price: ~$4,000–$5,500

#### The Cabinet Itself

The controller lives inside a **traffic signal cabinet**. There are several standard types:

**NEMA TS2 Cabinet**
- Most common cabinet standard in the U.S.
- Type 1: Basic, older standard
- Type 2: Adds serial bus communication between controller and load switches
- Typically aluminum, weatherproof, NEMA 3R rated
- Contains: controller, conflict monitor (safety device), load switches (relay boards), power supply, detector cards
- Price: $8,000–$15,000 fully loaded

**Type 170 Cabinet (Caltrans Standard)**
- Originated in California
- Rack-mounted card format
- Used primarily in western states
- Being phased out in favor of 2070/ATC

**Type 2070 Cabinet**
- Modern open-architecture standard
- Supports 2070 controller modules
- Better ventilation, more rack space
- Common in newer installations

**ATC Cabinet (ITS Cabinet)**
- Newest standard, designed for ITS applications
- More space for additional equipment (edge compute, networking)
- Better power management
- Designed to accommodate third-party devices — **this is what we want**
- Price: $12,000–$20,000 fully loaded

### 1.2 NTCIP Protocol — How Software Talks to Controllers

**NTCIP (National Transportation Communications for ITS Protocol)** is the standardized communication protocol family that allows central software systems to talk to field devices including signal controllers.

#### Protocol Stack

```
Application Layer:  NTCIP 1202 (Signal Control)
                    NTCIP 1203 (Dynamic Message Signs)
                    NTCIP 1204 (Environmental Sensors)
                    NTCIP 1211 (Signal Control — ASC)
Transport Layer:    STMP (Simple Transportation Management Protocol)
                    SNMP (Simple Network Management Protocol) — v1 or v3
                    TFTP (file transfer)
Network Layer:      IP (TCP/UDP)
                    PMPP (Point-to-Multi-Point Protocol)
Data Link:          Ethernet, Serial (RS-232), Fiber
```

#### NTCIP 1202 — The Key Standard

NTCIP 1202 is THE standard for communicating with signal controllers. It defines:

- **Phase control**: Start/stop individual phases (e.g., "make Phase 2 green")
- **Timing parameters**: Read/write cycle lengths, split times, offsets
- **Detector data**: Read vehicle detector states and counts
- **Status monitoring**: Current phase, active alarms, controller mode
- **Pattern selection**: Switch between pre-programmed timing plans
- **Coordination mode**: Set free, coordinated, or manual control

**How it works in practice:**

```
Central System → SNMP GET request → Controller
  "What is the current phase status?"
  
Controller → SNMP RESPONSE → Central System
  "Phase 2 and Phase 6 are green, Phase 4 is red..."

Central System → SNMP SET request → Controller
  "Switch to Timing Plan 3"
  
Controller → Acknowledges and switches
```

#### What This Means for Us

To control a signal, we have two approaches:

**Approach A: Advisory Mode (Recommended for Phase 1)**
- Our system sends **timing plan recommendations** to the existing ATMS (Advanced Traffic Management System)
- The traffic engineer reviews and approves
- The ATMS pushes the new timing via NTCIP to the controller
- **Lowest risk, easiest to get approved**

**Approach B: Direct Control (Phase 2+)**
- Our edge device communicates directly with the controller via NTCIP 1202
- We can read detector data, monitor phase status, and send timing commands
- Requires explicit approval from the jurisdiction
- Must implement proper failsafes (conflict monitor still hardware-enforces safety)

**Approach C: Controller-Resident (Phase 3)**
- For ATC-compliant controllers (Cobalt, MaxTime), we run our optimization algorithm directly on the controller
- This is what Surtrac does — their algorithm runs on the controller hardware
- Lowest latency, most responsive
- Requires controller manufacturer partnership

#### AB 3418 Protocol (California Standard)

- Simpler than NTCIP, used primarily in California
- Provides real-time detector data and phase status
- Direct serial communication
- Many controllers support both AB 3418 and NTCIP
- Relevant if we ever expand to California

### 1.3 Detection Methods — How Intersections "See" Vehicles

#### Inductive Loop Detectors (Legacy Standard)

**How they work:**
- Wire loops embedded in the pavement (typically 6' x 6' squares)
- Connected to a detector card in the cabinet via lead-in cables
- When a vehicle (metal) passes over the loop, it changes the inductance
- Detector card senses the change and registers a "call" (vehicle present)

**Types:**
- **Presence detection**: Vehicle is sitting on the loop (used at stop bars)
- **Passage detection**: Vehicle passes over the loop (used for counting)
- **Advance detection**: Loops placed 300-400 feet upstream for speed/gap measurement

**Limitations:**
- Require pavement cuts to install (expensive, disruptive)
- Fail when pavement deteriorates
- Can't classify vehicles well
- Can't detect pedestrians or cyclists reliably
- No spatial information (just "something is there")
- Typical cost: $1,000–$3,000 per loop installed

**Why this matters:** Most intersections still rely on loops. Our AI system provides vastly more data (classification, speed, queue length, trajectory) from cameras than loops ever could. This is a core selling point.

#### Video Detection Systems

**Autoscope (Econolite)**
- Market leader in video detection
- Autoscope Vision: AI-based video detection processor
- Replaces loops with virtual detection zones drawn on camera image
- Per-lane detection, counting, classification
- Can detect wrong-way vehicles, stopped vehicles
- Typically $5,000–$8,000 per camera/processor unit
- Requires dedicated camera per approach

**Iteris Vantage (now Vantage Next)**
- Direct competitor to Autoscope
- Edge-processed video detection
- Vantage Next: AI/ML-based with improved accuracy
- Bicycle and pedestrian detection capability
- Weather-adaptive processing
- Similar price range: $5,000–$8,000

**Key insight:** These existing video detection systems do basic detection (presence/passage) to replace loops. They do NOT do what we're proposing — advanced AI analytics, queue measurement, turning movement counts, trajectory analysis, predictive modeling. We're a layer ABOVE these systems.

#### Radar Detection

**Wavetronix SmartSensor Matrix**
- FMCW (Frequency Modulated Continuous Wave) radar
- Above-ground, non-intrusive installation
- Detects vehicles in multiple zones simultaneously
- Works in all weather (rain, snow, fog, darkness)
- 8–16 detection zones per sensor
- Price: $4,000–$6,000 per unit
- Excellent for advance detection and speed measurement

**Wavetronix SmartSensor HD**
- High-definition radar for stop-bar detection
- Per-lane presence and passage detection
- Speed and vehicle length classification
- Price: $3,500–$5,000

**Radar advantages over video:** All-weather reliability. No issues with sun glare, darkness, rain, or snow. This is why many agencies are moving to radar for primary detection.

**Radar advantages over loops:** Non-intrusive (no pavement cuts), longer lifespan, more data (speed, classification).

#### Thermal Detection

**FLIR TrafiOne / ThermiCam**
- Thermal imaging for vehicle and pedestrian detection
- Works in complete darkness and all weather
- Excellent for pedestrian detection at crosswalks
- Combined thermal+visible cameras available
- Price: $6,000–$10,000
- Often used in addition to video or radar

#### Our Approach to Detection

We should be **detection-agnostic** — our AI platform works WITH existing detection infrastructure while adding our own camera-based analytics layer on top. This means:

1. We READ existing detector data from the controller (via NTCIP)
2. We ADD our own AI cameras for enhanced analytics
3. We FUSE both data sources for comprehensive intersection awareness
4. We don't require agencies to rip-and-replace existing detection

### 1.4 Signal Timing Plans — How Signals Are Programmed

#### Basic Concepts

**Cycle Length:** The total time for all phases to complete one rotation. Typical range: 60–180 seconds. Short cycles (60-90s) for light traffic; long cycles (120-180s) for heavy traffic at major intersections.

**Phase:** A single movement or group of compatible movements. A standard 4-way intersection has 8 phases:
- Phase 1: Northbound left turn
- Phase 2: Northbound/Southbound through
- Phase 3: Southbound left turn
- Phase 4: Southbound/Northbound through
- Phase 5: Eastbound left turn
- Phase 6: Eastbound/Westbound through
- Phase 7: Westbound left turn
- Phase 8: Westbound/Eastbound through

(NEMA standard dual-ring, 8-phase configuration)

**Split:** The percentage of the cycle allocated to each phase. Example: In a 120-second cycle, Phase 2 might get 45 seconds (37.5% split).

**Offset:** The time difference between when a coordinated signal starts its cycle versus a reference signal. Used to create "green waves" along corridors.

**Green Band:** The continuous green time that allows a platoon of vehicles to pass through multiple signals without stopping.

#### Timing Plan Types

**Pre-Timed (Fixed) Operation:**
- Signal runs fixed cycle/split/offset regardless of traffic
- Multiple time-of-day plans (AM peak, PM peak, off-peak, weekend)
- Cheapest, simplest, but least responsive
- Still used at many intersections

**Actuated Operation:**
- Signal responds to detector inputs
- Min/max green times per phase
- Gap-out: Phase terminates if no vehicles detected for X seconds
- Max-out: Phase terminates after maximum green time reached
- Most signals in the U.S. operate in actuated mode

**Coordinated-Actuated:**
- Main phases (typically through movements) are coordinated with adjacent signals
- Side street phases are actuated (respond to demand)
- Coordinator forces the main street green to start at a specific time in the cycle
- This creates the "green wave" on the main corridor

**Fully Adaptive (ASCT):**
- Signal timing parameters change in real-time based on current traffic conditions
- No pre-programmed plans — the system continuously optimizes
- This is what we're building

#### Coordination Plans

A coordination plan specifies:
1. **Cycle length** (all signals in the coordinated group use the same cycle)
2. **Splits** per phase
3. **Offsets** between signals (to create green waves)

Traffic engineers typically develop 4-8 coordination plans per corridor:
- AM Peak (7:00-9:00 AM)
- Midday (9:00 AM-4:00 PM)
- PM Peak (4:00-7:00 PM)
- Evening (7:00-10:00 PM)
- Overnight/Free (10:00 PM-6:00 AM)
- Weekend
- Special Events

**The problem:** Traffic doesn't neatly fit into 4-8 patterns. Demand varies day-to-day, incident-to-incident. A coordination plan developed for "average PM peak" might be wrong 60% of the time. This is the fundamental case for adaptive control.

### 1.5 Adaptive Signal Control Technology (ASCT) vs. Fixed Timing

#### How Fixed/TOD Timing Works

1. Traffic engineer collects turning movement counts (TMCs) — typically manual counts for 12-16 hours
2. Engineer inputs data into optimization software (Synchro/SimTraffic, VISTRO, HCS)
3. Software calculates optimal cycle length, splits, offsets
4. Engineer programs timing plans into controllers
5. Plans activated by time-of-day schedule

**Problems:**
- TMC data is a snapshot — collected once, valid for months/years
- Plans degrade over time as traffic patterns change
- Retiming a corridor costs $5,000–$15,000 in engineering time
- Most agencies can only retime corridors every 3-5 years
- FHWA estimates outdated signal timing costs the U.S. $100B+/year in delay

#### How ASCT Works

Adaptive systems continuously adjust timing based on real-time traffic data:

1. **Detection:** Sensors measure current traffic volumes, speeds, queue lengths
2. **Processing:** Algorithm calculates optimal timing for current conditions
3. **Implementation:** New timing parameters sent to controllers
4. **Feedback:** System measures results, adjusts again

**FHWA-Recognized ASCT Systems:**
- **SCOOT** (Split Cycle Offset Optimization Technique) — UK, TRL
- **SCATS** (Sydney Coordinated Adaptive Traffic System) — Australia
- **InSync** (Rhythm Engineering) — U.S.
- **SynchroGreen** (Trafficware/Cubic) — U.S.
- **Surtrac** (Rapid Flow Technologies/CMU) — U.S.
- **Kadence** (Miovision) — U.S./Canada

**Typical ASCT Results (FHWA data):**
- 10-25% reduction in travel time
- 15-40% reduction in stops
- 10-20% reduction in delay
- 5-15% reduction in fuel consumption

### 1.6 ATSPM — Automated Traffic Signal Performance Measures

**ATSPM** is a game-changer for the industry and critically important for our platform.

#### What ATSPM Is

ATSPM is a system and methodology for collecting high-resolution signal controller data and generating standardized performance measures. Developed by UDOT (Utah DOT) and now championed by FHWA.

#### How It Works

Modern controllers log high-resolution event data:
- Every detector activation (timestamp, detector ID)
- Every phase change (green on, yellow on, red on — with millisecond timestamps)
- Pedestrian actuations
- Coordination events
- Controller errors

This data is pushed (or pulled) to a central server where ATSPM software generates performance metrics:

**Key Performance Measures:**
- **Purdue Coordination Diagram (PCD):** Shows vehicle arrivals vs. green/red — instantly reveals coordination quality
- **Approach Volume:** Real-time and historical traffic volumes
- **Approach Speed:** From advance detectors
- **Arrivals on Red (AoR):** Percentage of vehicles arriving during red — key coordination metric
- **Split Monitor:** Actual vs. programmed splits
- **Pedestrian Delay:** Wait time for pedestrian phases
- **Yellow/Red Actuations:** Safety metric for red-light running
- **Turning Movement Counts:** When detection supports it
- **Queue Length:** Estimated from detector occupancy

#### Why ATSPM Matters for Us

1. **Data Standard:** ATSPM provides a standardized framework we can plug into
2. **Performance Proof:** We can use ATSPM metrics to prove our AI optimization works (before/after comparison)
3. **Existing Infrastructure:** Many Florida signals already log high-res data — we just need to tap into it
4. **FHWA Support:** FHWA actively promotes ATSPM, making it easier to justify our technology

**FDOT District 5 (Central Florida) is already deploying ATSPM** as part of their Smart Signals program. This is a massive advantage — the data infrastructure we need may already exist in Lake Nona.

---

## 2. THE AI/ML ARCHITECTURE

### 2.1 Computer Vision Pipeline

This is the core technical capability that differentiates us from traditional traffic systems.

#### Pipeline Overview

```
Camera Feed (1080p/4K @ 15-30fps)
    ↓
Frame Preprocessing (resize, normalize, denoise)
    ↓
Object Detection (YOLOv8/v9 — vehicles, pedestrians, cyclists)
    ↓
Object Tracking (ByteTrack/DeepSORT — assign IDs across frames)
    ↓
Classification (car, truck, bus, motorcycle, bicycle, pedestrian)
    ↓
Trajectory Analysis (speed, direction, lane position)
    ↓
Traffic Metrics Extraction:
  - Vehicle counts per movement (through, left, right)
  - Queue length per lane
  - Turning movement counts (TMCs)
  - Approach speed
  - Occupancy/density
  - Near-miss detection (safety)
  - Pedestrian/cyclist detection and counting
    ↓
Data Aggregation (15-second, 1-minute, 5-minute bins)
    ↓
Edge Output → Cloud Upload
```

#### Step-by-Step Technical Detail

**Frame Preprocessing:**
- Input: Raw camera feed, typically H.264/H.265 encoded via RTSP
- Decode to RGB frames
- Resize to model input size (typically 640x640 for YOLO)
- Normalize pixel values [0,1]
- Apply contrast enhancement for low-light conditions
- Frame skip if needed (process every 2nd or 3rd frame to reduce compute load)
- Processing time: <2ms per frame on Jetson Orin

**Object Detection:**
- Model: YOLOv8n (nano) or YOLOv8s (small) for edge deployment
- Input: 640x640 RGB frame
- Output: Bounding boxes with class labels and confidence scores
- Classes: car, truck, bus, motorcycle, bicycle, person
- Inference time: ~8ms (YOLOv8s on Jetson Orin Nano), ~4ms (on AGX Orin)
- Minimum confidence threshold: 0.5 (tunable)
- NMS (Non-Maximum Suppression) threshold: 0.45

**YOLOv8 vs YOLOv9 vs YOLOv10:**
- YOLOv8: Current production standard. Well-documented, stable, extensive community. **Use this.**
- YOLOv9: Improved accuracy through PGI (Programmable Gradient Information). ~2% mAP improvement. Consider for v2.
- YOLOv10: NMS-free design, faster inference. Still maturing. Evaluate for future.
- **Recommendation:** Start with YOLOv8s, custom-trained on traffic datasets. Upgrade model as newer versions stabilize.

**Object Tracking:**

Tracking assigns persistent IDs to detected objects across frames. This is essential for counting, trajectory analysis, and turning movement detection.

**ByteTrack (Recommended):**
- State-of-the-art multi-object tracker
- Associates detections across frames using both high and low confidence detections
- Simple Kalman filter for motion prediction
- IoU (Intersection over Union) based association
- No deep features needed (faster than DeepSORT)
- Handles occlusion well
- Processing time: ~1ms per frame
- **Why ByteTrack over DeepSORT:** Faster (no Re-ID network), better at handling crowded scenes, lower compute requirements. DeepSORT requires an additional appearance feature extractor (~5ms extra per detection).

**DeepSORT (Alternative):**
- Uses deep appearance features for re-identification
- Better at maintaining IDs through longer occlusions
- Requires additional CNN for feature extraction (adds latency)
- Use if re-identification accuracy is critical (e.g., tracking specific vehicles)

**Trajectory Analysis:**
- Track each vehicle's position across frames
- Calculate speed from pixel displacement + camera calibration
- Determine lane position from predefined lane boundaries
- Classify movement: through, left turn, right turn, U-turn
- Use entry/exit zones to define intersection movements

**Queue Length Estimation:**
- Method 1: Count stopped vehicles in approach lane (speed < 5 mph for > 2 seconds)
- Method 2: Detect the last queued vehicle position relative to stop bar
- Method 3: Use shockwave analysis — detect where moving vehicles meet stopped queue
- Output: Queue length in vehicles and feet, per lane, per cycle

**Turning Movement Counts (TMCs):**
- Define entry zones (where vehicles enter intersection) and exit zones (where they leave)
- As tracked vehicle crosses entry zone → exit zone, classify the movement
- Left turn: enters from north, exits to east
- Through: enters from north, exits to south
- Right turn: enters from north, exits to west
- Aggregate into 15-minute TMC bins (industry standard)
- **This replaces manual TMC counting** (currently costs $3,000–$8,000 per intersection per count)

### 2.2 Edge Compute Options

#### NVIDIA Jetson Orin Nano Super (Recommended for MVP)
- **Price:** $249 (developer kit)
- **AI Performance:** 67 TOPS (with latest SW update)
- **GPU:** 1024 CUDA cores, 32 Tensor Cores
- **CPU:** 6-core Arm Cortex-A78AE
- **Memory:** 8GB LPDDR5 (102 GB/s bandwidth)
- **Storage:** microSD + NVMe M.2 slot
- **Power:** 7-25W configurable
- **Capability:** Can run YOLOv8s at ~30fps on single camera stream
- **For production:** Use Jetson Orin Nano module ($199) on custom carrier board
- **Ruggedized enclosures:** Available from Connect Tech, Aetina (~$200-400 for IP67 enclosure)
- **Total edge unit cost:** ~$500-700 with enclosure, SSD, carrier board

#### NVIDIA Jetson AGX Orin (For Multi-Camera or Complex Intersections)
- **Price:** $999-$1,999 (32GB/64GB variants)
- **AI Performance:** 200-275 TOPS
- **GPU:** 2048 CUDA cores, 64 Tensor Cores
- **CPU:** 12-core Arm Cortex-A78AE
- **Memory:** 32GB or 64GB LPDDR5
- **Capability:** Can handle 4-8 camera streams simultaneously at 30fps
- **Use case:** Large intersections with 4+ approaches needing individual cameras
- **Total edge unit cost:** ~$1,500-2,500 with ruggedized enclosure

#### Alternative: Cloud Processing
- Stream video to cloud, process centrally
- **Pros:** No edge hardware to maintain, easy to update models
- **Cons:** Latency (100-500ms), bandwidth costs ($50-100/month per camera for 1080p), privacy concerns
- **Verdict:** Not recommended for real-time signal control. Acceptable for analytics-only mode.

#### Recommended Configuration Per Intersection
- **Standard (4-way, <40k ADT):** 1x Jetson Orin Nano + 2x cameras = ~$2,500 total
- **Complex (4-way, >40k ADT):** 1x Jetson AGX Orin + 4x cameras = ~$6,000 total
- **Simple (T-intersection):** 1x Jetson Orin Nano + 1x camera = ~$1,500 total

### 2.3 Reinforcement Learning for Signal Optimization

This is the core algorithm that makes signals "smart." Here's how it actually works.

#### The Problem Formulation

Traffic signal control is a **sequential decision-making problem** — at every timestep, the controller must decide which phase to serve next and for how long.

**State Space (what the system observes):**
- Queue lengths per lane (from CV pipeline)
- Vehicle counts per approach
- Current phase and remaining time
- Time since last service for each phase
- Upstream/downstream conditions (from neighboring intersections)
- Time of day / day of week
- Pedestrian demand

**Action Space (what the system can do):**
- Extend current phase by X seconds
- Terminate current phase, advance to next
- Select which phase to serve next
- Adjust cycle length
- Adjust offset (for coordination)

**Reward Function (what we're optimizing):**
- Primary: Minimize total delay (vehicle-hours of delay per hour)
- Secondary: Minimize stops, queue spillback, max queue length
- Constraints: Minimum green times, maximum wait times, pedestrian service
- Safety: Never violate minimum clearance intervals

#### How Surtrac Does It (Schedule-Driven Approach)

Surtrac uses **schedule-driven intersection control**, NOT traditional RL. Here's the key distinction:

1. Each intersection has a **scheduling agent**
2. The agent formulates current traffic as a **job-shop scheduling problem**
3. Vehicles/platoons are "jobs" that need to be processed (given green)
4. Phases are "machines" that process jobs
5. The agent solves this as a **Mixed Integer Linear Program (MILP)** to minimize total delay
6. Solution: An optimal phase sequence and duration for the next ~60 seconds
7. The agent communicates its planned outflows to neighboring agents
8. Neighbors incorporate this information into their own optimization
9. Process repeats every few seconds

**Why this approach works:**
- Decentralized: Each intersection optimizes independently (no single point of failure)
- Responsive: Re-optimizes every few seconds based on real-time data
- Coordinated: Agents share plans with neighbors, achieving network-level coordination without central control
- Provably optimal: MILP guarantees optimal solution for the local problem

#### Our Recommended Approach: Hybrid RL + Scheduling

**Phase 1 (MVP): Schedule-Driven Optimization**
- Implement Surtrac-style scheduling at each intersection
- Use our CV pipeline for detection instead of traditional detectors
- MILP solver: Google OR-Tools (open source) or Gurobi (commercial, ~$10K/year)
- Advantage: Interpretable, explainable decisions (important for agency acceptance)
- Every decision has a clear mathematical justification

**Phase 2: Deep RL Enhancement**
- Train a DRL (Deep Reinforcement Learning) agent in simulation (SUMO)
- Algorithm: PPO (Proximal Policy Optimization) or SAC (Soft Actor-Critic)
- The RL agent learns patterns that the MILP can't capture:
  - Recurring congestion patterns
  - Special event impacts
  - Weather effects
  - Time-of-day micro-patterns
- RL agent provides "hints" to the MILP solver (adjusted objective weights)

**Phase 3: Multi-Agent RL for Corridor Optimization**
- Extend to multi-agent framework (MAPPO — Multi-Agent PPO)
- Each intersection agent learns to cooperate with neighbors
- Emergence of coordination patterns (green waves) without explicit programming
- Train in digital twin, deploy when confident

#### Digital Twin Simulation

**SUMO (Simulation of Urban MObility) — Open Source**
- The gold standard open-source traffic simulation platform
- Microscopic simulation: models individual vehicles
- Import real road networks from OpenStreetMap
- Define traffic demand from our CV-measured TMCs
- Simulate signal timing plans
- API (TraCI) for real-time control from external software
- **Critical for us:** Train RL agents in SUMO before deploying to real intersections
- Free, actively maintained by DLR (German Aerospace Center)

**PTV Vissim — Commercial**
- Industry standard for traffic engineering firms
- More detailed vehicle behavior models
- Better visualization
- Expensive: $15,000–$30,000/year per license
- Use for formal analysis reports to agencies (they trust Vissim)

**Our Simulation Workflow:**
1. Build digital twin of Lake Nona corridor in SUMO using OpenStreetMap data
2. Calibrate with real traffic data from our CV system
3. Run thousands of scenarios (different demand levels, incidents, weather)
4. Train RL agents in simulation
5. Validate: Compare simulated vs. real intersection performance
6. Deploy when simulation performance exceeds real-world by target margin
7. A/B test: Run AI timing on some intersections, current timing on others

### 2.4 Predictive Models

#### Short-Term Traffic Forecasting (15 min — 2 hours)

**LSTM (Long Short-Term Memory) Networks:**
- Input: Historical traffic volumes (past 24 hours, same time last week, same time last year)
- Output: Predicted volume for next 15/30/60/120 minutes
- Architecture: 2-layer LSTM, 128 hidden units, trained per intersection
- Training data: 6+ months of 15-minute volume data
- Accuracy: Typically 85-92% (MAPE 8-15%)
- Use case: Proactive timing adjustments before congestion builds

**Transformer-Based Models (State of the Art):**
- Temporal Fusion Transformer (TFT) for multi-horizon forecasting
- Attention mechanism captures long-range temporal dependencies
- Better than LSTM for multi-step forecasting
- Can incorporate external features (events, weather, holidays)
- More compute-intensive to train but same inference cost

**Graph Neural Networks (GNN) for Spatial-Temporal:**
- Model the road network as a graph (intersections = nodes, roads = edges)
- Capture spatial correlations (upstream congestion → downstream congestion)
- Spatio-Temporal Graph Convolutional Network (STGCN)
- State of the art for network-level prediction
- Implementation: PyTorch Geometric

### 2.5 From Recommendations to Control

The path from "our AI says Phase 2 should be 45 seconds" to the signal actually running 45 seconds:

**Level 0 — Analytics Only (No Control)**
- Our system provides dashboards, reports, recommendations
- Traffic engineers review and manually implement changes
- Lowest risk, easiest approval
- **Start here**

**Level 1 — Advisory Mode**
- Our system generates optimized timing plans
- Plans are pushed to the ATMS for review
- Traffic engineer approves with one click
- ATMS sends to controller via NTCIP
- Moderate risk, requires ATMS integration

**Level 2 — Automated TOD Selection**
- Our system selects from pre-approved timing plans
- E.g., if demand exceeds threshold X, switch to Plan B
- Plans are pre-engineered and pre-approved by traffic engineer
- Controller switches plans automatically based on our commands
- Requires trust and track record

**Level 3 — Real-Time Adaptive Control**
- Our system generates timing in real-time
- Parameters pushed directly to controller
- Operates within pre-set safety bounds (min/max greens, min clearance)
- Conflict monitor provides hardware safety backstop
- Full ASCT — this is where the magic is
- Requires extensive testing, agency buy-in, and regulatory approval

**Level 4 — Full Autonomous Optimization**
- Multi-intersection coordinated adaptive control
- System handles incidents, special events, preemption automatically
- Traffic engineer monitors but doesn't intervene in normal operation
- Our ultimate goal

---

## 3. HARDWARE REQUIREMENTS PER INTERSECTION

### 3.1 Camera Specifications

#### Recommended Primary Camera: Axis P1468-LE (or equivalent)

**Specifications:**
- Resolution: 4K (3840x2160) — can run at 1080p for better performance
- Frame rate: 30fps at 1080p, 15fps at 4K
- Lens: Varifocal 3.9-10mm (100°-40° HFOV)
- Night vision: IR LEDs, 40m range, Lightfinder 2.0 technology
- Weatherproofing: IP66/IP67, NEMA 4X
- Operating temp: -40°F to 131°F (-40°C to 55°C)
- Power: PoE (12.95W typical)
- Video compression: H.264/H.265
- ONVIF Profile S/T compliant
- MSRP: ~$800-$1,200

**Why this camera:**
- IP67 weatherproof — critical for Florida sun, rain, hurricanes
- Excellent low-light performance
- Standard RTSP/ONVIF output — easy integration with Jetson
- Established surveillance camera — agencies trust Axis
- Wide temperature range for cabinet-adjacent mounting

#### Alternative Cameras

**Hanwha (Samsung) XNO-8080R:** $600-$900, 5MP, IR, weatherproof
**Hikvision DS-2CD2T86G2-4I:** $300-$500, 4K, IR, great value (but some agencies restrict Hikvision due to NDAA)
**Bosch DINION IP 3000i:** $700-$1,000, robust, good analytics integration

#### Camera Mounting

- **Option A:** Mount on existing signal mast arm (most common, requires agency approval)
- **Option B:** Mount on signal pole (lower position, may have occlusion issues)
- **Option C:** Dedicated camera pole (expensive, ~$3,000-$5,000 installed)
- **Recommended:** Mast arm mounting using existing signal infrastructure
- Use StrongPoles or Pelco mounting brackets (~$50-$150)
- Cable routing through existing conduit in signal pole

#### Camera Configuration Per Intersection

**Standard 4-Way Intersection:**
- 2 cameras minimum (diagonal corners for full coverage)
- Camera A covers NB/EB approaches
- Camera B covers SB/WB approaches
- Each camera at ~30ft height, 15-20° downward angle

**Complex/Large Intersection:**
- 4 cameras (one per approach)
- Better accuracy for TMCs and queue measurement
- Required for intersections with >4 lanes per approach

### 3.2 Complete Bill of Materials (BOM) Per Intersection

#### Standard Intersection Package (~$5,500)

| Item | Quantity | Unit Cost | Total |
|------|----------|-----------|-------|
| NVIDIA Jetson Orin Nano (module) | 1 | $249 | $249 |
| Carrier board (Seeed Studio A603) | 1 | $129 | $129 |
| Ruggedized enclosure (IP67) | 1 | $200 | $200 |
| NVMe SSD (256GB) | 1 | $40 | $40 |
| Axis P1468-LE camera | 2 | $1,000 | $2,000 |
| Camera mounting hardware | 2 | $100 | $200 |
| PoE switch (4-port, industrial) | 1 | $250 | $250 |
| Cellular modem (Cradlepoint/Sierra) | 1 | $500 | $500 |
| Cellular antenna (outdoor) | 1 | $75 | $75 |
| Power supply (DIN rail, 48V PoE) | 1 | $150 | $150 |
| Surge protector | 1 | $100 | $100 |
| Cables (Ethernet, power) | lot | $100 | $100 |
| Misc (connectors, grounding, labels) | lot | $75 | $75 |
| **Hardware Subtotal** | | | **$4,068** |
| Installation labor (2 techs, 4 hours) | 1 | $800 | $800 |
| Camera installation (bucket truck) | 1 | $600 | $600 |
| **Total Per Intersection** | | | **$5,468** |

#### Premium Intersection Package (~$9,500)

| Item | Quantity | Unit Cost | Total |
|------|----------|-----------|-------|
| NVIDIA Jetson AGX Orin 32GB | 1 | $999 | $999 |
| Connect Tech Forge carrier | 1 | $400 | $400 |
| Ruggedized enclosure (IP67) | 1 | $350 | $350 |
| NVMe SSD (512GB) | 1 | $60 | $60 |
| Axis P1468-LE camera | 4 | $1,000 | $4,000 |
| Camera mounting hardware | 4 | $100 | $400 |
| PoE switch (8-port, industrial) | 1 | $400 | $400 |
| Cellular modem (Cradlepoint IBR900) | 1 | $800 | $800 |
| Cellular antenna (outdoor, MIMO) | 1 | $150 | $150 |
| UPS battery backup (30 min) | 1 | $300 | $300 |
| Power supply, surge, cables | lot | $400 | $400 |
| **Hardware Subtotal** | | | **$8,259** |
| Installation labor | 1 | $1,200 | $1,200 |
| **Total Per Intersection** | | | **$9,459** |

### 3.3 Network Connectivity

#### Cellular (Primary — Recommended for Pilot)

**Options:**
- **Cradlepoint IBR600C:** ~$400, single LTE modem, good for basic connectivity
- **Cradlepoint IBR900:** ~$800, dual LTE modem (failover), GPS, better for production
- **Sierra Wireless RV55:** ~$500, rugged LTE gateway, industrial grade

**Data Usage Estimate:**
- We DON'T stream raw video to cloud (processed at edge)
- Upload: Aggregated metrics (~500KB per 15-min interval) = ~50MB/day
- Download: Model updates, configuration changes = ~10MB/day
- Monthly total: ~2GB
- Occasional full video clips for verification: add ~5GB/month
- **Estimated monthly cellular cost:** $25-$50/intersection (AT&T FirstNet or Verizon business)

#### Fiber (Ideal for Production)

- Many signal cabinets already have fiber connections to the TMC (Traffic Management Center)
- If fiber exists: Use a managed Ethernet switch to share the connection
- Bandwidth: Essentially unlimited for our data volumes
- Latency: <5ms to TMC
- Cost: $0 incremental if fiber already present; $5,000-$20,000 per intersection to install new

#### Mesh Networking (Future)

- Rajant or Doodle Labs mesh radios between nearby intersections
- Allows intersection-to-intersection communication for coordination
- Useful when cellular latency is too high for real-time coordination
- $1,000-$3,000 per radio

### 3.4 Power Requirements

**Total power per intersection:**
- Jetson Orin Nano: 15W max
- 2x cameras: 26W (13W each)
- PoE switch: 10W
- Cellular modem: 12W
- Misc: 5W
- **Total: ~70W**

Most signal cabinets have 120V AC power available on a dedicated circuit. We need:
- 120V AC → 48V DC (PoE) power supply for cameras
- 120V AC → 12V/5V DC for Jetson and modem
- All power supplies should be DIN-rail mounted, industrial grade
- Surge protection on AC input (Florida lightning!)

### 3.5 Cabinet Integration

Our equipment goes INSIDE the existing signal cabinet (or in an adjacent small enclosure):

**Inside the cabinet:**
- Edge compute unit (small, ~6" x 4" x 2")
- PoE switch
- Cellular modem
- Power supplies
- Mounted on DIN rail or shelf in cabinet

**Connecting to the controller:**
- Ethernet cable from our edge device to controller's Ethernet port
- This enables NTCIP communication for reading detector data and sending timing commands
- Some older controllers: Serial connection (RS-232) with NTCIP/PMPP

**Important: We do NOT modify the controller or its wiring.** We're an add-on device that communicates with the controller through standard protocols. This is key for agency acceptance.

---

## 4. SOFTWARE PLATFORM ARCHITECTURE

### 4.1 System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     CLOUD PLATFORM                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Data Lake │  │Analytics │  │Dashboard │  │   API    │   │
│  │  (S3/BQ) │  │ Engine   │  │  (React) │  │ Gateway  │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       │              │              │              │         │
│  ┌────┴──────────────┴──────────────┴──────────────┴─────┐  │
│  │              Message Bus (Kafka / Pub/Sub)             │  │
│  └───────────────────────┬───────────────────────────────┘  │
│                          │                                   │
│  ┌───────────────────────┴───────────────────────────────┐  │
│  │         Optimization Engine (RL / MILP)                │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │ (Cellular / Fiber)
              ┌────────────┴────────────┐
              │                         │
    ┌─────────┴─────────┐    ┌─────────┴─────────┐
    │  EDGE NODE #1      │    │  EDGE NODE #2      │
    │  ┌──────────────┐  │    │  ┌──────────────┐  │
    │  │ CV Pipeline   │  │    │  │ CV Pipeline   │  │
    │  │ (YOLO+Track)  │  │    │  │ (YOLO+Track)  │  │
    │  ├──────────────┤  │    │  ├──────────────┤  │
    │  │ Local Opt.    │  │    │  │ Local Opt.    │  │
    │  │ (MILP/RL)     │  │    │  │ (MILP/RL)     │  │
    │  ├──────────────┤  │    │  ├──────────────┤  │
    │  │ NTCIP Client  │  │    │  │ NTCIP Client  │  │
    │  └──────┬───────┘  │    │  └──────┬───────┘  │
    │         │           │    │         │           │
    │  ┌──────┴───────┐  │    │  ┌──────┴───────┐  │
    │  │  Controller   │  │    │  │  Controller   │  │
    │  │  (Econolite)  │  │    │  │  (Siemens)    │  │
    │  └──────────────┘  │    │  └──────────────┘  │
    └─────────────────────┘    └─────────────────────┘
```

### 4.2 Edge Software Stack

**Operating System:** JetPack 6.x (NVIDIA's Linux distro for Jetson)
- Ubuntu 22.04 base
- CUDA 12.x, cuDNN 9.x, TensorRT 10.x pre-installed
- Docker/container support

**Application Stack:**
```
Container 1: CV Pipeline
  - Python 3.11 / C++ hybrid
  - GStreamer for video decode (hardware-accelerated on Jetson)
  - TensorRT-optimized YOLOv8 model
  - ByteTrack in C++ for tracking
  - Traffic metrics calculator
  - Output: JSON metrics every 15 seconds

Container 2: Signal Optimizer
  - Python 3.11
  - Google OR-Tools for MILP optimization
  - NTCIP client library (pysnmp)
  - Local decision engine (can operate independently if cloud disconnected)
  - Reads metrics from Container 1 via shared memory/IPC

Container 3: Communications
  - MQTT client for cloud communication
  - OTA (Over-The-Air) update agent
  - Watchdog/health monitoring
  - Log shipping
  - Local data buffer (SQLite) for network outages

Container 4: Device Management
  - System monitoring (CPU, GPU, temp, memory)
  - Cellular modem management
  - Camera health checks
  - Automatic recovery/restart
```

**Key Design Principle: Edge Autonomy**
The edge node MUST be able to operate independently if cloud connectivity is lost. This means:
- Local optimization algorithm runs at the edge
- 30-day data buffer on local SSD
- Graceful degradation: If camera fails, fall back to controller's native detection
- If our entire system fails, controller continues with its last timing plan (safe fallback)

### 4.3 Cloud Backend

**Recommended: AWS (primary) or GCP**

**Data Ingestion:**
- AWS IoT Core / GCP IoT Core for device communication
- MQTT protocol for real-time metrics
- Device authentication via X.509 certificates
- Expected throughput: ~100 messages/minute per intersection

**Data Storage:**
- **Hot storage (0-30 days):** Amazon Timestream or InfluxDB for time-series metrics
- **Warm storage (30-365 days):** Amazon S3 Parquet files (partitioned by intersection, date)
- **Cold storage (1+ years):** S3 Glacier
- **Estimated storage per intersection:** ~500MB/month compressed

**Analytics Engine:**
- Apache Spark on EMR or Databricks for batch processing
- Real-time: AWS Kinesis or Kafka for stream processing
- ML model training: SageMaker or custom EC2 GPU instances
- ATSPM calculation engine (custom, based on high-res event data)

**API Layer:**
- REST API (FastAPI/Python or Go)
- GraphQL for flexible dashboard queries
- WebSocket for real-time dashboard updates
- Authentication: OAuth 2.0 / API keys for agency integration
- Rate limiting, audit logging

**Cloud Cost Estimate (50 intersections):**
- Compute: ~$500/month (reserved instances)
- Storage: ~$100/month
- IoT Core: ~$50/month
- Analytics: ~$200/month
- **Total: ~$850/month for 50 intersections** (~$17/intersection/month)

### 4.4 Dashboard for Traffic Engineers

The dashboard is our PRIMARY user interface and the main thing traffic engineers interact with.

**Technology:** React + TypeScript, Mapbox GL for mapping, D3.js for charts

**Key Views:**

**1. Real-Time Map View**
- Map centered on jurisdiction with all instrumented intersections
- Color-coded status: Green (operating well), Yellow (degraded), Red (issue)
- Click intersection → real-time video feed (optional), current phase, queue lengths
- Live traffic flow visualization (vehicle counts as animated flows)

**2. Intersection Detail View**
- Current signal phase diagram
- Real-time queue lengths per approach
- Turning movement counts (rolling 15-min)
- Approach speeds
- Cycle-by-cycle performance (delay, stops, AoR)
- AI optimization status and recommendations

**3. Corridor Performance View**
- Time-space diagram showing green waves
- Travel time measurements along corridor
- Coordination quality metrics
- Before/after comparison

**4. ATSPM Performance Measures**
- Purdue Coordination Diagram
- Split Monitor
- Approach Volume
- Arrivals on Red
- Pedestrian Delay
- All FHWA-standard ATSPM measures

**5. Alerts and Notifications**
- Equipment failures (camera offline, edge device issue)
- Performance degradation (delay increasing, queue spillback)
- Safety events (wrong-way detection, red-light running)
- Scheduled maintenance reminders

**6. Reporting**
- Automated weekly/monthly performance reports
- Before/after analysis
- PDF export for presentations
- Data export (CSV, API) for agency systems

### 4.5 Mobile App for Maintenance Crews

**Purpose:** Field technicians need mobile access for installation, troubleshooting, and maintenance.

**Features:**
- Camera feed viewing and alignment
- Edge device status and diagnostics
- Detection zone configuration (draw zones on camera image)
- Equipment inventory and serial numbers
- Work order management
- Photo documentation

**Technology:** React Native (iOS + Android from single codebase)

### 4.6 ATMS Integration

Most agencies have an existing ATMS (Advanced Traffic Management System). Common ones:

- **Econolite Centracs:** Very common, NTCIP-based communication
- **Siemens ACTRA:** Used in Siemens-equipped jurisdictions
- **TransCore TransSuite:** Popular in Florida
- **Kimley-Horn/GRIDSMART:** Emerging
- **MaxView (Q-Free):** Used with Intelight controllers

**Our integration approach:**
1. **Read-only API:** Pull data from ATMS (signal status, timing plans, alarms)
2. **Push recommendations:** Send optimized timing plans to ATMS for engineer approval
3. **Direct control (advanced):** Bypass ATMS, communicate directly with controllers
4. **ATSPM feed:** Send high-res event data to ATSPM systems (UDOT Open Source ATSPM)

**FDOT Central Florida uses Centracs** in many locations. We need Centracs integration as a priority.

---

## 5. THE SURTRAC DEEP DIVE

### 5.1 How Surtrac Actually Works

Surtrac (Scalable Urban Traffic Control) was developed at Carnegie Mellon University's Robotics Institute by Dr. Stephen F. Smith. It's the most academically rigorous and well-validated adaptive signal control system in the U.S.

**Core Algorithm: Schedule-Driven Intersection Control**

Each intersection runs an independent optimization agent. Here's the step-by-step:

1. **Sense:** Read current vehicle positions and speeds from detectors. Surtrac uses standard loop/video detectors — it's detection-agnostic.

2. **Cluster:** Group detected vehicles into "platoons" — clusters of vehicles moving together. Each platoon has: arrival time, vehicle count, speed, direction.

3. **Formulate:** Create a scheduling problem:
   - "Jobs" = vehicle platoons waiting to be served
   - "Machines" = signal phases
   - Constraints: Min/max green times, clearance intervals, phase sequence
   - Objective: Minimize total cumulative delay

4. **Solve:** Solve the MILP using a branch-and-bound algorithm. The solution is an optimal phase sequence and timing for the next planning horizon (~60-120 seconds).

5. **Execute:** Implement the first phase transition from the optimal plan.

6. **Communicate:** Send the planned outflow (expected platoons leaving this intersection) to downstream neighbors. This is the key coordination mechanism.

7. **Repeat:** Re-solve every few seconds as new vehicles arrive and conditions change.

**The key innovation:** Coordination emerges from agents sharing their planned outflows — no central coordinator needed. Each agent incorporates neighbor information into its optimization, creating a decentralized but coordinated system.

### 5.2 Published Results

**Pittsburgh Pilot (2012 — 9 intersections):**
- 25% reduction in travel time
- 40% reduction in wait time
- 31% reduction in number of stops
- 21% reduction in vehicle emissions

**Expanded Pittsburgh Deployment (2012-2023):**
- Started with 9 intersections in East Liberty neighborhood
- Expanded to 50 intersections with ATCMTD funding
- PennDOT grants for additional 150 intersections
- Consistent improvements maintained at scale

### 5.3 Where Surtrac is Deployed

Surtrac is commercialized through **Rapid Flow Technologies** (Dr. Smith's company):

- **Pittsburgh, PA:** 200+ intersections (largest deployment)
- **Atlanta, GA:** Active deployment
- **Portland, ME:** Active deployment
- **Needham and Quincy, MA:** Active deployment
- **Additional cities in negotiation** (undisclosed)

### 5.4 Licensing Model and Costs

Rapid Flow Technologies operates on a **software licensing + professional services** model:

- **Per-intersection licensing:** Estimated $15,000–$25,000 for initial deployment (hardware + software + engineering)
- **Annual maintenance/license:** Estimated $2,000–$5,000 per intersection per year
- **Professional services:** Custom integration, training, optimization
- **Exact pricing is not publicly available** — varies by deployment size and scope

The Pittsburgh deployment costs were cited as approximately **$20,000 per intersection** all-in (from Smart Cities Dive reporting).

### 5.5 Weaknesses/Limitations

1. **Detection dependency:** Surtrac relies on existing detection infrastructure. Many intersections have inadequate detection (broken loops, no advance detection). Surtrac doesn't fix bad detection.

2. **No computer vision:** Surtrac processes detector signals (presence/passage) — it doesn't "see" the intersection. No video analytics, no classification, no safety monitoring.

3. **Limited predictive capability:** Optimizes based on current conditions. Doesn't forecast demand or proactively adjust.

4. **Academic roots:** The system works brilliantly but the company (Rapid Flow) is small (~10-15 employees). Scaling, support, and deployment speed may be limited.

5. **No comprehensive platform:** Surtrac is signal optimization only. No dashboard, no ATSPM, no analytics beyond signal timing.

6. **Cost:** At $20K/intersection, it's expensive relative to the limited scope of what's provided.

### 5.6 What We'd Do Differently

1. **Replace traditional detection with AI vision.** Our CV pipeline provides 10x more data than loops/video detectors: counts, classification, speed, queue length, TMCs, trajectories, safety events — all from cameras.

2. **Full-stack platform, not just optimization.** Dashboard, analytics, ATSPM, reporting, mobile app, alerts — the complete package.

3. **Predictive, not just reactive.** LSTM/Transformer forecasting to proactively adjust timing before congestion builds.

4. **Lower cost per intersection.** $5,500 hardware vs. Surtrac's reliance on existing (often expensive) detection.

5. **Safety layer.** Wrong-way detection, red-light running analytics, near-miss identification — Surtrac doesn't do any of this.

6. **SaaS model.** Lower upfront costs, recurring revenue, continuous improvement.

---

## 6. NOTRAFFIC DEEP DIVE

### 6.1 Hardware/Software Approach

NoTraffic is an Israeli-founded (Tel Aviv) startup that's become the most visible AI traffic company in the market.

**Their System:**

**Hardware — NoTraffic Sensor Unit:**
- Combination radar + camera sensor mounted on the signal mast arm
- Edge processing built into the sensor unit
- AI detection of vehicles, pedestrians, cyclists, scooters
- Multi-modal detection (radar for all-weather, camera for classification)
- One sensor unit per approach (typically 4 per intersection)

**Software — NoTraffic Platform:**
- Cloud-based management platform
- Real-time intersection monitoring
- Adaptive signal optimization
- Phase and timing optimization
- Connected vehicle / V2X ready
- Digital twin visualization

**Integration:**
- Connects to existing signal controllers via NTCIP
- Works with Econolite, Siemens, McCain controllers
- Doesn't require controller replacement

### 6.2 Funding

- **Seed (2018):** $3.2M — Grove Ventures, Menora Mivtachim
- **Series A (2021):** $17.5M — Led by Grove Ventures
- **Series B (2023):** $50M — Led by M&G Investments, VNV Global, UMC Capital
- **Total raised: ~$70.7M**

### 6.3 Where Deployed

NoTraffic claims deployment in **200+ cities** (as of late 2023/2024):
- United States: Multiple cities across several states (Phoenix metro area is a major market)
- Israel: Extensive deployment
- Specific U.S. deployments include municipalities in Arizona, Texas, and California
- Growing international presence

### 6.4 Pricing Model

NoTraffic operates on a **SaaS model:**
- Hardware cost per intersection: Estimated $8,000–$15,000 (sensors + installation)
- Annual software subscription: Estimated $3,000–$6,000 per intersection per year
- **Typical total cost of ownership:** $15,000–$25,000 per intersection in Year 1, $3,000–$6,000/year ongoing
- Pricing varies significantly based on deployment size (volume discounts)

### 6.5 Strengths and Weaknesses

**Strengths:**
- Full-stack solution (hardware + software)
- Strong funding and growth trajectory
- Multi-modal detection (radar + camera)
- V2X/connected vehicle readiness
- Growing install base and reference customers
- Professional sales and support organization

**Weaknesses:**
- **Expensive:** $15K+ per intersection is a tough sell for budget-constrained agencies
- **Proprietary hardware lock-in:** Must use NoTraffic's sensors
- **Israeli company:** Some procurement sensitivity for U.S. government contracts
- **Not SDVOSB or disadvantaged business:** No procurement advantages
- **New entrant:** Still proving long-term reliability
- **Limited ATSPM integration:** Focus is on their own platform

---

## 7. OTHER COMPETITORS

### 7.1 Rhythm Engineering — InSync

**Overview:** Kansas City-based, one of the earliest adaptive signal control systems in the U.S.

**How InSync Works:**
- Uses video detection (GPS-based in newer versions) to measure traffic
- Centralized optimization with 10-second update cycles
- Calculates optimal green times based on demand
- Requires InSync processor hardware at each intersection
- NTCIP communication with controllers

**Deployment:** 3,000+ intersections across the U.S. — one of the largest installed bases

**Pricing:** ~$20,000–$30,000 per intersection (hardware + software + installation)

**Strengths:** Proven track record, large installed base, good agency relationships
**Weaknesses:** Aging technology, not AI/ML-based, expensive, no modern analytics platform

### 7.2 Iteris ClearGuide

**Overview:** Iteris (Santa Ana, CA) is a major ITS company with multiple product lines.

**ClearGuide:** Cloud-based traffic analytics platform using probe data (HERE, INRIX) rather than intersection detection. Provides performance monitoring and signal retiming recommendations.

**Vantage Next:** Their video detection system with AI-enhanced vehicle/ped/bike detection.

**Pricing:** ClearGuide ~$500–$1,500/intersection/year for analytics; Vantage detection hardware ~$5,000–$8,000 per intersection

**Strengths:** Established brand, FDOT relationships, good analytics
**Weaknesses:** ClearGuide is analytics only (no signal control), detection and analytics are separate products

### 7.3 Miovision

**Overview:** Canadian company, comprehensive traffic management platform.

**Products:**
- **TrafficLink:** Hardware sensor that provides detection + communication
- **Miovision One:** Unified platform for detection, data, adaptive signal control
- **Kadence:** AI-based adaptive signal control (newest product)
- **Scout:** Portable traffic data collection device

**Pricing:** ~$998/intersection/year for data analytics; hardware costs additional

**Deployment:** 40,000+ intersections connected (primarily detection/data); adaptive deployments growing

**Strengths:** Modern platform, good UX, growing rapidly, strong data analytics
**Weaknesses:** Canadian company (procurement consideration), pricing can add up, relatively new in adaptive control

### 7.4 Q-Free (formerly Intelight)

**Overview:** Norwegian company that acquired Intelight (MaxTime controller) and other ITS brands.

**Products:** MaxTime controller, MaxView ATMS, GRIDSMART detection (recently acquired), adaptive signal control

**Strengths:** Owns the controller (vertical integration), GRIDSMART is excellent fish-eye detection
**Weaknesses:** Complex corporate structure, integration between acquired products still maturing

### 7.5 Rapid Flow Technologies (Surtrac)

See Section 5 above. Small CMU spinout, strong technology but limited scale.

### 7.6 LYT

**Overview:** San Francisco-based, focuses on **Transit Signal Priority (TSP)** and **Emergency Vehicle Preemption (EVP)** using AI.

**How it works:** Uses existing communication infrastructure (cellular) to detect approaching buses/emergency vehicles and request signal priority without dedicated hardware (like Opticom).

**Strengths:** Low-cost TSP/EVP, software-only approach, growing quickly
**Weaknesses:** Narrow focus (TSP/EVP only, not general signal optimization)

**Opportunity:** Partnership target — they do TSP/EVP, we do adaptive optimization.

### 7.7 Derq

**Overview:** Detroit-based, focuses on **safety analytics** at intersections.

**Products:**
- AI-powered detection and tracking
- Near-miss / conflict analysis
- V2X / connected vehicle applications
- Real-time safety alerts

**Strengths:** Strong safety focus, V2X capability, Dubai origins give international credibility
**Weaknesses:** Safety-focused, not primary signal optimization

### 7.8 Google Project Green Light

**Overview:** Google Research project using Google Maps driving data to optimize signal timing.

**How it works:**
- Analyzes aggregate Google Maps data (speed, stops, travel patterns) across millions of trips
- Identifies intersections with high stop rates
- Generates signal timing recommendations
- Provides recommendations to city traffic engineers (free)
- Engineers implement the changes manually

**Results:**
- Live in 20+ cities across 4 continents (Haifa, Hamburg, Kolkata, Boston, Seattle, etc.)
- Up to 30% reduction in stops
- Up to 10% reduction in intersection emissions

**Strengths:** Free, uses existing Google Maps data (no hardware needed), Google's brand and AI capabilities
**Weaknesses:**
- **Advisory only** — doesn't control signals, just recommends
- Limited to intersections with enough Google Maps data
- No real-time adaptation (analyzes historical patterns)
- No edge hardware or detection
- Google could shut it down (as they do with many projects)
- Not a commercial product — hard to build a business against "free"

**Our differentiation vs. Google:** We provide real-time adaptive control, not just recommendations. We install detection hardware. We provide a complete platform with dashboards and analytics. Google gives you a PDF of recommendations; we give you a living system.

---

## 8. LAKE NONA SPECIFIC OPPORTUNITY

### 8.1 Tavistock Development's Smart City Vision

**Lake Nona** is a 17-square-mile master-planned community in southeast Orlando, developed by **Tavistock Development Company** (part of Tavistock Group). It is one of the most tech-forward communities in America.

**Smart City Initiatives:**
- **Cisco Partnership:** Lake Nona was designated as the first U.S. "Iconic Smart+Connected Community" by Cisco, with intelligent transportation platforms explicitly included
- **Hitachi America:** Deployed Movement Analytics and Drone Integration for traffic pattern analysis and mobility optimization
- **$20M Federal BUILD Grant (2019):** Orange County received $20 million to create a Local Alternative Mobility Network (LAMN) in Lake Nona, including:
  - Full-service mobility hub in Town Center
  - Linear park with pedestrian/bicycle infrastructure
  - Bridge across Lake Nona Blvd
  - 25+ miles of dedicated autonomous vehicle (AV) lanes
  - Bicycle transportation network
- **Move Nona AV Shuttle:** Autonomous vehicle shuttle pilot for first/last-mile connectivity
- **Beep (formerly BRT):** AV shuttle operations in Lake Nona

**Why this matters for us:**
- Tavistock is **actively investing in smart transportation technology**
- They've already secured federal funding for mobility projects
- The community has existing smart infrastructure (fiber, sensors, connectivity)
- Lake Nona is a **living lab** — they welcome technology pilots
- A successful pilot here = immediate credibility for broader deployment

### 8.2 Key Intersections and Corridors

**Narcoossee Road (Critical)**
- The main north-south artery connecting Lake Nona to SR 528, SR 417, and the broader Orlando area
- Orlando Sentinel (Sept 2025): "Narcoossee Road traffic among worst in Central Florida, with few solutions"
- 17 miles of roadway, rapidly increasing traffic from Lake Nona and St. Cloud growth
- Signalized intersections along Narcoossee are prime candidates for optimization
- Key intersections:
  - Narcoossee Rd & Lake Nona Blvd
  - Narcoossee Rd & Nemours Pkwy
  - Narcoossee Rd & Boggy Creek Rd
  - Narcoossee Rd & Moss Park Rd
  - Narcoossee Rd & SR 528 ramps

**Lake Nona Blvd**
- East-west spine of the community
- Connects Medical City, Town Center, residential areas
- Growing congestion during peak hours as community buildout continues

**Boggy Creek Rd**
- $90M widening project underway (Osceola County, from Simpson Rd to Narcoossee Rd)
- Once complete, will need new signal timing optimization
- Construction expected through 2026-2027

**Nemours Parkway**
- Access to Nemours Children's Hospital and Lake Nona Medical City
- Ambulance preemption is critical
- School zone interactions (Lake Nona High School, Lake Nona Middle School)

**Medical City Area**
- UCF College of Medicine, Nemours Children's Hospital, Orlando VA Medical Center, UF Research
- High AM peak demand (staff shift changes)
- Mixed pedestrian/vehicle traffic
- **VA Medical Center** — direct SDVOSB connection opportunity

### 8.3 Current Traffic Problems

1. **Morning Commute Gridlock:** Narcoossee Rd backs up significantly from SR 528 south through Lake Nona during AM peak. Single north-south route creates bottleneck.

2. **Medical City Congestion:** 7:00-8:30 AM shift change at hospitals/medical facilities creates concentrated demand at Nemours Pkwy and Lake Nona Blvd intersections.

3. **Rapid Growth Outpacing Infrastructure:** Lake Nona is one of the fastest-growing communities in the U.S. Population and employment growth far outpacing road capacity expansion.

4. **Orlando traffic overall worsening:** Drivers in Orlando wasted an average of **68 hours in traffic in 2024**, up 6% from 2023.

5. **SR 417 congestion:** The GreeneWay (SR 417) from Boggy Creek to Narcoossee is being widened from 4 to 6 lanes — $90M+ project — indicating demand has exceeded capacity.

6. **School traffic:** Multiple new schools in Lake Nona creating morning/afternoon peak spikes that current fixed signal timing doesn't handle well.

### 8.4 Orange County Traffic Engineering

**Orange County Traffic Engineering Division:**
- Responsible for signal operations on county roads
- Uses **Centracs** ATMS (Econolite) for central signal management
- Has fiber connectivity to many signals
- Part of FDOT District 5's regional partnership

**How to engage:**
1. Contact Orange County Traffic Engineering Division
2. Present pilot proposal with performance guarantees
3. Offer free pilot on 3-5 intersections (our cost)
4. Use ATSPM data to prove performance improvement
5. Publish results → use as reference for broader deployment

### 8.5 FDOT District 5

**FDOT District 5** covers 9 counties including Orange County (Lake Nona).

**District 5 Smart Roads (CFLSmartRoads.com):**
- Active TSM&O program
- **Smart Signals** design guidance program
- ATCMTD grant recipient ($11.9M federal + $53M matching)
- Actively deploying connected vehicle technology
- SunGuide TMC operations

**FDOT District 5 Secretary:** John E. Tyler, P.E.

**Key contact path:**
1. FDOT District 5 TSM&O office
2. Traffic Operations Center (SunGuide)
3. District Signal Operations Engineer

---

## 9. REGULATORY AND PROCUREMENT

### 9.1 MUTCD Compliance

The **Manual on Uniform Traffic Control Devices (MUTCD)** is THE federal standard for traffic signals. Our system must comply with:

- **Minimum green times:** Cannot reduce green below safe minimums (typically 7s for through, 4s for left turns)
- **Yellow change intervals:** Calculated by speed, grade — cannot be modified by AI
- **All-red clearance intervals:** Fixed by intersection geometry — cannot be modified
- **Pedestrian timing:** WALK + Flashing Don't Walk intervals based on crosswalk length and walking speed (3.5 ft/s)
- **Phase sequence:** Must follow NEMA standards (conflicting phases never simultaneous)

**Our compliance approach:**
- The conflict monitor (hardware in the cabinet) enforces safety regardless of our software
- Our optimization operates WITHIN the constraints — we adjust green splits and phase sequence, not safety intervals
- All safety parameters are hardcoded minimums that our algorithm cannot violate
- We document MUTCD compliance in our system design

### 9.2 FHWA Guidelines

FHWA's **Every Day Counts (EDC)** program actively promotes ASCT and ATSPM. Key resources:
- FHWA ASCT Fact Sheet
- ATSPM Implementation Guide
- Signal Timing Manual (FHWA-HOP-08-024)

**FHWA's position:** They WANT agencies to deploy adaptive signals. Our technology aligns with federal priorities.

### 9.3 Florida DOT Standards

**FDOT Traffic Engineering Manual:**
- Chapter 6: Signal Timing and Phasing
- Chapter 7: Signal Maintenance
- Requires approval of signal timing changes by the maintaining agency

**FDOT Design Standards:**
- Signal cabinet and equipment specifications
- Camera/sensor mounting requirements
- Electrical standards

**FDOT TSM&O Program:**
- Actively promoting technology deployment
- Smart Signals design guidance
- Supportive of adaptive signal control

### 9.4 How to Get Permission to Modify Signal Timing

**For signals maintained by the MUNICIPALITY (City of Orlando, Orange County):**
1. Submit a written proposal to the traffic engineering department
2. Include: Technology description, proposed intersections, expected benefits, safety analysis
3. Execute a **Maintenance of Traffic (MOT) agreement** or similar
4. Traffic engineer reviews and approves (or modifies) any timing changes
5. Typically requires a **pilot agreement** with performance metrics and rollback provisions
6. Insurance requirements (typically $1M general liability, $5M umbrella)

**For signals on STATE roads (FDOT-maintained):**
1. Work through FDOT District 5 TSM&O office
2. More formal process — may require design review
3. FDOT has standard processes for technology pilots
4. May require PE (Professional Engineer) stamp on timing plans

**For signals in TAVISTOCK/Lake Nona Development:**
- Many internal roads may be privately maintained (or maintained by a CDD — Community Development District)
- Tavistock likely has significant influence on signal operations within the development
- This is a potential fast-track: Tavistock says yes, we deploy on their roads without full county/state process
- County/state roads (Narcoossee, Boggy Creek) still require government approval

### 9.5 Federal Funding Opportunities

**SMART Grants (Strengthening Mobility and Revolutionizing Transportation):**
- USDOT program, $500M total authorized
- Stage 1: Planning grants up to $2M
- Stage 2: Implementation grants up to $15M
- Focus areas: Smart traffic signals is explicitly listed
- FY24 awards announced; future rounds possible but uncertain under current administration

**RAISE Grants (Rebuilding American Infrastructure with Sustainability and Equity):**
- Up to $25M per project
- Competitive, emphasis on equity and climate
- Traffic signal modernization is eligible

**Carbon Reduction Program:**
- Formula funding to states for carbon reduction projects
- Traffic signal optimization directly reduces emissions
- FDOT receives allocation — can fund signal projects through this

**ATCMTD (Advanced Transportation and Congestion Management Technologies Deployment):**
- FDOT District 5 already has a $11.9M ATCMTD grant for Central Florida
- Could potentially add our technology to the existing program

**FHWA Accelerated Innovation Deployment (AID):**
- Up to $1M for deploying proven innovations
- ASCT qualifies

### 9.6 How SDVOSB Status Helps

**Federal Contracting:**
- Federal government has a **3% goal** for contracting dollars to SDVOSBs
- **Sole-source contracts** up to $4M (manufacturing) or $4M (other) can be awarded directly to SDVOSBs
- **Set-aside contracts** where only SDVOSBs can compete
- Evaluation credit in competitive bids

**State/Local Contracting:**
- Florida recognizes veteran-owned business preferences
- Many agencies give evaluation point advantages (5-10% in scoring)
- Some set-asides at the state/local level

**For FDOT specifically:**
- FDOT has a **Disadvantaged Business Enterprise (DBE)** program
- Veteran-owned businesses may qualify for DBE certification in Florida
- **FDOT's Small Business Development program** supports small firms on DOT contracts

**Strategy:** Position every contract opportunity as an SDVOSB vendor. On federal-funded projects (SMART grants, RAISE, etc.), the SDVOSB status is a meaningful competitive advantage. Lead proposals through the SDVOSB entity, subcontract technical work as needed.

---

## 10. COST MODEL (DETAILED)

### 10.1 Per Intersection Costs

#### Year 1 Costs Per Intersection

| Category | Standard | Premium |
|----------|----------|---------|
| Hardware (cameras, edge, network) | $4,068 | $8,259 |
| Installation | $1,400 | $1,200 |
| Software license (Year 1) | $2,400 | $2,400 |
| Cellular connectivity (12 months) | $480 | $480 |
| Commissioning & calibration | $500 | $750 |
| **Year 1 Total** | **$8,848** | **$13,089** |

#### Ongoing Annual Costs Per Intersection

| Category | Cost |
|----------|------|
| Software subscription | $2,400 |
| Cellular connectivity | $480 |
| Preventive maintenance (1 visit/year) | $300 |
| Cloud infrastructure | $200 |
| **Annual Total** | **$3,380** |

### 10.2 Platform Development Costs

#### MVP (Months 1-8)

| Component | Effort | Cost |
|-----------|--------|------|
| CV Pipeline (YOLO + tracking) | 3 months, 2 engineers | $90,000 |
| Edge software stack | 3 months, 2 engineers | $90,000 |
| Signal optimization (MILP) | 4 months, 1 engineer | $60,000 |
| NTCIP integration | 2 months, 1 engineer | $30,000 |
| Cloud backend | 3 months, 1 engineer | $45,000 |
| Dashboard (basic) | 3 months, 1 engineer | $45,000 |
| SUMO digital twin | 2 months, 1 engineer | $30,000 |
| Testing & QA | 2 months, 1 engineer | $30,000 |
| Cloud infrastructure | 8 months | $5,000 |
| **MVP Total** | | **$425,000** |

#### Production Platform (Months 9-18)

| Component | Cost |
|-----------|------|
| RL/ML model development | $120,000 |
| Advanced dashboard + ATSPM | $90,000 |
| Mobile app | $60,000 |
| Multi-intersection coordination | $90,000 |
| ATMS integration (Centracs) | $60,000 |
| Security hardening | $30,000 |
| Documentation & training materials | $20,000 |
| **Production Platform Total** | **$470,000** |

#### Total Platform Development: ~$895,000

### 10.3 Staffing Plan

#### Core Team (Year 1)

| Role | When | Salary | Notes |
|------|------|--------|-------|
| CTO / Lead Engineer | Month 1 | $180,000 | CV + ML expertise, can build the MVP |
| Traffic Engineer (PE) | Month 1 | $95,000 | Signal timing, agency relationships, MUTCD compliance |
| CV/ML Engineer | Month 3 | $150,000 | YOLO, edge optimization, model training |
| Full-Stack Developer | Month 3 | $130,000 | Dashboard, cloud, APIs |
| Sales / BD (part-time) | Month 1 | $60,000 | Alan + 1 BD person; agency outreach |
| **Year 1 Payroll** | | **$615,000** | Plus ~30% burden = ~$800,000 |

#### Year 2 Additions

| Role | Salary |
|------|--------|
| Field Technician | $55,000 |
| Junior ML Engineer | $110,000 |
| Customer Success / Support | $65,000 |
| Traffic Engineer #2 | $95,000 |
| **Year 2 Additional Payroll** | **$325,000** |

### 10.4 Timeline to First Revenue

| Month | Milestone |
|-------|-----------|
| 1-3 | Hire CTO + Traffic Engineer; begin CV pipeline development |
| 3-6 | Hire CV engineer + developer; build MVP edge system |
| 6-8 | Lab testing with SUMO simulation; refine algorithms |
| 8-10 | Pilot deployment at 3-5 Lake Nona intersections (free) |
| 10-14 | Collect 3-6 months of performance data from pilot |
| 14-16 | Publish results; begin sales to Orange County, FDOT |
| 16-18 | **First paid contract** (target: 20-50 intersections) |
| 18-24 | Expand deployment; refine product |

**Time to first revenue: ~16-18 months**

### 10.5 Break-Even Analysis

**Assumptions:**
- Year 1: Free pilot (3-5 intersections), no revenue
- Year 2: 50 paid intersections at $8,000 Year 1 + $3,400/year ongoing
- Year 3: 150 total intersections, $3,400/year each + 75 new at $8,000

| | Year 1 | Year 2 | Year 3 |
|---|--------|--------|--------|
| Revenue | $0 | $400,000 | $910,000 |
| Hardware COGS | ($25,000) | ($200,000) | ($300,000) |
| Gross Profit | ($25,000) | $200,000 | $610,000 |
| Payroll (burdened) | ($800,000) | ($1,100,000) | ($1,400,000) |
| Platform/Cloud | ($430,000) | ($50,000) | ($75,000) |
| Office/Misc | ($50,000) | ($75,000) | ($100,000) |
| **Net** | **($1,305,000)** | **($1,025,000)** | **($965,000)** |
| **Cumulative** | **($1,305,000)** | **($2,330,000)** | **($3,295,000)** |

**Break-even at ~400-500 intersections** (Year 4-5 at aggressive growth) on recurring SaaS revenue.

**Total funding needed: $2.5M–$3.5M** to reach break-even (or ~$1.5M to reach a demonstrable pilot with proven results sufficient to raise a Series A).

### 10.6 Pricing Models

**Option A: SaaS Per Intersection**
- Hardware: Sold at cost or included in 3-year contract
- Monthly fee: $200-$500/intersection/month ($2,400-$6,000/year)
- Lower barrier to entry, predictable recurring revenue
- **Recommended**

**Option B: Project-Based**
- Fixed price per intersection: $15,000-$25,000 (install + Year 1)
- Annual maintenance: $3,000-$5,000/year
- Higher upfront revenue, lower recurring
- More familiar to agencies

**Option C: Performance-Based**
- Base fee + performance bonus tied to measured improvements
- E.g., $2,000/intersection/year base + $X per % delay reduction
- Aligned incentives, but harder to contract
- Use for pilot to demonstrate confidence

---

## 11. GO-TO-MARKET STRATEGY

### Phase 1: Free Pilot with Tavistock/Lake Nona (Months 8-14)

**Target:** 3-5 intersections on Lake Nona internal roads (Tavistock-controlled)

**Approach:**
1. Pitch directly to Tavistock Development — their innovation/smart city team
2. Position as: "We'll bring AI traffic optimization to Lake Nona at our cost. You get better traffic flow. We get real-world validation."
3. Install in analytics-only mode first (no signal control changes)
4. After 2-3 months of data collection, present findings and recommended timing changes
5. With Tavistock's support, get traffic engineer approval for optimized timing
6. Measure before/after performance improvement

**Success metrics:** 10-25% travel time reduction, 15-30% delay reduction, documented with ATSPM data

**Cost to us:** ~$30,000-$50,000 (hardware + installation for 3-5 intersections + engineering time)

### Phase 2: Orange County Contract (Months 14-24)

**Target:** 20-50 intersections on Orange County roads in the Lake Nona area

**Approach:**
1. Use Tavistock pilot results as proof of concept
2. Respond to Orange County RFPs for signal modernization
3. Leverage SDVOSB status for procurement advantage
4. Target Narcoossee Rd corridor as highest-impact opportunity
5. Partner with a local engineering firm (Kittelson, Kimley-Horn) for traffic engineering credibility

**Revenue target:** $200,000-$400,000

### Phase 3: FDOT Corridor Project (Months 18-30)

**Target:** FDOT District 5 state road corridors

**Approach:**
1. Engage FDOT TSM&O office with Orange County results
2. Propose pilot on a state road corridor (e.g., SR 15/Narcoossee Rd)
3. Apply for FHWA AID demonstration funding ($1M)
4. Align with FDOT's Smart Signals program
5. Target 50-100 intersections

### Phase 4: Multi-County Expansion (Months 24-36)

**Target:** Seminole, Osceola, Brevard, Volusia counties in Central Florida

**Approach:**
1. Regional reference from Orange County/FDOT
2. Present at Florida ITS conference and TRB (Transportation Research Board)
3. Hire regional sales rep for Central Florida agencies
4. Target 200+ intersections

### Phase 5: SaaS Platform (Months 30+)

**Target:** National expansion, any city/county

**Approach:**
1. Productize the platform for self-service deployment
2. Partner with signal controller manufacturers (Econolite, McCain) for bundled offerings
3. Partner with consulting engineering firms as resellers/integrators
4. Target 1,000+ intersections nationally

### Positioning Against Incumbents

| Competitor | Our Advantage |
|-----------|---------------|
| Surtrac/Rapid Flow | Full platform (not just optimization), lower cost, AI vision, safety analytics |
| NoTraffic | Lower cost, SDVOSB, American-founded, flexible hardware |
| InSync (Rhythm) | Modern AI/ML vs. aging algorithms, full analytics platform, lower cost |
| Iteris | Integrated solution (detection + optimization + analytics) vs. separate products |
| Google Green Light | Real-time control vs. recommendations only, installed hardware, dedicated support |

### Partnership Strategy

**Controller Manufacturers (Critical):**
- **Econolite:** Their Cobalt controller runs Linux — we can potentially be an app on their platform. They also make Autoscope. Natural partner.
- **McCain:** 2070 controller is open architecture. Partner for integration.
- Approach: "We sell more of your controllers and provide differentiated value-add."

**Engineering Firms:**
- **Kittelson & Associates:** Top traffic engineering firm, strong Florida presence
- **Kimley-Horn:** Large engineering firm, does FDOT work
- These firms do signal retiming studies. We can be their technology platform.
- Partner model: They sell our technology as part of their engineering projects.

**Detection Companies:**
- **Wavetronix:** Our system can fuse radar data with CV data
- **FLIR:** Thermal for all-weather backup

---

## 12. TEAM REQUIREMENTS

### 12.1 Roles Needed and When to Hire

**Founding Team (Month 1):**
- **Alan Oney — CEO/Founder:** Business development, agency relationships, SDVOSB owner, investor relations
- **CTO (HIRE):** Computer vision PhD or equivalent experience. Must have shipped edge AI products. Ideally traffic or autonomous vehicle background. $150K-$200K + equity.
- **Traffic Engineer (HIRE):** PE license required. 10+ years signal timing experience. Knows FDOT processes. Understands NTCIP, ATSPM. Former DOT engineer ideal. $85K-$110K + equity.

**Month 3-6:**
- **CV/ML Engineer:** YOLOv8, TensorRT, Jetson optimization, model training. $130K-$160K.
- **Full-Stack Developer:** React, Python, AWS, real-time dashboards. $110K-$140K.

**Month 12-18:**
- **Field Technician:** Installation, maintenance, troubleshooting. Former signal tech ideal. $50K-$65K.
- **Junior ML Engineer:** RL, simulation, model improvement. $100K-$120K.
- **Sales/BD:** Government sales experience, preferably transportation. $70K-$90K + commission.

### 12.2 Outsourcing Options

**Can outsource initially:**
- Dashboard/frontend development (contract firm, $50-$100/hr)
- Mobile app development (contract, $75-$125/hr)
- Cloud infrastructure setup (DevOps consultant, $150-$200/hr)
- Hardware enclosure design (mechanical engineering firm)
- Formal traffic analysis reports (partnered PE firm)

**Must NOT outsource:**
- CV/ML pipeline (core IP)
- Signal optimization algorithm (core IP)
- NTCIP integration (domain-critical)
- Agency relationships (must be in-house)

### 12.3 University Partnerships

**UCF (University of Central Florida) — #1 Priority:**
- Located IN Orlando — 30 minutes from Lake Nona
- Center for Advanced Transportation Systems Simulation (CATSS)
- Strong ITS/transportation engineering program
- Source for graduate research assistants ($25K-$35K/year)
- Potential for joint research grants (NSF, USDOT UTC)
- Professor connections to FDOT

**Georgia Tech — High Priority:**
- Top transportation engineering program
- Strong AI/ML research
- Georgia DOT relationships (good for Atlanta expansion)

**CMU — Aspirational:**
- Where Surtrac was invented
- Robotics Institute, Traffic21
- Recruit from their talent pool (don't try to partner — they have Rapid Flow)

**How to engage universities:**
- Sponsor a graduate research project ($50K-$100K/year)
- Provide real intersection data for research
- Offer internships and co-ops
- Propose joint conference papers (TRB, ITE)
- Get a professor on your advisory board

### 12.4 Advisory Board Targets

- **Former FDOT District Secretary or State Traffic Operations Engineer** — opens doors at every level
- **PE with ASCT deployment experience** — technical credibility
- **UCF transportation professor** — academic credibility and talent pipeline
- **Former city/county traffic engineer** (Orange County ideal) — insider knowledge
- **ITS industry executive** (Econolite, Iteris, or similar alum) — industry relationships

---

## 13. IP AND DEFENSIBILITY

### 13.1 What's Patentable

**Potentially patentable innovations:**

1. **Hybrid CV+MILP signal optimization method:** Using computer vision detection data as input to a schedule-driven optimizer (the specific fusion approach may be novel)

2. **Edge-cloud cooperative optimization:** Specific architecture for split processing between edge (real-time) and cloud (predictive/learning)

3. **CV-based turning movement count method:** Automated TMC from intersection video (specific implementation, zone definitions, accuracy enhancement methods)

4. **Multi-modal detection fusion for signal control:** Combining CV + existing loops/radar for robust detection

5. **Queue length estimation from video:** Specific shockwave-based or spatial-based methods

**Recommendation:** File provisional patents on methods 1-2 as soon as MVP is working. Cost: ~$2,000-$5,000 per provisional (use a patent attorney experienced in software/AI patents).

**Trade secrets (don't patent — keep secret):**
- Trained model weights
- Specific training data and augmentation techniques
- Algorithm tuning parameters
- Proprietary data processing optimizations

### 13.2 Data Moat

**This is your strongest defensibility.**

Once deployed at an intersection, you accumulate:
- Continuous traffic pattern data (24/7/365)
- Seasonal variations, event impacts, weather correlations
- Turning movement patterns by time-of-day, day-of-week
- Historical performance data tied to specific timing configurations
- Near-miss and safety event data

**After 1-2 years, you have a dataset that no competitor can replicate without deploying at that intersection for 1-2 years.** This data:
- Trains better predictive models for that intersection
- Enables before/after proof of performance
- Becomes the institutional memory for the traffic engineer
- Creates switching costs (lose 2 years of data if you switch)

### 13.3 Switching Costs

Once installed, switching away from our system means:
- Losing all historical data and analytics
- Re-deploying different hardware
- Re-training staff on new platform
- Potential performance degradation during transition
- Re-establishing baseline performance measures

**Government agencies are notoriously reluctant to switch vendors** once a system is working. This is both an opportunity (hard to displace incumbents) and a moat (hard for competitors to displace us once installed).

### 13.4 Network Effects

**Local network effect:** The more intersections we have in a corridor, the better our coordination. An agency with 50 intersections gets more value per intersection than one with 5. This incentivizes agencies to expand our deployment rather than mixing vendors.

**Regional network effect:** Understanding traffic patterns across multiple agencies enables regional optimization and travel time prediction. The more of the network we have, the better our predictions.

**Data network effect:** Every intersection makes our ML models better. More diverse data = more robust models = better performance at the next intersection.

---

## 14. HOW THIS TIES TO UPTEND

### 14.1 Shared SDVOSB Entity

**Structure Options:**

**Option A: Division of UpTend (Recommended Initially)**
- Smart Traffic AI operates as a division/product line of UpTend LLC
- SDVOSB certification applies automatically
- Shared overhead, shared back office
- Simpler to manage
- If it takes off, spin out later

**Option B: Separate LLC (Subsidiary)**
- Create "UpTend Traffic Solutions LLC" or similar
- UpTend LLC is the majority owner → SDVOSB still applies
- Cleaner liability separation
- Easier to bring in co-investors later
- More paperwork/overhead

**Recommendation:** Start as a division. If you raise external capital or the traffic business exceeds $2M+ revenue, spin it out as a subsidiary.

### 14.2 Data Synergies

**Traffic → Home Services:**
- Understanding neighborhood traffic patterns helps optimize home service routing (junk removal, cleaning, etc.)
- "Your area has low traffic between 10am-2pm — ideal for service appointments"
- Traffic data informs marketing: busy corridors = billboard/advertising opportunity

**Home Services → Traffic:**
- UpTend's HOA relationships provide entry to residential community traffic concerns
- "We already manage your HOA — let us optimize the signal at your entrance too"
- Fleet data from UpTend service vehicles could supplement traffic monitoring

**Shared Data Platform:**
- Both businesses benefit from a robust cloud data platform
- Shared engineering infrastructure reduces costs
- Customer data (HOAs, property managers) is reusable across both businesses

### 14.3 Tavistock Relationship

**The Tavistock connection is GOLD:**

1. UpTend's existing (or developing) relationship with Tavistock through Lake Nona HOA/community services
2. Use home services as the door opener: "We already serve Lake Nona residents..."
3. Pitch smart traffic as a value-add to the smart community vision
4. Tavistock's innovation team is actively seeking these partnerships
5. **One relationship → two business lines** (home services + traffic technology)

### 14.4 Investor Narrative

**The combined story is powerful:**

"UpTend is a veteran-owned technology company building the smart community operating system. We started with home services — the most tangible pain point for residents. Now we're expanding into traffic optimization — the most tangible pain point for commuters. Both solutions deploy in the same communities, share the same government relationships, and build on the same data platform. Lake Nona is our proving ground, and our SDVOSB status gives us preferred access to $100B+ in federal infrastructure spending."

**This narrative works because:**
- It's not "we're a random traffic startup" — you have a community platform thesis
- SDVOSB + government infrastructure spending = massive TAM with competitive advantage
- Lake Nona is the perfect proof point (smart city, federal funding, brand recognition)
- Multiple revenue streams reduce investor risk

### 14.5 Division vs. Separate Company Decision Matrix

| Factor | Division | Separate Company |
|--------|----------|-----------------|
| Speed to launch | ✅ Faster | ❌ More setup |
| SDVOSB status | ✅ Automatic | ✅ If structured correctly |
| Raising capital | ❌ Complicates UpTend cap table | ✅ Clean investment vehicle |
| Liability | ❌ Shared | ✅ Separated |
| Operations complexity | ✅ Simpler | ❌ Two entities to manage |
| Exit flexibility | ❌ Harder to sell independently | ✅ Can sell division separately |
| Team incentives | ❌ Harder to give traffic-specific equity | ✅ Separate equity pool |

**Recommendation:** Start as a division. Spin out when either: (a) you're ready to raise $2M+ specifically for traffic, or (b) traffic revenue exceeds UpTend home services revenue.

---

## APPENDIX A: GLOSSARY

| Term | Definition |
|------|-----------|
| ASCT | Adaptive Signal Control Technology |
| ATMS | Advanced Traffic Management System |
| ATSPM | Automated Traffic Signal Performance Measures |
| ATC | Advanced Transportation Controller |
| BOM | Bill of Materials |
| CV | Computer Vision |
| DRL | Deep Reinforcement Learning |
| FDOT | Florida Department of Transportation |
| FHWA | Federal Highway Administration |
| LOS | Level of Service |
| MILP | Mixed Integer Linear Programming |
| MUTCD | Manual on Uniform Traffic Control Devices |
| NEMA | National Electrical Manufacturers Association |
| NTCIP | National Transportation Communications for ITS Protocol |
| PE | Professional Engineer |
| RL | Reinforcement Learning |
| SDVOSB | Service-Disabled Veteran-Owned Small Business |
| SUMO | Simulation of Urban MObility |
| TMC | Turning Movement Count |
| TOD | Time of Day |
| TSM&O | Transportation Systems Management & Operations |
| TMC | Traffic Management Center |
| V2X | Vehicle-to-Everything |

---

## APPENDIX B: KEY CONTACTS AND RESOURCES

### Government
- **Orange County Traffic Engineering Division** — Signal operations, permits
- **FDOT District 5 TSM&O** — State road signals, funding programs
- **CFLSmartRoads.com** — District 5 ITS/Smart Signals programs
- **FHWA Florida Division** — Federal funding, innovation programs

### Industry Organizations
- **ITE (Institute of Transportation Engineers)** — Florida Section
- **Florida ITS Society** — Annual conference, networking
- **TRB (Transportation Research Board)** — Annual meeting (January, DC)

### Technology Partners
- **Econolite** — Controller integration, Cobalt platform
- **NVIDIA** — Jetson platform, Metropolis ecosystem, potential co-marketing
- **UCF CATSS** — Research partnership

### Lake Nona
- **Tavistock Development Company** — Innovation/smart city team
- **Lake Nona Institute** — Community innovation hub
- **Lake Nona CDD** — Community Development District (infrastructure)

---

## APPENDIX C: RECOMMENDED FIRST 90 DAYS

| Week | Action |
|------|--------|
| 1-2 | Read this document end-to-end. Watch YouTube videos on NTCIP, signal timing, YOLOv8. |
| 3-4 | Post CTO job listing. Begin outreach to UCF transportation department. |
| 5-6 | Order Jetson Orin Nano dev kit ($249) and test camera. Start building CV pipeline prototype. |
| 7-8 | Contact Tavistock Development innovation team. Request meeting to discuss traffic pilot. |
| 9-10 | Contact Orange County Traffic Engineering. Introduce UpTend, explore pilot opportunities. |
| 11-12 | Interview CTO candidates. Begin SUMO simulation of Lake Nona corridor. |
| 13 | Hire CTO. Begin formal development timeline. |

---

*This document was compiled in March 2026 and reflects current market conditions, pricing, and technology. Update quarterly as the market evolves rapidly.*

*Total estimated investment to reach first paying customer: $1.5M–$2.5M*
*Total estimated time to first revenue: 16–18 months*
*Target market size: 330,000+ signalized intersections in the U.S. at $3,000-$6,000/year = $1B-$2B TAM*
