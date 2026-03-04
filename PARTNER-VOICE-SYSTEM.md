# Partner Voice System - George AI Voice Assistant

The Partner Voice System provides each HVAC partner with a dedicated phone number powered by George AI. Customers can call and have natural conversations with George, who can book appointments, answer questions, create leads, and more.

## ✨ Key Features

- **Dedicated Phone Numbers**: Each partner gets their own Twilio phone number
- **Custom Greetings**: Partners can customize George's greeting with their business name
- **Full George AI**: Uses the complete George agent with 140+ tools and capabilities
- **ElevenLabs Voice**: High-quality voice synthesis using Josh voice (`TxGEqnHWrfWFTfGW9XjX`)
- **Call Analytics**: Complete call logs, transcripts, and conversion tracking
- **Tier Gated**: Requires Growth+ tier (`george_voice` feature)

## 🏗️ Architecture

### Components

1. **Partner Voice Service** (`server/services/partner-voice.ts`)
   - Manages conversation flow and George integration
   - Handles partner-specific context and greetings
   - Analyzes calls for lead/job creation

2. **Twilio-ElevenLabs Integration** (`server/services/twilio-elevenlabs.ts`)
   - Converts George's text responses to speech
   - Serves audio files for Twilio `<Play>` elements
   - Caches common phrases for faster response

3. **Partner Voice Routes** (`server/routes/partner-voice.routes.ts`)
   - Twilio webhook endpoints
   - Partner phone management API
   - Call history and analytics

4. **Frontend Component** (`client/src/pages/partners/partner-phone.tsx`)
   - Partner dashboard for phone management
   - Call analytics and transcript viewing
   - Custom greeting editor

### Database Tables

```sql
-- Partner phone numbers
partner_phone_numbers (
  id, partner_slug, twilio_phone_number, twilio_phone_sid,
  greeting, active, created_at, updated_at
)

-- Call logs with outcomes
voice_call_logs (
  id, partner_slug, call_sid, caller_number, called_number,
  status, duration_seconds, transcript, lead_created,
  lead_id, job_created, job_id, recording_url, total_cost,
  created_at, updated_at
)

-- Turn-by-turn conversation
voice_conversation_turns (
  id, call_sid, turn_number, role, content, audio_url,
  duration_ms, created_at
)
```

## 🚀 Quick Start

### 1. Prerequisites

Ensure you have these API keys in your `.env` file:

```bash
# Twilio
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...

# ElevenLabs
ELEVENLABS_API_KEY=sk_...

# Database
DATABASE_URL=postgresql://...
```

### 2. Database Setup

The migration should already be applied. If not:

```bash
psql $DATABASE_URL -f server/migrations/003-partner-voice-tables.sql
```

### 3. Test the System

```bash
node test-voice-system.cjs
```

This verifies:
- ✅ Environment variables are configured
- ✅ Database tables exist
- ✅ Twilio API is connected
- ✅ ElevenLabs API is configured
- ✅ Audio directory is ready

### 4. Start the Server

```bash
npm run dev
```

### 5. Provision a Partner Phone Number

1. Visit: `http://localhost:5000/partners/{slug}/phone`
2. Click "Get Phone Number" to provision a new Twilio number
3. Customize the greeting if desired
4. Configure Twilio webhooks (see below)

## 📞 Twilio Webhook Configuration

When provisioning phone numbers, the system automatically configures these webhooks:

- **Voice URL**: `{BASE_URL}/api/voice/partner/incoming`
- **Status Callback**: `{BASE_URL}/api/voice/partner/status`

For existing numbers, manually configure:

1. Go to Twilio Console → Phone Numbers
2. Select your partner's number
3. Set:
   - Voice URL: `https://your-domain.com/api/voice/partner/incoming`
   - HTTP Method: POST
   - Status Callback: `https://your-domain.com/api/voice/partner/status`

## 🎯 API Endpoints

### Twilio Webhooks

