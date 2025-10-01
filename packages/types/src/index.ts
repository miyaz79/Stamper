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
