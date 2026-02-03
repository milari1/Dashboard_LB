'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function DataPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    fetchSales();
  }, [page, search]);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      });
      if (search) params.append('search', search);

      const res = await fetch(`/api/sales?${params}`);
      const data = await res.json();
      setSales(data.sales || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const handleExport = () => {
    // Simple CSV export
    const headers = ['Date', 'Branch', 'Client', 'Items', 'Qty', 'Amount', 'Invoice'];
    const rows = sales.map(sale => [
      formatDate(sale.sale_date),
      sale.branch || '',
      sale.client || '',
      sale.items || '',
      sale.qty || '',
      sale.price_subtotal_with_tax_usd || '',
      sale.invoice_number || '',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Sales Data</h1>
        <p className="text-muted-foreground">
          Browse and export detailed sales records
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>All Sales Records</CardTitle>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="flex gap-2 flex-1 sm:flex-initial">
                <input
                  type="text"
                  placeholder="Search items, client, invoice..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="border rounded px-3 py-2 text-sm flex-1 sm:w-64"
                />
                <button
                  onClick={handleSearch}
                  className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 text-sm font-medium"
                >
                  <Search className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={handleExport}
                className="px-4 py-2 border rounded hover:bg-gray-50 text-sm font-medium flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr className="text-left">
                      <th className="pb-3 font-medium">Date</th>
                      <th className="pb-3 font-medium">Branch</th>
                      <th className="pb-3 font-medium">Client</th>
                      <th className="pb-3 font-medium">Items</th>
                      <th className="pb-3 font-medium text-right">Qty</th>
                      <th className="pb-3 font-medium text-right">Amount</th>
                      <th className="pb-3 font-medium">Invoice</th>
                      <th className="pb-3 font-medium">Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map((sale) => (
                      <tr key={sale.id} className="border-b hover:bg-gray-50">
                        <td className="py-3">{formatDate(sale.sale_date)}</td>
                        <td className="py-3">{sale.branch || '-'}</td>
                        <td className="py-3">{sale.client || '-'}</td>
                        <td className="py-3 max-w-xs truncate">{sale.items || '-'}</td>
                        <td className="py-3 text-right">
                          {sale.qty ? Number(sale.qty).toFixed(2) : '-'}
                        </td>
                        <td className="py-3 text-right font-medium">
                          ${sale.price_subtotal_with_tax_usd ? Number(sale.price_subtotal_with_tax_usd).toFixed(2) : '0.00'}
                        </td>
                        <td className="py-3">{sale.invoice_number || '-'}</td>
                        <td className="py-3">{sale.category || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
