'use client';

import { useState } from 'react';
import { Calendar, Building2, RefreshCw } from 'lucide-react';

interface FilterBarProps {
  onFilterChange?: (filters: FilterState) => void;
  branches?: string[];
}

export interface FilterState {
  startDate: string;
  endDate: string;
  selectedBranches: string[];
}

export function FilterBar({ onFilterChange, branches = [] }: FilterBarProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);

  const handleApply = () => {
    if (onFilterChange) {
      onFilterChange({ startDate, endDate, selectedBranches });
    }
  };

  const handleReset = () => {
    setStartDate('');
    setEndDate('');
    setSelectedBranches([]);
    if (onFilterChange) {
      onFilterChange({ startDate: '', endDate: '', selectedBranches: [] });
    }
  };

  const handleBranchToggle = (branch: string) => {
    setSelectedBranches(prev =>
      prev.includes(branch)
        ? prev.filter(b => b !== branch)
        : [...prev, branch]
    );
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm p-4 mb-6">
      <div className="flex flex-wrap gap-4 items-end">
        {/* Date Range */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium mb-2 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Date Range
          </label>
          <div className="flex gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border rounded px-3 py-2 text-sm flex-1"
              placeholder="Start Date"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border rounded px-3 py-2 text-sm flex-1"
              placeholder="End Date"
            />
          </div>
        </div>

        {/* Branch Filter */}
        {branches.length > 0 && (
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Branches
            </label>
            <div className="flex flex-wrap gap-2">
              {branches.map((branch) => (
                <button
                  key={branch}
                  onClick={() => handleBranchToggle(branch)}
                  className={`px-3 py-1 text-sm rounded border ${
                    selectedBranches.includes(branch)
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {branch}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleApply}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 text-sm font-medium"
          >
            Apply Filters
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 border rounded hover:bg-gray-50 text-sm font-medium flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
