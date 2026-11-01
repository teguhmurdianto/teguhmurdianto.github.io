export const sectionIds = ['work', 'writing', 'fun'] as const;
export type SectionId = (typeof sectionIds)[number];

/** The Home page shows the three Sections under two headings; Writing and Fun share one. */
export const groups: { id: string; heading: string; sections: SectionId[] }[] = [
  { id: 'work', heading: 'Work', sections: ['work'] },
  { id: 'writing-and-fun', heading: 'Writing and fun', sections: ['writing', 'fun'] },
];
