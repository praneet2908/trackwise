import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv('GEMINI_API_KEY'))

def get_ai_advice(waste_score_data):
    """
    Takes waste score data and returns smart AI advice using Gemini.
    """
    breakdown_text = ""
    for item in waste_score_data['breakdown']:
        breakdown_text += f"- {item['name']} ({item['category']}): ₹{item['price']}/month\n"

    prompt = f"""
You are TrackWise, a sharp and friendly AI money advisor built specifically for Indians.
Analyze this user's monthly subscriptions and give practical advice.

User data:
- Waste Score: {waste_score_data['score']} / 100
- Total Monthly Spend: ₹{waste_score_data['total_monthly']}
- Estimated Monthly Waste: ₹{waste_score_data['wasted_amount']}
- Verdict: {waste_score_data['verdict']}

Their subscriptions:
{breakdown_text}

Give them:
1. One specific subscription to cancel or downgrade RIGHT NOW and why
2. How much they will save per year if they do it
3. One positive thing they are doing right
4. One motivational line to end

Rules:
- Keep it under 120 words
- Use ₹ for all amounts
- Be conversational and friendly
- No markdown formatting like ** or ##
- India-specific advice only
"""

    response = client.models.generate_content(
        model='gemini-2.0-flash',
        contents=prompt
    )
    return response.text.strip()


def get_quick_tip(category):
    tips = {
        'OTT': "Tip: Most OTT platforms offer annual plans at 30-40% discount. Consider switching.",
        'Music': "Tip: Spotify and JioSaavn both offer family plans — split with 5 people and pay almost nothing.",
        'Fitness': "Tip: Gym memberships are the number 1 forgotten subscription in India. Are you actually going?",
        'Insurance': "Tip: Never cancel insurance to save money. It is the one subscription always worth keeping.",
        'SIP': "Tip: SIPs are wealth builders, not expenses. Keep them running no matter what.",
        'EMI': "Tip: Paying EMI on time builds your CIBIL score. Never miss a payment.",
        'Cloud': "Tip: Check if you actually need that storage. Most people use less than 15GB.",
        'Productivity': "Tip: Many productivity tools have free tiers good enough for personal use.",
        'Mobile': "Tip: Jio and Airtel both offer annual prepaid plans that work out cheaper per month.",
        'AI Tools': "Tip: AI tools are only worth it if you use them daily. Otherwise switch to free alternatives.",
        'Finance': "Tip: Most finance tracking apps have excellent free tiers. Audit before paying."
    }
    return tips.get(category, "Tip: Review this subscription — is it still adding value to your life?")