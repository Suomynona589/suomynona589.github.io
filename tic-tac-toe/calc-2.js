(function () {
  const X = "X";
  const O = "O";
  const EMPTY = "";

  const LINES = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  function getAvailableMoves(board) {
    const moves = [];
    for (let i = 0; i < 9; i++) {
      if (board[i] === EMPTY) moves.push(i);
    }
    return moves;
  }

  function findWinningMove(board, player) {
    for (const [a, b, c] of LINES) {
      const line = [board[a], board[b], board[c]];
      const countPlayer = line.filter(v => v === player).length;
      const countEmpty = line.filter(v => v === EMPTY).length;
      if (countPlayer === 2 && countEmpty === 1) {
        if (board[a] === EMPTY) return a;
        if (board[b] === EMPTY) return b;
        if (board[c] === EMPTY) return c;
      }
    }
    return null;
  }

  function scoreMove(board, move) {
    let score = 0;
    for (const [a, b, c] of LINES) {
      if ([a, b, c].includes(move)) {
        const line = [board[a], board[b], board[c]];
        const countX = line.filter(v => v === X).length;
        const countO = line.filter(v => v === O).length;
        if (countO === 0) score++;
      }
    }
    return score;
  }

  function getBestMoveInternal(board) {
    const winNow = findWinningMove(board, X);
    if (winNow !== null) return winNow;

    const blockNow = findWinningMove(board, O);
    if (blockNow !== null) return blockNow;

    const moves = getAvailableMoves(board);
    let best = moves[0];
    let bestScore = -1;

    for (const m of moves) {
      const s = scoreMove(board, m);
      if (s > bestScore) {
        bestScore = s;
        best = m;
      }
    }

    return best;
  }

  window.getBestMove = function (board) {
    return { index: getBestMoveInternal(board) };
  };
})();
