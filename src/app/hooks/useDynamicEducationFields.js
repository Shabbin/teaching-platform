import { useMemo } from 'react';

export default function useDynamicEducationFields(educationTree, values) {
  const { educationSystem, board, level, group } = values;

  const boards = useMemo(() => {
    if (!educationTree || !educationSystem) return [];
    if (educationSystem === 'Bangla-Medium' || educationSystem === 'GED') return [];
    if (educationSystem === 'BCS') return ['Preliminary', 'Written', 'Viva'];
    if (educationSystem === 'Entrance-Exams') {
      return Object.keys(educationTree['Entrance-Exams'] || {});
    }
    return Object.keys(educationTree[educationSystem] || {});
  }, [educationTree, educationSystem]);

  const levels = useMemo(() => {
    if (!educationTree || !educationSystem) return [];

    if (educationSystem === 'Entrance-Exams') return [];

    if (
      educationSystem === 'University-Admission' &&
      ['Engineering', 'Medical', 'IBA'].includes(board)
    ) {
      return [];
    }

    if (educationSystem === 'Bangla-Medium') {
      return Object.keys(educationTree[educationSystem] || {});
    }

    if (educationSystem === 'University-Admission' && board === 'Public-University') {
      // Return units like Ka, Kha, Gha
      return Object.keys(educationTree[educationSystem]?.[board] || {});
    }

    return board ? Object.keys(educationTree[educationSystem]?.[board] || {}) : [];
  }, [educationTree, educationSystem, board]);

  const groups = useMemo(() => {
    if (educationSystem === 'Bangla-Medium') return ['Science', 'Commerce', 'Arts'];
    if (educationSystem === 'BCS') return ['General', 'Technical', 'Both'];
    return [];
  }, [educationSystem]);

const subjects = useMemo(() => {
  if (!educationTree || !educationSystem) return [];

  if (educationSystem === 'Bangla-Medium') {
    return level && group
      ? Object.keys(educationTree[educationSystem]?.[level]?.[group] || {})
      : [];
  }

  if (educationSystem === 'GED') {
    return Object.keys(educationTree[educationSystem] || {});
  }

  if (educationSystem === 'University-Admission') {
    const data = educationTree[educationSystem]?.[board];
    if (!data) return [];

    if (board === 'Public-University') return data?.Units || [];
    if (['Engineering', 'Medical'].includes(board)) return data?.Subjects || [];

    if (board === 'IBA') return Object.keys(data || {});
  }

  if (educationSystem === 'BCS') {
    const groupSubjects = educationTree[educationSystem]?.[group]?.[board];
    return Array.isArray(groupSubjects)
      ? groupSubjects
      : Object.keys(groupSubjects || {});
  }

  if (educationSystem === 'Entrance-Exams') {
    const parts = educationTree?.[educationSystem]?.[board];
    return Array.isArray(parts) ? parts : Object.keys(parts || {});
  }

  // Default: English-Medium etc.
  const subjectsObject = educationTree[educationSystem]?.[board]?.[level];
  return subjectsObject ? Object.keys(subjectsObject) : [];
}, [educationTree, educationSystem, board, level, group]);


  const targetedUniversities = useMemo(() => {
    return educationSystem === 'University-Admission' && board
      ? educationTree?.[educationSystem]?.[board]?.Universities || []
      : [];
  }, [educationTree, educationSystem, board]);

  const showSubLevel = useMemo(() => {
    if (!educationSystem || !board || !level) return false;
    if (
      educationSystem === 'English-Medium' &&
      ((board === 'CIE' || board === 'Edexcel') && level === 'A_Level')
    )
      return true;

    if (
      educationSystem === 'English-Medium' &&
      board === 'IB' &&
      (level === 'SL' || level === 'HL')
    )
      return true;

    return false;
  }, [educationSystem, board, level]);

  return {
    boards,
    groups,
    levels,
    subjects,
    targetedUniversities,
    showSubLevel,
  };
}
