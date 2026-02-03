// calc.js

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

  const CORNERS = [0, 2, 6, 8];
  const EDGES = [1, 3, 5, 7];
  const CENTER = 4;

  function cloneBoard(board) {
    return board.slice();
  }

  function isBoardEmpty(board) {
    return board.every((c) => c === EMPTY);
  }

  function getAvailableMoves(board) {
    const moves = [];
    for (let i = 0; i < 9; i++) {
      if (board[i] === EMPTY) moves.push(i);
    }
    return moves;
  }

  function checkWin(board, player) {
    return LINES.some(
      ([a, b, c]) =>
        board[a] === player && board[b] === player && board[c] === player
    );
  }

  function findWinningMove(board, player) {
    for (const [a, b, c] of LINES) {
      const line = [board[a], board[b], board[c]];
      const countPlayer = line.filter((v) => v === player).length;
      const countEmpty = line.filter((v) => v === EMPTY).length;
      if (countPlayer === 2 && countEmpty === 1) {
        if (board[a] === EMPTY) return a;
        if (board[b] === EMPTY) return b;
        if (board[c] === EMPTY) return c;
      }
    }
    return null;
  }

  function simulateMove(board, index, player) {
    const b = cloneBoard(board);
    b[index] = player;
    return b;
  }

  // Basic scoring: X wants max, O wants min
  function evaluateBoard(board) {
    if (checkWin(board, X)) return 1;
    if (checkWin(board, O)) return -1;
    if (getAvailableMoves(board).length === 0) return 0;
    return null;
  }

  function minimax(board, player) {
    const evalScore = evaluateBoard(board);
    if (evalScore !== null) return { score: evalScore, move: null };

    const moves = getAvailableMoves(board);
    let bestMove = null;

    if (player === X) {
      let bestScore = -Infinity;
      for (const m of moves) {
        const next = simulateMove(board, m, X);
        const { score } = minimax(next, O);
        if (score > bestScore) {
          bestScore = score;
          bestMove = m;
        }
      }
      return { score: bestScore, move: bestMove };
    } else {
      let bestScore = Infinity;
      for (const m of moves) {
        const next = simulateMove(board, m, O);
        const { score } = minimax(next, X);
        if (score < bestScore) {
          bestScore = score;
          bestMove = m;
        }
      }
      return { score: bestScore, move: bestMove };
    }
  }

  // Helper: count how many of a player on board
  function countPlayer(board, player) {
    return board.filter((c) => c === player).length;
  }

  function firstXIndex(board) {
    for (let i = 0; i < 9; i++) if (board[i] === X) return i;
    return null;
  }

  function firstOIndex(board) {
    for (let i = 0; i < 9; i++) if (board[i] === O) return i;
    return null;
  }

  function isCorner(i) {
    return CORNERS.includes(i);
  }

  function isEdge(i) {
    return EDGES.includes(i);
  }

  function oppositeCorner(i) {
    switch (i) {
      case 0: return 8;
      case 2: return 6;
      case 6: return 2;
      case 8: return 0;
      default: return null;
    }
  }

  function adjacentCornersTo(index) {
    // For a given corner, return the two corners that share an edge with it
    switch (index) {
      case 0: return [2, 6];
      case 2: return [0, 8];
      case 6: return [0, 8];
      case 8: return [2, 6];
      default: return [];
    }
  }

  function cornerAcrossButNotThroughO(board, xCorner, oIndex) {
    // "use only the corner across from ur X NOT diagonally or across the O,
    // but horizontally/vertically, and one with no O in the way"
    // We'll approximate by picking a corner that shares a row or column with X,
    // but not with O, and is empty.
    const candidates = CORNERS.filter((c) => board[c] === EMPTY);
    for (const c of candidates) {
      const sameRowAsX = Math.floor(c / 3) === Math.floor(xCorner / 3);
      const sameColAsX = c % 3 === xCorner % 3;
      const sameRowAsO = Math.floor(c / 3) === Math.floor(oIndex / 3);
      const sameColAsO = c % 3 === oIndex % 3;
      if ((sameRowAsX || sameColAsX) && !(sameRowAsO || sameColAsO)) {
        return c;
      }
    }
    return null;
  }

  function lastCorner(board) {
    const emptyCorners = CORNERS.filter((c) => board[c] === EMPTY);
    return emptyCorners.length ? emptyCorners[0] : null;
  }

  function anyEmptyCorner(board) {
    const emptyCorners = CORNERS.filter((c) => board[c] === EMPTY);
    return emptyCorners.length ? emptyCorners[0] : null;
  }

  function anyEmptyEdge(board) {
    const emptyEdges = EDGES.filter((e) => board[e] === EMPTY);
    return emptyEdges.length ? emptyEdges[0] : null;
  }

  // Try to create a fork (two winning lines)
  function findForkMove(board, player) {
    const moves = getAvailableMoves(board);
    for (const m of moves) {
      const b = simulateMove(board, m, player);
      let winningLines = 0;
      for (const [a, b1, c] of LINES) {
        const line = [b[a], b[b1], b[c]];
        const countP = line.filter((v) => v === player).length;
        const countE = line.filter((v) => v === EMPTY).length;
        if (countP === 2 && countE === 1) winningLines++;
      }
      if (winningLines >= 2) return m;
    }
    return null;
  }

  function getBestMoveInternal(board) {
    // 1. First move: board empty → corner
    if (isBoardEmpty(board)) {
      return CORNERS[Math.floor(Math.random() * CORNERS.length)];
    }

    // 2. If X can win now, do it
    const winNow = findWinningMove(board, X);
    if (winNow !== null) return winNow;

    // 3. If O can win next, block
    const blockNow = findWinningMove(board, O);
    if (blockNow !== null) return blockNow;

    const xCount = countPlayer(board, X);
    const oCount = countPlayer(board, O);
    const firstX = firstXIndex(board);
    const firstO = firstOIndex(board);

    // 4. Strategy: X started in a corner
    if (xCount === 1 && isCorner(firstX)) {
      // Opponent's first move cases

      // 4a. O in opposite corner → take any other corner
      if (isCorner(firstO) && firstO === oppositeCorner(firstX)) {
        const otherCorners = CORNERS.filter(
          (c) => c !== firstX && c !== firstO && board[c] === EMPTY
        );
        if (otherCorners.length) return otherCorners[0];
      }

      // 4b. O in center → take opposite corner (X O X diagonal)
      if (firstO === CENTER) {
        const opp = oppositeCorner(firstX);
        if (opp !== null && board[opp] === EMPTY) return opp;
      }

      // 4c. O in edge below/above/left/right X → special across corner
      if (isEdge(firstO)) {
        const special = cornerAcrossButNotThroughO(board, firstX, firstO);
        if (special !== null) return special;
      }

      // 4d. O in some other corner (not opposite) → take opposite corner of O or another corner
      if (isCorner(firstO) && firstO !== oppositeCorner(firstX)) {
        const oppO = oppositeCorner(firstO);
        if (oppO !== null && board[oppO] === EMPTY) return oppO;
        const anyC = anyEmptyCorner(board);
        if (anyC !== null) return anyC;
      }
    }

    // 5. Later-game strategy: always try fork for X
    const forkMove = findForkMove(board, X);
    if (forkMove !== null) return forkMove;

    // 6. Block O's fork if possible
    const oForkMove = findForkMove(board, O);
    if (oForkMove !== null) {
      // If we can block directly, do it
      if (board[oForkMove] === EMPTY) return oForkMove;
    }

    // 7. Prefer center if free
    if (board[CENTER] === EMPTY) return CENTER;

    // 8. Prefer any corner
    const corner = anyEmptyCorner(board);
    if (corner !== null) return corner;

    // 9. Prefer any edge
    const edge = anyEmptyEdge(board);
    if (edge !== null) return edge;

    // 10. Fallback: minimax (perfect play)
    const { move } = minimax(board, X);
    if (move !== null) return move;

    // 11. Absolute fallback: first available
    const moves = getAvailableMoves(board);
    return moves.length ? moves[0] : 0;
  }

  window.getBestMove = function (board) {
    const index = getBestMoveInternal(board);
    return { index };
  };
})();
