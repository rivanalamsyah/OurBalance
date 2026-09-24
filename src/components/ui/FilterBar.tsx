import type { ReactNode } from 'react';
import { Search } from 'lucide-react';
import { Input } from './Input';

export interface FilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  children?: ReactNode;
}

export function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Cari...',
  children,
}: FilterBarProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.75rem',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1rem',
      }}
    >
      <div style={{ minWidth: '240px', flex: '1' }}>
        <Input
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          leftIcon={<Search size={16} />}
          fullWidth
        />
      </div>
      {children && <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>{children}</div>}
    </div>
  );
}
