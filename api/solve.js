export default async function handler(req, res) {
    const { guesses } = req.body;
    const formatted = guesses.map(g => {
      return `${g.guess.toUpperCase()} → ${g.feedback.map(l => {
        if (l === 'green') return '🟩';
        if (l === 'yellow') return '🟨';
        return '⬜';
      }).join('')}`;
    }).join('\n');
  
    const prompt = `You're playing Wordle. Based on these past guesses and feedback, what should your next guess be?\n\n${formatted}\n\nOnly respond with a 5-letter lowercase word guess.`;
  
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }]
      })
    });
  
    const json = await response.json();
    const guess = json.choices[0].message.content.trim().toLowerCase();
    res.status(200).json({ guess });
  }