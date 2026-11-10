export type RoleFamily = 'ANALYTIC' | 'CLIENT' | 'BUILD' | 'OPS_PEOPLE';

export interface SpecializedRoleMapping {
  specialization: string;
  roles: Record<RoleFamily, string>;
  campusFallbacks: Record<RoleFamily, string>;
}

export const SPECIALIZATIONS_LIST: string[] = [
  'Finance',
  'Marketing',
  'Human Resources',
  'Operations and Supply Chain',
  'Business Analytics',
  'Strategy and Consulting',
  'Product Management',
  'Entrepreneurship',
  'International Business',
  'Healthcare Management',
  'Sustainability and ESG',
  'IT and Technology Management',
];

export const SPECIALIZED_ROLE_MAP: Record<string, SpecializedRoleMapping> = {
  Finance: {
    specialization: 'Finance',
    roles: {
      ANALYTIC: 'FP&A analyst',
      CLIENT: 'Investment banking analyst',
      BUILD: 'Corporate finance or treasury analyst',
      OPS_PEOPLE: 'Credit or risk operations',
    },
    campusFallbacks: {
      ANALYTIC: 'Commercial Credit Analyst',
      CLIENT: 'Financial Services Associate',
      BUILD: 'Management Trainee - Corporate Finance',
      OPS_PEOPLE: 'Banking Operations Executive',
    },
  },
  Marketing: {
    specialization: 'Marketing',
    roles: {
      ANALYTIC: 'Marketing analyst',
      CLIENT: 'Key account or brand manager',
      BUILD: 'Brand or product marketing associate',
      OPS_PEOPLE: 'Marketing operations executive',
    },
    campusFallbacks: {
      ANALYTIC: 'Digital Media Analyst',
      CLIENT: 'Area Sales Manager Trainee',
      BUILD: 'Management Trainee - Retail Marketing',
      OPS_PEOPLE: 'Trade Marketing Executive',
    },
  },
  'Human Resources': {
    specialization: 'Human Resources',
    roles: {
      ANALYTIC: 'HR analytics associate',
      CLIENT: 'Talent acquisition partner',
      BUILD: 'L&D program designer',
      OPS_PEOPLE: 'HR business partner trainee',
    },
    campusFallbacks: {
      ANALYTIC: 'Compensation & Benefits Associate',
      CLIENT: 'Campus Relations & Recruitment Lead',
      BUILD: 'Employee Engagement Executive',
      OPS_PEOPLE: 'HR Operations Trainee',
    },
  },
  'Operations and Supply Chain': {
    specialization: 'Operations and Supply Chain',
    roles: {
      ANALYTIC: 'Supply chain analyst',
      CLIENT: 'Vendor or account manager',
      BUILD: 'Process improvement lead',
      OPS_PEOPLE: 'Operations executive',
    },
    campusFallbacks: {
      ANALYTIC: 'Procurement Specialist',
      CLIENT: 'Warehouse Dispatch Manager',
      BUILD: 'Quality Assurance Coordinator',
      OPS_PEOPLE: 'Fulfillment Operations Supervisor',
    },
  },
  'Business Analytics': {
    specialization: 'Business Analytics',
    roles: {
      ANALYTIC: 'Data analyst',
      CLIENT: 'Analytics consultant',
      BUILD: 'Data product analyst',
      OPS_PEOPLE: 'Business intelligence analyst',
    },
    campusFallbacks: {
      ANALYTIC: 'MIS & Reporting Analyst',
      CLIENT: 'Junior BI Consultant',
      BUILD: 'Operations Data Associate',
      OPS_PEOPLE: 'Dashboard Reporting Specialist',
    },
  },
  'Strategy and Consulting': {
    specialization: 'Strategy and Consulting',
    roles: {
      ANALYTIC: 'Consulting analyst',
      CLIENT: 'Associate consultant',
      BUILD: 'Business development associate',
      OPS_PEOPLE: 'Transformation associate',
    },
    campusFallbacks: {
      ANALYTIC: 'Market Research Associate',
      CLIENT: 'Client Solutions Executive',
      BUILD: 'Strategic Partnerships Associate',
      OPS_PEOPLE: 'Internal Strategy Coordinator',
    },
  },
  'Product Management': {
    specialization: 'Product Management',
    roles: {
      ANALYTIC: 'Product analyst',
      CLIENT: 'Customer success or partner manager',
      BUILD: 'Associate product manager',
      OPS_PEOPLE: 'Product operations associate',
    },
    campusFallbacks: {
      ANALYTIC: 'Business Systems Analyst',
      CLIENT: 'Account Onboarding Specialist',
      BUILD: 'Digital Project Coordinator',
      OPS_PEOPLE: 'Release Operations Associate',
    },
  },
  Entrepreneurship: {
    specialization: 'Entrepreneurship',
    roles: {
      ANALYTIC: 'Business development analyst',
      CLIENT: 'Partnerships manager',
      BUILD: 'Startup associate',
      OPS_PEOPLE: 'Growth or operations associate',
    },
    campusFallbacks: {
      ANALYTIC: 'Commercial Growth Executive',
      CLIENT: 'Venture Scout / Incubation Associate',
      BUILD: 'Founder’s Office Associate',
      OPS_PEOPLE: 'General Management Trainee',
    },
  },
  'International Business': {
    specialization: 'International Business',
    roles: {
      ANALYTIC: 'Export analyst',
      CLIENT: 'Global account manager',
      BUILD: 'International market entry associate',
      OPS_PEOPLE: 'Trade operations executive',
    },
    campusFallbacks: {
      ANALYTIC: 'Customs & Documentation Executive',
      CLIENT: 'Cross-Border Sales Associate',
      BUILD: 'Regional Trade Representative',
      OPS_PEOPLE: 'International Logistics Coordinator',
    },
  },
  'Healthcare Management': {
    specialization: 'Healthcare Management',
    roles: {
      ANALYTIC: 'Healthcare data analyst',
      CLIENT: 'Hospital or pharma account executive',
      BUILD: 'Program manager',
      OPS_PEOPLE: 'Hospital operations associate',
    },
    campusFallbacks: {
      ANALYTIC: 'Health Insurance Claims Analyst',
      CLIENT: 'Pharma Field Representative',
      BUILD: 'Clinical Program Assistant',
      OPS_PEOPLE: 'Patient Services Coordinator',
    },
  },
  'Sustainability and ESG': {
    specialization: 'Sustainability and ESG',
    roles: {
      ANALYTIC: 'ESG analyst',
      CLIENT: 'Sustainability consultant',
      BUILD: 'ESG reporting lead',
      OPS_PEOPLE: 'Compliance and CSR associate',
    },
    campusFallbacks: {
      ANALYTIC: 'Carbon Audit Trainee',
      CLIENT: 'CSR Project Officer',
      BUILD: 'Environmental Compliance Associate',
      OPS_PEOPLE: 'Sustainability Operations Coordinator',
    },
  },
  'IT and Technology Management': {
    specialization: 'IT and Technology Management',
    roles: {
      ANALYTIC: 'IT analyst',
      CLIENT: 'Technology consultant',
      BUILD: 'Digital transformation associate',
      OPS_PEOPLE: 'IT operations or service manager',
    },
    campusFallbacks: {
      ANALYTIC: 'IT Support & Systems Analyst',
      CLIENT: 'Client Solutions Tech Representative',
      BUILD: 'Software Deployment Coordinator',
      OPS_PEOPLE: 'Cloud & Infrastructure Helpdesk Lead',
    },
  },
};
