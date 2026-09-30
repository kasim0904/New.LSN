import os
from google import genai
from google.genai import types

# 1. Ka akhriso API Key-ga faylka ama System Environment-ka
api_key = os.environ.get("GEMINI_API_KEY")

if not api_key:
    raise ValueError("Fadlan GEMINI_API_KEY ka dhex samee faylkaaga .env!")

client = genai.Client(api_key=api_key)

# 2. Qeex Tool (Aalad gaar ah oo uu Agent-ku isticmaalayo)
def xisaabi_wadarta(a: float, b: float) -> float:
    """Isku dar labo tiro oo soo celi wadarta dhabta ah."""
    return a + b

# 3. Samee Agent-ka iyadoo loo dhiibayo Tool-ka
def run_agent(prompt: str):
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction="Waxaad tahay AI Agent caawiya Developers-ka. Isticmaal tools-ka aad leedahay marka loo baahdo.",
            tools=[xisaabi_wadarta],
            temperature=0,
        ),
    )
    return response.text

# 4. Tijaabi Agent-ka
if __name__ == "__main__":
    jawaab = run_agent("Ma ii sheegi kartaa wadarta 150 iyo 350?")
    print("Agent Response:")
    print(jawaab)
  
