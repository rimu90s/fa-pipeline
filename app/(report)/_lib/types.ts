export type ReportRole =
  | "FA"
  | "BRANCH_MANAGER"
  | "COMPANY_ADMIN"
  | "VIEWER"
  | "AUDITOR";

export type ReportUserContext = {
  userId: string;
  roles: ReportRole[];
};

export type ApiErrorPayload = {
  error: {
    code: string;
    message: string;
  };
};

export type ApiSuccess<T> = {
  data: T;
};
