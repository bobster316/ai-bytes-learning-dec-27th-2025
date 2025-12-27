
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type SortBarProps = {
  sortBy: string;
  onSortChange: (value: string) => void;
};

export function SortBar({ sortBy, onSortChange }: SortBarProps) {
  return (
    <div className="flex items-center justify-end gap-4">
      {/* The design shows a toggle switch, but its function is not specified.
          I'll include it visually, but it will be disabled for now. */}
      <Switch disabled />
      <Select value={sortBy} onValueChange={onSortChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Newest First</SelectItem>
          <SelectItem value="oldest">Oldest First</SelectItem>
          <SelectItem value="popular">Most Popular</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
