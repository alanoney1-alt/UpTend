/**
 * UpTend Alexa Skill — Lambda Handler
 * 
 * "Alexa, ask UpTend to find me AC repair"
 * "Alexa, tell UpTend my AC is broken"
 * 
 * Flow:
 * 1. User describes their issue
 * 2. Alexa asks for phone number (consent or spoken)
 * 3. We submit to UpTend's Discovery API
 * 4. Tech calls them back within the hour
 */

const API_BASE = "https://uptendapp.com/api/discover";

exports.handler = async (event) => {
  const request = event.request;
  const session = event.session;

  if (request.type === "LaunchRequest") {
    return speak(
      "Welcome to UpTend. We connect you with vetted home service pros in Orlando. " +
      "Right now, HVAC services are live — AC repair, heating, and maintenance. " +
      "Just tell me what's going on. For example, say: my AC is blowing warm air.",
      true
    );
  }

  if (request.type === "IntentRequest") {
    const intent = request.intent.name;

    if (intent === "FindProIntent" || intent === "RequestServiceIntent") {
      const service = getSlot(request, "service") || "hvac";
      const issue = getSlot(request, "issue") || "";
      const neighborhood = getSlot(request, "neighborhood") || "";

      const isHVAC = /hvac|ac|air|heat|cool|furnace/i.test(service + issue);

      if (isHVAC) {
        // Try to get phone number from Alexa permissions
        const phone = await getAlexaPhoneNumber(event);
        
        if (phone) {
          // Submit the request directly
          try {
            const res = await fetch(`${API_BASE}/request-service`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: "Alexa User",
                phone: phone,
                service: "hvac",
                issue: issue || `${service} issue`,
                neighborhood: neighborhood,
              }),
            });
            const data = await res.json();
            
            if (data.success) {
              return speak(
                `Got it! I've submitted your request. A licensed HVAC tech from Comfort Solutions ` +
                `will call you back at your number within the hour. ` +
                `In the meantime, check your thermostat and air filter — sometimes it's a quick fix. ` +
                `Is there anything else I can help with?`,
                true
              );
            }
          } catch (e) {
            // Fall through to manual
          }
        }

        // No phone permission — give them the number to call
        return speak(
          `I found Comfort Solutions Tech, a licensed HVAC company in the Orlando area. ` +
          `They handle AC repair, heating, maintenance, and emergencies. ` +
          `To get connected, call 8 5 5, 9 0 1, 2 0 7 2. That's UpTend's direct line. ` +
          `George, our AI assistant, will take your info and have a tech call you back within the hour. ` +
          `Or you can go to uptendapp.com and fill out the quick form. Want to hear that number again?`,
          true
        );
      } else {
        // Non-HVAC service
        return speak(
          `We're launching ${service} in Orlando very soon. Right now, HVAC is our live service — ` +
          `AC repair, heating, and maintenance. If you need HVAC help, I can connect you right now. ` +
          `For ${service}, visit uptendapp.com to get on the waitlist and be first to know when it's available. ` +
          `Would you like HVAC help instead?`,
          true
        );
      }
    }

    if (intent === "GetPricingIntent") {
      const service = getSlot(request, "service") || "hvac";
      
      try {
        const res = await fetch(`${API_BASE}/pricing?service=${encodeURIComponent(service)}`);
        const data = await res.json();
        
        if (data.pricing) {
          const p = data.pricing;
          return speak(
            `Here's typical ${service} pricing in Orlando. ` +
            `The range is ${p.range || 'varies by job'}. ` +
            `A diagnostic visit usually runs $89 to $149. ` +
            `Want me to connect you with a pro for an exact quote?`,
            true
          );
        }
      } catch (e) {
        // Fall through
      }
      
      return speak(
        `I can give you general pricing, but every job is different. ` +
        `The best way to get an exact price is to talk to one of our pros. ` +
        `Want me to help you get connected?`,
        true
      );
    }

    if (intent === "AMAZON.HelpIntent") {
      return speak(
        "UpTend connects you with vetted home service pros in Orlando. " +
        "You can say things like: my AC is broken, find me HVAC repair, " +
        "or how much does AC repair cost. " +
        "HVAC is live right now. More services coming soon. What do you need?",
        true
      );
    }

    if (intent === "AMAZON.StopIntent" || intent === "AMAZON.CancelIntent") {
      return speak("Thanks for using UpTend. Stay cool!", false);
    }
  }

  return speak("Sorry, I didn't catch that. Try saying: my AC is broken.", true);
};

function speak(text, shouldEndSession = false) {
  return {
    version: "1.0",
    response: {
      outputSpeech: {
        type: "PlainText",
        text: text,
      },
      shouldEndSession: !shouldEndSession,
      reprompt: shouldEndSession ? {
        outputSpeech: {
          type: "PlainText",
          text: "What else can I help with? Say: find me HVAC repair, or stop to exit.",
        },
      } : undefined,
    },
  };
}

function getSlot(request, slotName) {
  try {
    return request.intent.slots[slotName]?.value || null;
  } catch {
    return null;
  }
}

async function getAlexaPhoneNumber(event) {
  try {
    const token = event.context?.System?.apiAccessToken;
    if (!token) return null;
    
    const endpoint = event.context?.System?.apiEndpoint || "https://api.amazonalexa.com";
    const res = await fetch(`${endpoint}/v2/accounts/~current/settings/Profile.mobileNumber`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (res.ok) {
      const data = await res.json();
      return data.countryCode && data.phoneNumber
        ? `+${data.countryCode}${data.phoneNumber}`
        : null;
    }
  } catch {
    return null;
  }
  return null;
}
