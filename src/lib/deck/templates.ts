import { FINANCING_TEMPLATES } from "./templates/financing";
import { SALES_TEMPLATES } from "./templates/sales";
import { MANAGEMENT_TEMPLATES } from "./templates/management";
import { PRODUCT_TEMPLATES } from "./templates/product";
import { STRATEGY_TEMPLATES, HR_TEMPLATES, CONSULTING_TEMPLATES } from "./templates/strategy-hr-consulting";
import {
  EDUCATION_TEMPLATES,
  MARKETING_TEMPLATES,
  PROJECT_TEMPLATES,
  CUSTOMER_SUCCESS_TEMPLATES,
  TECH_TEMPLATES,
  STARTUP_TEMPLATES,
  ANNUAL_TEMPLATES,
} from "./templates/other-categories";

export const DECK_TEMPLATES = [
  ...FINANCING_TEMPLATES,
  ...SALES_TEMPLATES,
  ...MANAGEMENT_TEMPLATES,
  ...PRODUCT_TEMPLATES,
  ...STRATEGY_TEMPLATES,
  ...HR_TEMPLATES,
  ...CONSULTING_TEMPLATES,
  ...EDUCATION_TEMPLATES,
  ...MARKETING_TEMPLATES,
  ...PROJECT_TEMPLATES,
  ...CUSTOMER_SUCCESS_TEMPLATES,
  ...TECH_TEMPLATES,
  ...STARTUP_TEMPLATES,
  ...ANNUAL_TEMPLATES,
];

export const getDeckTemplate = (id: string) => DECK_TEMPLATES.find((t) => t.id === id);
