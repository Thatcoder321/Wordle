const CURRENT_WORD = process.env.CURRENT_WORD || null;

export default async function handler(req, res) {
    const { guesses } = req.body;
    const formatted = guesses.map(g => {
      return `Guess: ${g.guess}\nFeedback: ${g.feedback.map((f, i) => {
        const pos = i + 1;
        const letter = g.guess[i];
        if (f === 'green') return `${letter} is correct and in position ${pos}.`;
        if (f === 'yellow') return `${letter} is in the word but not in position ${pos}.`;
        return `${letter} is not in the word.`;
      }).join(' ')}`;
    }).join('\n\n');
  
    // Build known info
    let knownGreens = Array(5).fill('_');
    let knownYellows = [];
    let knownGrays = new Set();

    guesses.forEach(g => {
      g.feedback.forEach((f, i) => {
        const letter = g.guess[i];
        if (f === 'green') knownGreens[i] = letter;
        else if (f === 'yellow') knownYellows.push(letter);
        else knownGrays.add(letter);
      });
    });

    const logicHints = `
Additional logic hints:
- Correct letters in correct positions: ${knownGreens.join('')}
- Letters in the word but unknown positions: ${[...new Set(knownYellows)].join(', ') || 'None'}
- Letters not in the word: ${[...knownGrays].filter(l => !knownYellows.includes(l) && !knownGreens.includes(l)).join(', ') || 'None'}
`;

    const prompt = `
You're playing Wordle.

RULES:
- Each guess must be a 5-letter word.
- I will tell you for each letter:
   • If it is correct and in the correct position
   • If it is in the word but in the wrong position
   • If it is not in the word

Here are the past guesses and their feedback:
${formatted}

${logicHints}
Use this information to logically eliminate possibilities and return your next 5-letter lowercase guess. Only respond with the guess.`;
  
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
    const raw = json.choices[0].message.content;
    const match = raw.match(/\b[a-zA-Z]{5}\b/);
    const guess = match ? match[0].toLowerCase() : "crane"; // fallback

    // Return both the guess and the current word used
    res.status(200).json({
      guess,
      answer: CURRENT_WORD || 'secret'
    });
}