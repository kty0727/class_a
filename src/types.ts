export interface Student {
  id: string;
  name: string;
  originalIndex?: number;
}

export interface PickHistoryItem {
  id: string;
  student: Student;
  timestamp: Date;
  roundNumber: number;
}

export interface StudentGroup {
  id: string;
  groupNumber: number;
  name: string;
  members: Student[];
  color: string;
}

export type ActiveTab = 'picker' | 'groups' | 'roster';
