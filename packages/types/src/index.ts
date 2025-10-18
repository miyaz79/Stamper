export type ISODate = string; // YYYY-MM-DD
export interface WorkItemInput {
  departmentId: string;
  projectId: string;
  taskId: string;
  hours: number; // 0.25刻み
}

export interface LeaveInput {
  leaveType: "full" | "hourly";
  hours?: number; // hourly の時のみ
}

export interface AttendanceSaveRequest {
  date: ISODate;
  workItems: WorkItemInput[];
  leave?: LeaveInput;
}

export interface CalcResults {
  totalHours: number;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  breakMinutes: number;
  overtimeHours: number;
  lateNightOvertimeHours: number;
}

export interface AttendanceSaveResponse {
  id: string;
  calcResults: CalcResults;
}

export type CategoryLevel = "department" | "project" | "task";

export interface CategoryNode {
  id: string;
  name: string;
  description: string;
  level: CategoryLevel;
  order: number;
  isActive: boolean;
  parentId: string | null;
  children: CategoryNode[];
}

export interface CategoryTotals {
  departments: number;
  projects: number;
  tasks: number;
  inactive: number;
}

export interface CategoryTreeResponse {
  categories: CategoryNode[];
  totals: CategoryTotals;
}

export interface CategoryCreateRequest {
  name?: string;
  description?: string;
  level: CategoryLevel;
  parentId?: string | null;
  isActive?: boolean;
  order?: number;
}

export interface CategoryCreateResponse {
  category: CategoryNode;
  categories: CategoryNode[];
  totals: CategoryTotals;
}

export interface CategoryUpdateRequest {
  name: string;
  description?: string;
  order: number;
  isActive: boolean;
  parentId: string | null;
}

export interface CategoryUpdateResponse {
  category: CategoryNode;
  categories: CategoryNode[];
  totals: CategoryTotals;
}
