export default async function handler(req, res) {
    const { guesses } = req.body;
    const formatted = guesses.map(g => {
      return `${g.guess.toUpperCase()} → ${g.feedback.map(l => {
        if (l === 'green') return '🟩';
        if (l === 'yellow') return '🟨';
        return '⬜';
      }).join('')}`;
    }).join('\n');
  
    const prompt = `
You're playing Wordle.

RULES:
• A green square (🟩) means correct letter and position.
• A yellow square (🟨) means the letter is in the word but wrong position.
• A white square (⬜) means the letter is not in the word at all.

Here are the past guesses and their feedback:
${formatted}

Please think through the logic of what you now know. Eliminate impossible letters and positions.
Only return a 5-letter lowercase word guess with no explanation.
`;
  
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are an expert Wordle solver. Use logical deduction from past guesses and feedback to find the correct word." },
          { role: "user", content: prompt }
        ]
      })
    });
  
    const json = await response.json();
    const guess = json.choices[0].message.content.trim().toLowerCase();
    res.status(200).json({ guess });
  }