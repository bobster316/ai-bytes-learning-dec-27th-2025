
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

type SidebarFiltersProps = {
  filters: Record<string, string[]>;
  onFilterChange: (filters: Record<string, string[]>) => void;
};

const filterSections = [
  {
    title: 'Subject',
    options: ['AI Basics', 'Machine Learning', 'Deep Learning', 'Natural Language Processing', 'Computer Vision', 'AI Robotics'],
  },
  {
    title: 'Duration',
    options: ['All Durations', 'Under 60 mins', '60 mins (Standard)', 'Over 60 mins'],
  },
  {
    title: 'Level',
    options: ['Beginner', 'Intermediate', 'Advanced'],
  },
  {
    title: 'Payment Type',
    options: ['Free', 'Paid', 'Subscription'],
  },
];

export function SidebarFilters({ filters, onFilterChange }: SidebarFiltersProps) {
  const handleCheckboxChange = (sectionTitle: string, option: string) => {
    const newFilters = { ...filters };
    const sectionFilters = newFilters[sectionTitle] || [];
    const optionIndex = sectionFilters.indexOf(option);

    if (optionIndex > -1) {
      sectionFilters.splice(optionIndex, 1);
    } else {
      sectionFilters.push(option);
    }

    newFilters[sectionTitle] = sectionFilters;
    onFilterChange(newFilters);
  };

  return (
    <Card className="p-6">
      {filterSections.map((section, index) => (
        <div key={section.title} className={index < filterSections.length - 1 ? 'mb-6' : ''}>
          <h3 className="mb-4 text-base font-semibold">{section.title}</h3>
          <div className="space-y-3">
            {section.options.map((option) => (
              <div key={option} className="flex items-center">
                <input
                  type="checkbox"
                  id={option}
                  checked={filters[section.title]?.includes(option) || false}
                  onChange={() => handleCheckboxChange(section.title, option)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor={option} className="ml-3 text-sm text-gray-600">
                  {option}
                </label>
              </div>
            ))}
          </div>
        </div>
      ))}
      <Button
        variant="outline"
        className="mt-6 w-full"
        onClick={() => onFilterChange({})}
      >
        Clear All Filters
      </Button>
    </Card>
  );
}
