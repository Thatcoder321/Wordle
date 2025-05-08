export default async function handler(req, res) {
    const prompt = "Give me a random 5-letter English word. Format it exactly like this:\n\nThe word is: \"_____\"";
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }]
      })
    });
  
    const json = await response.json();
    const match = json.choices[0].message.content.match(/"([a-zA-Z]{5})"/);
    const word = match ? match[1] : "crane";
    res.status(200).json({ word });
  }