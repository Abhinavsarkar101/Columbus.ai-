// Section 3.1: Specialization Catalog (single source of truth, in this exact order)
export type ArchetypeCode = 'AN' | 'ST' | 'BU' | 'PE' | 'CO' | 'OP';

export interface CatalogItem {
  code: string;
  name: string;
  primaryType: ArchetypeCode;
  secondaryType: ArchetypeCode;
  digital: boolean;
  groupName: string;
}

export interface CatalogGroup {
  id: string;
  name: string;
  archetype: ArchetypeCode;
  items: CatalogItem[];
}

export const CATALOG_GROUPS: CatalogGroup[] = [
  {
    id: 'finance_data',
    name: 'Finance and Data',
    archetype: 'AN',
    items: [
      { code: 'FIN', name: 'Finance (Corporate Finance and Investments)', primaryType: 'AN', secondaryType: 'OP', digital: false, groupName: 'Finance and Data' },
      { code: 'BNK', name: 'Banking and Insurance', primaryType: 'AN', secondaryType: 'OP', digital: false, groupName: 'Finance and Data' },
      { code: 'FTC', name: 'Fintech', primaryType: 'AN', secondaryType: 'BU', digital: true, groupName: 'Finance and Data' },
      { code: 'ANA', name: 'Business Analytics', primaryType: 'AN', secondaryType: 'OP', digital: false, groupName: 'Finance and Data' },
      { code: 'DSA', name: 'Data Science and AI for Business', primaryType: 'AN', secondaryType: 'BU', digital: true, groupName: 'Finance and Data' },
    ],
  },
  {
    id: 'strategy_genmgmt',
    name: 'Strategy and General Management',
    archetype: 'ST',
    items: [
      { code: 'STR', name: 'Strategy and Consulting', primaryType: 'ST', secondaryType: 'AN', digital: false, groupName: 'Strategy and General Management' },
      { code: 'INT', name: 'International Business', primaryType: 'ST', secondaryType: 'CO', digital: false, groupName: 'Strategy and General Management' },
      { code: 'GEN', name: 'General Management', primaryType: 'ST', secondaryType: 'CO', digital: false, groupName: 'Strategy and General Management' },
    ],
  },
  {
    id: 'product_ent',
    name: 'Product and Entrepreneurship',
    archetype: 'BU',
    items: [
      { code: 'PM', name: 'Product Management', primaryType: 'BU', secondaryType: 'AN', digital: false, groupName: 'Product and Entrepreneurship' },
      { code: 'ENT', name: 'Entrepreneurship and Innovation', primaryType: 'BU', secondaryType: 'PE', digital: false, groupName: 'Product and Entrepreneurship' },
      { code: 'FAM', name: 'Family Business Management', primaryType: 'BU', secondaryType: 'ST', digital: false, groupName: 'Product and Entrepreneurship' },
    ],
  },
  {
    id: 'marketing_sales',
    name: 'Marketing, Sales and Media',
    archetype: 'PE',
    items: [
      { code: 'MKT', name: 'Marketing (Brand and Consumer)', primaryType: 'PE', secondaryType: 'ST', digital: false, groupName: 'Marketing, Sales and Media' },
      { code: 'DM', name: 'Digital Marketing and Social Media', primaryType: 'PE', secondaryType: 'AN', digital: true, groupName: 'Marketing, Sales and Media' },
      { code: 'SAL', name: 'Sales and Business Development', primaryType: 'PE', secondaryType: 'ST', digital: false, groupName: 'Marketing, Sales and Media' },
      { code: 'MED', name: 'Media, Entertainment and Sports Management', primaryType: 'PE', secondaryType: 'BU', digital: false, groupName: 'Marketing, Sales and Media' },
    ],
  },
  {
    id: 'people_health',
    name: 'People, Health and Society',
    archetype: 'CO',
    items: [
      { code: 'HR', name: 'Human Resource Management', primaryType: 'CO', secondaryType: 'ST', digital: false, groupName: 'People, Health and Society' },
      { code: 'HCM', name: 'Healthcare and Hospital Management', primaryType: 'CO', secondaryType: 'OP', digital: false, groupName: 'People, Health and Society' },
      { code: 'PHA', name: 'Pharma and Biotech Management', primaryType: 'CO', secondaryType: 'AN', digital: false, groupName: 'People, Health and Society' },
      { code: 'ESG', name: 'Sustainability and ESG', primaryType: 'CO', secondaryType: 'ST', digital: false, groupName: 'People, Health and Society' },
      { code: 'HOS', name: 'Hospitality, Tourism and Aviation Management', primaryType: 'CO', secondaryType: 'OP', digital: false, groupName: 'People, Health and Society' },
      { code: 'PPN', name: 'Public Policy and Nonprofit Management', primaryType: 'CO', secondaryType: 'ST', digital: false, groupName: 'People, Health and Society' },
    ],
  },
  {
    id: 'operations_tech',
    name: 'Operations, Technology and Projects',
    archetype: 'OP',
    items: [
      { code: 'OPS', name: 'Operations Management', primaryType: 'OP', secondaryType: 'AN', digital: false, groupName: 'Operations, Technology and Projects' },
      { code: 'SCM', name: 'Supply Chain and Logistics', primaryType: 'OP', secondaryType: 'AN', digital: false, groupName: 'Operations, Technology and Projects' },
      { code: 'ITM', name: 'IT and Systems Management', primaryType: 'OP', secondaryType: 'AN', digital: false, groupName: 'Operations, Technology and Projects' },
      { code: 'PRJ', name: 'Project Management', primaryType: 'OP', secondaryType: 'CO', digital: false, groupName: 'Operations, Technology and Projects' },
      { code: 'RET', name: 'Retail and E-commerce Management', primaryType: 'OP', secondaryType: 'PE', digital: true, groupName: 'Operations, Technology and Projects' },
      { code: 'AGR', name: 'Agri-business and Rural Management', primaryType: 'OP', secondaryType: 'CO', digital: false, groupName: 'Operations, Technology and Projects' },
      { code: 'REI', name: 'Real Estate and Infrastructure Management', primaryType: 'OP', secondaryType: 'ST', digital: false, groupName: 'Operations, Technology and Projects' },
    ],
  },
];

// Flat catalog preserving exact catalog order
export const SPECIALIZATION_CATALOG: CatalogItem[] = CATALOG_GROUPS.flatMap((g) => g.items);
export const CATALOG_ITEMS = SPECIALIZATION_CATALOG;

export const CATALOG_BY_CODE: Record<string, CatalogItem> = SPECIALIZATION_CATALOG.reduce(
  (acc, item) => {
    acc[item.code] = item;
    return acc;
  },
  {} as Record<string, CatalogItem>
);

export const SPECIALIZATION_DISCLAIMER_NOTE = 'Your college may offer only some of these. Check its list.';
