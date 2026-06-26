export function createQuestion(correctCard, sessionCards, allCards) {
  // Lấy các đáp án sai từ bộ câu đang học (sessionCards)
  const sessionWrong = [
    ...new Set(
      sessionCards
        .filter((c) => c.answer.trim().toLowerCase() !== correctCard.answer.trim().toLowerCase())
        .map((c) => c.answer.trim())
    )
  ];

  let wrongAnswers = [];
  if (sessionWrong.length >= 3) {
    // Đủ 3 đáp án sai trong bộ đang học (cùng course và các day đang học)
    wrongAnswers = shuffle(sessionWrong).slice(0, 3);
  } else {
    // Fallback 1: lấy trong cùng course
    const courseWrong = [
      ...new Set(
        allCards
          .filter((c) => c.course === correctCard.course && c.answer.trim().toLowerCase() !== correctCard.answer.trim().toLowerCase())
          .map((c) => c.answer.trim())
      )
    ];
    const combinedCourseWrong = [...new Set([...sessionWrong, ...courseWrong])];

    if (combinedCourseWrong.length >= 3) {
      wrongAnswers = shuffle(combinedCourseWrong).slice(0, 3);
    } else {
      // Fallback 2: lấy từ toàn bộ CSV
      const allWrong = [
        ...new Set(
          allCards
            .filter((c) => c.answer.trim().toLowerCase() !== correctCard.answer.trim().toLowerCase())
            .map((c) => c.answer.trim())
        )
      ];
      const combinedAllWrong = [...new Set([...combinedCourseWrong, ...allWrong])];
      wrongAnswers = shuffle(combinedAllWrong).slice(0, 3);
    }
  }

  return {
    ...correctCard,
    options: shuffle([...wrongAnswers, correctCard.answer]),
  };
}

function shuffle(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
