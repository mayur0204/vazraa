import React, { useState, useEffect, useCallback } from 'react';
import { History, Search, Filter, Download, User, Settings, Database, ShieldAlert, Monitor, ChevronRight, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardContent, Button, Input, Badge } from '../../components/ui';
import { auditApi } from '../../lib/api';
import { formatDate } from '../../lib/utils';

export default function AuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedModule, setSelectedModule] = useState('ALL');

  const fetchLogs = useCallback(async (p = 0) => {
    setLoading(true);
    try {
      let res;
      if (selectedModule && selectedModule !== 'ALL') {
        res = await auditApi.getByModule(selectedModule, p, 15);
      } else {
        res = await auditApi.getAll(p, 15);
      }
      setLogs(res.data?.content || []);
      setTotalPages(res.data?.totalPages || 1);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedModule]);

  useEffect(() => {
    fetchLogs(page);
  }, [fetchLogs, page]);

  // Derived filtered logs by search text (client-side search helper)
  const filteredLogs = logs.filter(log => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (log.adminName || '').toLowerCase().includes(s) ||
      (log.details || '').toLowerCase().includes(s) ||
      (log.action || '').toLowerCase().includes(s) ||
      (log.module || '').toLowerCase().includes(s)
    );
  });

  const getSeverity = (action: string) => {
    if (['DELETE', 'REJECT', 'SUSPEND'].includes(action)) return 'high';
    if (['CREATE', 'UPDATE', 'LOGIN', 'APPROVE'].includes(action)) return 'medium';
    return 'low';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Audit Logs & Activity</h1>
          <p className="text-slate-500 dark:text-slate-400">Track all administrative actions and system-level changes</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchLogs(page)} disabled={loading} className="flex gap-2 mr-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Sync
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Download Full History
          </Button>
          <Button className="flex items-center gap-2 text-red-600 border-red-200 bg-red-50 hover:bg-red-100">
            <ShieldAlert className="w-4 h-4" />
            Security Alerts
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Filter Logs</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  className="pl-10" 
                  placeholder="Action, admin or details..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Module</label>
              <select 
                value={selectedModule}
                onChange={(e) => {
                  setSelectedModule(e.target.value);
                  setPage(0);
                }}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Modules</option>
                <option value="AUTH">Auth</option>
                <option value="CITIES">Cities</option>
                <option value="PRICING">Pricing</option>
                <option value="DESTINATIONS">Destinations</option>
                <option value="RIDE">Ride</option>
                <option value="DRIVERS">Drivers</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Logs Timeline */}
        <div className="lg:col-span-3 space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-16 text-slate-500 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
              <History className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="font-semibold">No audit logs found</p>
              <p className="text-xs text-slate-400 mt-1">Try resetting your search filter</p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const severity = getSeverity(log.action);
              return (
                <div key={log.id}>
                  <Card className="hover:border-indigo-200 transition-colors cursor-pointer group">
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row md:items-start gap-4">
                        <div className={`mt-1 h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          severity === 'high' ? 'bg-red-50 text-red-600' :
                          severity === 'medium' ? 'bg-orange-50 text-orange-600' :
                          'bg-indigo-50 text-indigo-600'
                        }`}>
                          {log.module === 'AUTH' ? <Monitor className="w-5 h-5" /> : 
                           log.module === 'PRICING' ? <Database className="w-5 h-5" /> :
                           log.module === 'CITIES' ? <Settings className="w-5 h-5" /> :
                           <Settings className="w-5 h-5" />}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                              {log.details || `${log.action} on ${log.module}`}
                            </h3>
                            <span className="text-xs text-slate-400">{formatDate(log.createdAt)}</span>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                              <User className="w-3.5 h-3.5" />
                              <span>{log.adminName || 'System'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 border-l border-slate-200 dark:border-slate-800 pl-4">
                              <Monitor className="w-3.5 h-3.5" />
                              <span>{log.ipAddress || 'unknown-ip'}</span>
                            </div>
                            <Badge variant={
                              severity === 'high' ? 'error' :
                              severity === 'medium' ? 'warning' :
                              'secondary'
                            } className="ml-auto">
                              {log.action}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="hidden md:flex flex-shrink-0 items-center justify-center p-2">
                          <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })
          )}
          
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 py-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.max(0, p - 1))} 
                disabled={page === 0}
              >
                Previous
              </Button>
              <span className="text-xs text-slate-500 font-medium">Page {page + 1} of {totalPages}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} 
                disabled={page >= totalPages - 1}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
