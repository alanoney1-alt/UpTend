# UpTend Alexa Skill

"Alexa, ask UpTend to find me AC repair"

## Setup (Alan's Manual Steps)

1. Go to https://developer.amazon.com/alexa/console/ask
2. Click "Create Skill"
3. Name: "UpTend Home Services"
4. Model: Custom
5. Hosting: Alexa-Hosted (Node.js)
6. Copy `interaction-model.json` content into the JSON Editor (Build tab → Interaction Model → JSON Editor)
7. Copy `lambda/index.js` into the Code tab (replace index.js)
8. Build Model → Deploy
9. Test in the Test tab: "open up tend"

## Invocation

- "Alexa, open UpTend"
- "Alexa, ask UpTend to find me AC repair"
- "Alexa, tell UpTend my AC is broken"
- "Alexa, ask UpTend how much does HVAC cost"

## How It Works

1. User describes their issue
2. If phone permission granted → submits to UpTend API → tech calls back
3. If no phone → gives them (855) 901-2072 to call
4. Non-HVAC → directs to waitlist at uptendapp.com

## Publishing

To publish to the Alexa Skill Store:
1. Fill out Distribution tab (icons, description, category)
2. Submit for certification
3. Takes 1-3 business days

Note: The skill works immediately in Test/Development mode on your own Alexa devices.
