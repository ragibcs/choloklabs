import { createCompanyOSClient } from "./client";

export type { CompanyOSClient, InquiryInput, InquiryReceipt } from "./types";
export { parseInquiry } from "./inquiry";

/** Server-side singleton. Import only from route handlers and server components. */
export const companyOS = createCompanyOSClient();