- `POST /api/voice/partner/incoming` - Handle incoming calls
- `POST /api/voice/partner/process` - Process speech input  
- `POST /api/voice/partner/status` - Call status updates
- `POST /api/voice/partner/recording` - Recording callbacks

### Partner Management

- `GET /api/partners/:slug/phone` - Get phone number and stats
- `POST /api/partners/:slug/phone/provision` - Provision new number
- `PUT /api/partners/:slug/phone/greeting` - Update greeting
- `GET /api/partners/:slug/phone/calls` - Call history with transcripts
- `GET /api/partners/:slug/phone/calls/:callSid` - Detailed call info

### Audio Serving

- `GET /api/voice/audio/:filename` - Serve generated audio files

## 🔧 Configuration

### Voice Settings

Default ElevenLabs configuration:
- **Voice**: Josh (`TxGEqnHWrfWFTfGW9XjX`)
- **Model**: `eleven_turbo_v2_5` (fastest)
- **Speed**: 1.15
- **Stability**: 0.4
- **Format**: `ulaw_8000` (Twilio compatible)

### George Voice Optimization

George is optimized for voice calls:
- Responses limited to 2-3 sentences max
- Always ends with a clear question
- Uses conversational tone, avoids technical jargon
- Maintains conversation context throughout the call
- Can book appointments, create leads, and quote services

### Partner Context

Each call includes:
- Partner name and services offered
- Caller's phone number
- Full conversation history
- Partner-specific greeting and branding

## 📊 Analytics & Monitoring

### Call Metrics (per partner)

- Total calls
- Completed calls  
- Leads created
- Jobs booked
- Average call duration
- Conversion rate

### Call Details

- Full transcripts
- Turn-by-turn conversation flow
- Audio recordings (if enabled)
- Lead/job outcomes
- Call costs

## 🛠️ Troubleshooting

### Common Issues

1. **Audio Quality Poor**
   - Check ElevenLabs API key is valid
   - Verify `ulaw_8000` format is being used
   - Test with shorter text responses

2. **Webhook Failures**
   - Ensure server is publicly accessible
   - Check Twilio webhook URLs are correct
   - Verify webhook endpoints return 200 status

3. **George Not Responding**
   - Check database tables exist
   - Verify partner slug is valid
   - Test George agent independently

4. **Phone Number Provisioning Fails**
   - Check Twilio account has available numbers
   - Try different area codes
   - Verify Twilio credentials

### Debugging

Enable verbose logging:

```bash
DEBUG=partner-voice* npm run dev
```

Check call logs in database:

```sql
SELECT * FROM voice_call_logs ORDER BY created_at DESC LIMIT 10;
SELECT * FROM voice_conversation_turns WHERE call_sid = 'CA...' ORDER BY turn_number;
```

## 🔐 Security

- All routes require `george_voice` feature (Growth+ tier)
- Rate limiting on webhooks and management endpoints
- Audio files are temporary and auto-cleaned
- Call data is encrypted and access-controlled via RLS

## 🚧 Future Enhancements

### Option B: Real-time Streaming (v2)

Upgrade to Twilio Media Streams + ElevenLabs WebSocket for lower latency:
- Direct audio streaming
- Real-time speech recognition
- Instant voice synthesis
- Sub-second response times

### Advanced Features

- Multi-language support
- Voice analytics (sentiment, urgency detection)
- Custom voice cloning for partners
- Advanced call routing and IVR
- Integration with partner CRMs

## 📋 Testing

Run the complete test suite:

```bash
node test-voice-system.cjs
```

For production deployment:

1. Update `BASE_URL` environment variable
2. Configure HTTPS endpoints for webhooks
3. Set up monitoring and alerting
4. Test with real phone calls
5. Configure call recording retention

## 🎉 Success Metrics

The system is working when:
- Partners can provision phone numbers easily
- Calls are answered immediately with custom greetings
- George responds naturally with partner context
- Leads and appointments are created automatically
- Call analytics show conversion rates

---

**Built with ❤️ for UpTend Partners**

Transform your customer service with AI-powered voice assistance that never sleeps, never misses a call, and always represents your brand perfectly.