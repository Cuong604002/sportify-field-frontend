import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Select } from 'antd';

export function PaginationBar({
  page = 0,
  pageSize = 10,
  totalItems = 0,
  totalPages = 1,
  onPageChange,
  onPageSizeChange
}) {
  const startItem = totalItems === 0 ? 0 : page * pageSize + 1;
  const endItem = Math.min((page + 1) * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2 border-t border-slate-200 text-sm text-slate-600">
      <div>
        Hiển thị <span className="font-semibold text-slate-900">{startItem} - {endItem}</span> trong tổng số{' '}
        <span className="font-semibold text-slate-900">{totalItems}</span> bản ghi
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span>Số dòng / trang:</span>
          <Select
            value={pageSize}
            onChange={onPageSizeChange}
            options={[
              { value: 10, label: '10' },
              { value: 20, label: '20' },
              { value: 50, label: '50' }
            ]}
            className="w-20"
            size="middle"
          />
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(0)}
            disabled={page === 0}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <span className="px-3 text-xs font-medium">
            Trang {page + 1} / {Math.max(totalPages, 1)}
          </span>

          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages - 1 || totalPages === 0}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(totalPages - 1)}
            disabled={page >= totalPages - 1 || totalPages === 0}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
