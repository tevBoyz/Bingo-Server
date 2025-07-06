function generateBingoCard() {
  const columns = {
    B: getUniqueRandomNumbers(1, 15, 5),
    I: getUniqueRandomNumbers(16, 30, 5),
    N: getUniqueRandomNumbers(31, 45, 5),
    G: getUniqueRandomNumbers(46, 60, 5),
    O: getUniqueRandomNumbers(61, 75, 5),
  };

  // Set center "free space"
  columns.N[2] = 'FREE';

  // Build 5x5 grid: each row collects from B-I-N-G-O
  const card = Array.from({ length: 5 }, (_, rowIndex) =>
    ['B', 'I', 'N', 'G', 'O'].map(col => columns[col][rowIndex])
  );

  return card;
}

function getUniqueRandomNumbers(min, max, count) {
  const nums = new Set();
  while (nums.size < count) {
    nums.add(Math.floor(Math.random() * (max - min + 1)) + min);
  }
  return [...nums];
}

function checkBingo(card, calledNumbers) {
  if (!Array.isArray(card) || !Array.isArray(card[0])) {
    console.error("Invalid card structure:", card);
    return false;
  }

  if (!Array.isArray(calledNumbers)) {
    console.error("calledNumbers is not an array:", calledNumbers);
    return false;
  }

  // Now it's safe to use .includes()
  for (let row of card) {
    if (row.every(num => num === "FREE" || calledNumbers.includes(num))) return true;
  }

  // Check columns
  for (let col = 0; col < 5; col++) {
    let columnMatch = true;
    for (let row = 0; row < 5; row++) {
      const num = card[row][col];
      if (num !== "FREE" && !calledNumbers.includes(num)) {
        columnMatch = false;
        break;
      }
    }
    if (columnMatch) return true;
  }

  // Diagonals
  let diag1 = true;
  let diag2 = true;
  for (let i = 0; i < 5; i++) {
    const a = card[i][i];
    const b = card[i][4 - i];
    if (a !== "FREE" && !calledNumbers.includes(a)) diag1 = false;
    if (b !== "FREE" && !calledNumbers.includes(b)) diag2 = false;
  }

  return diag1 || diag2;
}




module.exports = { generateBingoCard, checkBingo };
